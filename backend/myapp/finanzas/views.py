# myapp/finanzas/views.py
from decimal import Decimal
from io import BytesIO
import os
import json
import hmac
import hashlib
from datetime import timedelta

from django.conf import settings
from django.db import transaction, connection, IntegrityError
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.http import FileResponse, Http404, HttpResponse
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.safestring import mark_safe

from rest_framework import status
import logging
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Concepto, Cargo, Documento, Pago, PagoDetalle,
    DocumentoArchivo, PagoIntento, Reembolso, EstadoCuentaUnidad
)
from .serializers import (
    ConceptoSerializer, CargoSerializer, DocumentoSerializer,
    PagoSerializer, PagoDetalleSerializer, DocumentoArchivoSerializer,
    PagoIntentoSerializer, ReembolsoSerializer, EstadoCuentaUnidadSerializer,
    PagoRegistrarSerializer
)

# PNG QR
try:
    import qrcode
except Exception:
    qrcode = None


# -------------------------------
# Helpers QR / Pasarela
# -------------------------------
def _sign_payload(payload: str) -> str:
    """Firma HMAC-SHA256 con SECRET_KEY para evitar manipulación del texto QR."""
    key = (getattr(settings, "DJANGO_SECRET_KEY", None) or settings.SECRET_KEY).encode()
    return hmac.new(key, payload.encode(), hashlib.sha256).hexdigest()


def _qr_text_for_pago(pago, intento_id: int, expires_at):
    """
    Texto 'EMV-like' simple para QR interno del sistema (no EMV real).
    """
    monto = f"{Decimal(pago.monto):.2f}"
    data = {
        "v": 1,
        "pago_id": pago.id,
        "intento_id": intento_id,
        "moneda": getattr(pago.documento, "moneda", "BOB") or "BOB",
        "monto": monto,
        "exp": int(expires_at.timestamp()),
    }
    s = json.dumps(data, separators=(",", ":"), ensure_ascii=False)
    sig = _sign_payload(s)
    return f"SCONDO://PAY?d={s}&sig={sig}"


# -------------------------------
# Helpers PDF
# -------------------------------
def get_weasyprint_HTML():
    """Importa HTML de WeasyPrint justo cuando se necesita."""
    try:
        from weasyprint import HTML  # noqa
        return HTML
    except Exception as e:
        # No está disponible (Windows sin GTK) -> lo reportamos hacia el fallback
        raise RuntimeError(f"WeasyPrint no disponible: {e}")


def render_recibo_pdf_bytes(request, contexto):
    """
    Intenta generar PDF con WeasyPrint. Si falla, usa ReportLab. Retorna bytes.
    """
    # 1) WeasyPrint (si está instalado correctamente)
    try:
        HTML = get_weasyprint_HTML()  # noqa: N806
        html_str = render_to_string("finanzas/recibo.html", contexto)
        base_url = request.build_absolute_uri("/")
        return HTML(string=html_str, base_url=base_url).write_pdf()
    except Exception:
        # 2) Fallback con ReportLab (puro Python)
        try:
            import importlib
            pagesizes = importlib.import_module("reportlab.lib.pagesizes")
            canvas_module = importlib.import_module("reportlab.pdfgen.canvas")
            units = importlib.import_module("reportlab.lib.units")
            A4 = getattr(pagesizes, "A4")
            canvas = canvas_module
            mm = getattr(units, "mm")
        except Exception as e:
            raise RuntimeError(f"No se pudo generar PDF (WeasyPrint/ReportLab): {e}")
        buff = BytesIO()
        c = canvas.Canvas(buff, pagesize=A4)
        w, h = A4

        # Encabezado simple
        c.setFont("Helvetica-Bold", 14)
        numero = contexto["documento"].numero or f"ID {contexto['documento'].id}"
        c.drawString(20*mm, (h-20*mm), f"RECIBO {numero}")

        c.setFont("Helvetica", 10)
        c.drawString(20*mm, (h-28*mm), f"Fecha: {timezone.localtime(contexto['hoy']).strftime('%Y-%m-%d %H:%M')}")
        c.drawString(20*mm, (h-34*mm), f"Moneda: {contexto['documento'].moneda}")
        if contexto.get("unidad"):
            c.drawString(20*mm, (h-40*mm), f"Unidad: {contexto['unidad']}")

        y = h - 55*mm
        c.setFont("Helvetica-Bold", 10)
        c.drawString(20*mm, y, "Detalle")
        y -= 6*mm
        c.setFont("Helvetica", 10)

        for d in contexto["detalles"]:
            linea = f"- {d.cargo.concepto} ({getattr(d.cargo, 'periodo', '')}): {d.monto_aplicado}"
            c.drawString(20*mm, y, linea)
            y -= 6*mm
            if y < 25*mm:
                c.showPage()
                y = h - 20*mm
                c.setFont("Helvetica", 10)

        y -= 4*mm
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20*mm, y, f"TOTAL: {contexto['documento'].total}")

        c.showPage()
        c.save()
        return buff.getvalue()


# -------------------------------
# ViewSets
# -------------------------------
class ConceptoViewSet(ModelViewSet):
    queryset = Concepto.objects.all().order_by("id")
    serializer_class = ConceptoSerializer


class CargoViewSet(ModelViewSet):
    """CRUD de cargos. Para filtrar por condominio: ?condominio=<id> (mapea a unidad__condominio)."""
    queryset = Cargo.objects.all().order_by("id")
    serializer_class = CargoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "concepto": ["exact"],
        "unidad": ["exact"],
        "unidad__condominio": ["exact"],  # ?condominio=<id>
    }
    _logger = logging.getLogger(__name__)

    def create(self, request, *args, **kwargs):
        # Log payload for debugging client 400s
        try:
            self._logger.debug("Crear Cargo - payload: %s", request.data)
        except Exception:
            pass

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Log errors and return readable response for debugging
            try:
                self._logger.warning("Cargo create validation errors: %s", serializer.errors)
            except Exception:
                pass
            return Response({"errors": serializer.errors, "data": request.data}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Guardar explícitamente para poder loguear el objeto creado
            with transaction.atomic():
                obj = serializer.save()
            try:
                self._logger.info("Cargo creado id=%s unidad=%s concepto=%s periodo=%s monto=%s", obj.id, getattr(obj, 'unidad_id', None), getattr(obj, 'concepto_id', None), getattr(obj, 'periodo', None), getattr(obj, 'monto', None))
            except Exception:
                pass
            return Response(CargoSerializer(obj).data, status=status.HTTP_201_CREATED)
        except IntegrityError as e:
            # Constraint violation (por ejemplo: unico unidad/concepto/periodo)
            msg = str(e)
            try:
                self._logger.error("IntegrityError creating Cargo: %s", msg)
            except Exception:
                pass
            return Response({"errors": {"non_field_errors": ["Ya existe un cargo para la misma unidad/concepto/periodo (constraint)."] , "detail": msg}}, status=status.HTTP_400_BAD_REQUEST)


class DocumentoViewSet(ModelViewSet):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer

    @action(detail=True, methods=["get"], url_path="descargar")
    def descargar(self, request, pk=None):
        """Devuelve el PDF del documento. Si no existe en base, lo genera y lo guarda."""
        try:
            doc = self.get_queryset().get(pk=pk)
        except Documento.DoesNotExist:
            raise Http404("Documento no existe")

        # Si ya hay archivo, devolverlo (FileField o url en DB)
        existente = DocumentoArchivo.objects.filter(documento=doc).first()
        if existente:
            archivo_field = getattr(existente, "archivo", None)
            if archivo_field:
                return FileResponse(
                    archivo_field.open("rb"),
                    as_attachment=True,
                    filename=archivo_field.name.rsplit("/", 1)[-1],
                )
            if existente.url:
                url = existente.url
                if url.startswith("http://") or url.startswith("https://"):
                    try:
                        import requests
                        r = requests.get(url); r.raise_for_status()
                        return FileResponse(BytesIO(r.content), as_attachment=True, filename=url.rsplit("/", 1)[-1])
                    except Exception as e:
                        return Response({"detail": f"No se pudo descargar recurso remoto: {e}"}, status=500)
                fullpath = os.path.join(getattr(settings, "MEDIA_ROOT", ""), url)
                if os.path.exists(fullpath):
                    return FileResponse(open(fullpath, "rb"), as_attachment=True, filename=os.path.basename(fullpath))
                # si no existe el archivo local, continuamos a regenerar

        detalles = (
            PagoDetalle.objects
            .select_related("pago", "cargo__unidad", "cargo__concepto")
            .filter(pago__documento=doc)
            .order_by("cargo_id")
        )
        unidad = detalles[0].cargo.unidad if detalles else None

        contexto = {
            "documento": doc,
            "detalles": list(detalles),
            "unidad": unidad,
            "hoy": timezone.now(),
            "SITE_NAME": getattr(settings, "SITE_NAME", "Condominio"),
        }

        pdf_bytes = render_recibo_pdf_bytes(request, contexto)

        media_root = getattr(settings, "MEDIA_ROOT", None)
        if not media_root:
            raise RuntimeError("MEDIA_ROOT no está configurado en settings; no se puede guardar el PDF")
        documentos_dir = os.path.join(media_root, "documentos")
        os.makedirs(documentos_dir, exist_ok=True)
        filename = f"recibo_{doc.id}.pdf"
        filepath = os.path.join(documentos_dir, filename)
        with open(filepath, "wb") as f:
            f.write(pdf_bytes)

        with transaction.atomic():
            DocumentoArchivo.objects.create(documento=doc, url=os.path.join("documentos", filename), tipo="PDF")

        return FileResponse(open(filepath, "rb"), as_attachment=True, filename=filename)


class PagoViewSet(ModelViewSet):
    """
    Lista y gestiona pagos. Prefetch de detalles->cargo->unidad para
    que el serializer/JSON pueda mostrar 'unidad' sin N+1 queries.
    """
    serializer_class = PagoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {"estado": ["exact"], "medio": ["exact"]}

    def get_queryset(self):
        qs = (
            Pago.objects.all()
            .order_by("-fecha", "-id")
            .prefetch_related("pagodetalle_set__cargo__unidad")
        )
        params = self.request.query_params
        condominio = params.get("condominio")
        unidad = params.get("unidad")
        desde = params.get("desde")
        hasta = params.get("hasta")

        if condominio:
            qs = qs.filter(pagodetalle__cargo__unidad__condominio_id=condominio)
        if unidad:
            qs = qs.filter(pagodetalle__cargo__unidad_id=unidad)
        if desde:
            d = parse_date(desde)
            if d:
                qs = qs.filter(fecha__date__gte=d)
        if hasta:
            h = parse_date(hasta)
            if h:
                qs = qs.filter(fecha__date__lte=h)

        # Adjuntamos primer_detalle (ya prefetcheado) para mostrar unidad en el front
        for p in qs:
            dets = list(p.pagodetalle_set.all())
            p.primer_detalle = dets[0] if dets else None
        return qs

    def get_serializer_class(self):
        if getattr(self, "action", None) == "registrar":
            return PagoRegistrarSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=["post"])
    def registrar(self, request):
        """Crea un Pago + sus PagoDetalle en una sola transacción."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            # Documento (opcional)
            documento = None
            if data.get("generar_documento", True):
                first_cargo = Cargo.objects.select_related("unidad__condominio").get(
                    id=data["detalles"][0]["cargo"].id
                )
                condominio = first_cargo.unidad.condominio
                numero = data.get("numero_documento") or self._siguiente_numero_documento(
                    condominio_id=condominio.id, prefijo="R"
                )
                documento = Documento.objects.create(
                    numero=numero,
                    total=Decimal("0.00"),
                    tipo=data.get("tipo_documento", "RECIBO"),
                    moneda=data.get("moneda", "BOB"),
                    condominio=condominio,
                )

            # Crear pago
            # EFECTIVO => APROBADO inmediato; otros => PENDIENTE
            medio = data["medio"]
            estado_inicial = "APROBADO" if medio == "EFECTIVO" else "PENDIENTE"
            pago = Pago.objects.create(
                documento=documento,
                monto=Decimal("0.00"),
                medio=medio,
                estado=estado_inicial,
            )

            total = Decimal("0.00")
            for det in data["detalles"]:
                cargo = det["cargo"]
                monto = det["monto_aplicado"]
                PagoDetalle.objects.create(pago=pago, cargo=cargo, monto_aplicado=monto)
                total += Decimal(monto)

            # actualizar totales
            pago.monto = total
            pago.save(update_fields=["monto"])
            if documento:
                documento.total = total
                documento.save(update_fields=["total"])

            # si fue EFECTIVO, recalcular cargos de inmediato
            if estado_inicial == "APROBADO":
                cargo_ids = list(pago.pagodetalle_set.values_list("cargo_id", flat=True))
                self._recalc_cargos(cargo_ids)

            return Response(PagoSerializer(pago).data, status=status.HTTP_201_CREATED)

    def _siguiente_numero_documento(self, condominio_id: int, prefijo: str = "R"):
        from datetime import datetime
        year = datetime.now().year
        base = f"{prefijo}-{year}-"
        last = (
            Documento.objects.filter(condominio_id=condominio_id, numero__startswith=base)
            .order_by("-numero")
            .values_list("numero", flat=True)
            .first()
        )
        if last:
            try:
                seq = int(last.split("-")[-1]) + 1
            except Exception:
                seq = 1
        else:
            seq = 1
        return f"{base}{seq:06d}"

    @action(detail=True, methods=["patch"])
    def asentar(self, request, pk=None):
        pago = self.get_object()
        if pago.estado == "APROBADO":
            return Response({"detail": "El pago ya está APROBADO."}, status=200)
        pago.estado = "APROBADO"
        pago.save(update_fields=["estado"])
        cargo_ids = list(pago.pagodetalle_set.values_list("cargo_id", flat=True))
        self._recalc_cargos(cargo_ids)
        return Response(PagoSerializer(pago).data)

    @action(detail=True, methods=["patch"])
    def anular(self, request, pk=None):
        pago = self.get_object()
        if pago.estado == "ANULADO":
            return Response({"detail": "El pago ya está ANULADO."}, status=200)
        with transaction.atomic():
            for pd in pago.pagodetalle_set.all():
                if pd.monto_aplicado != 0:
                    pd.monto_aplicado = Decimal("0.00")
                    pd.save(update_fields=["monto_aplicado"])
            pago.estado = "ANULADO"
            pago.save(update_fields=["estado"])
            cargo_ids = list(pago.pagodetalle_set.values_list("cargo_id", flat=True))
            self._recalc_cargos(cargo_ids)
        return Response(PagoSerializer(pago).data)

    def _recalc_cargos(self, cargo_ids):
        if not cargo_ids:
            return
        with connection.cursor() as cur:
            for cid in cargo_ids:
                cur.execute("SELECT public.recalc_estado_cargo(%s)", [cid])

    # --------- QR ----------
    # --------- QR ----------
    @action(detail=True, methods=["post"], url_path="iniciar_qr")
    def iniciar_qr(self, request, pk=None):
        """Crea un PagoIntento para QR con expiración y setea unidad/total/moneda para evitar IntegrityError."""
        if qrcode is None:
            return Response({"detail": "Servidor sin 'qrcode'. Instala 'qrcode'."}, status=500)

        pago = self.get_object()
        if pago.medio != "QR":
            return Response({"detail": "El pago no es de tipo QR."}, status=400)
        if pago.estado == "APROBADO":
            return Response({"detail": "El pago ya está aprobado."}, status=400)

        # Inferir UNIDAD desde el primer detalle
        det = (
            pago.pagodetalle_set
            .select_related("cargo__unidad")
            .order_by("id")
            .first()
        )
        unidad = det.cargo.unidad if det and det.cargo and det.cargo.unidad_id else None

        # Si tu modelo PagoIntento.unidad es NOT NULL, exige unidad aquí
        field_names = {f.name for f in PagoIntento._meta.get_fields()}
        if "unidad" in field_names and unidad is None:
            return Response(
                {"detail": "No se pudo determinar la unidad del pago para el intento QR."},
                status=400,
            )

        expires_at = timezone.now() + timedelta(minutes=15)

        intento_kwargs = {
            "pago": pago,
            "medio": "QR",
            "estado": "CREADO",
        }
        if "unidad" in field_names and unidad is not None:
            intento_kwargs["unidad"] = unidad
        if "total" in field_names:
            intento_kwargs["total"] = Decimal(pago.monto or 0)
        if "moneda" in field_names:
            intento_kwargs["moneda"] = getattr(pago.documento, "moneda", "BOB") or "BOB"
        if "expires_at" in field_names:
            intento_kwargs["expires_at"] = expires_at

        # Crear intento
        intento = PagoIntento.objects.create(**intento_kwargs)

        # Generar payload QR y guardarlo si el campo existe
        qr_text = _qr_text_for_pago(pago, intento.id, expires_at)
        # Guardar QR text en campo 'payload' si existe, si no lo guardamos en raw_request (JSONField) para compatibilidad
        if hasattr(intento, "payload"):
            intento.payload = qr_text
            try:
                intento.save(update_fields=["payload"])
            except Exception:
                intento.save()
        else:
            # raw_request suele existir en el modelo como JSONField; lo usamos para persistir el qr_text
            if hasattr(intento, "raw_request"):
                try:
                    intento.raw_request = {**(intento.raw_request or {}), "qr_text": qr_text}
                    intento.save(update_fields=["raw_request"])
                except Exception:
                    intento.raw_request = {"qr_text": qr_text}
                    intento.save()

        return Response(
            {"ok": True, "intento_id": intento.id, "qr_text": qr_text},
            status=200
        )

    @action(detail=True, methods=["post"], url_path="validar_qr")
    def validar_qr(self, request, pk=None):
        """Acción de desarrollo para simular la aprobación de un intento QR.
        Body esperado: { "intento_id": <id> }
        Marca el intento como APROBADO, el pago como APROBADO y recalcula cargos.
        Devuelve { ok: True, documento_id: <id|null>, pago: <PagoSerializer> }
        """
        intento_id = request.data.get("intento_id")
        if not intento_id:
            return Response({"detail": "Se requiere intento_id en el cuerpo."}, status=400)
        # Obtener pago y validar intento
        pago = self.get_object()
        intento = None
        try:
            intento = PagoIntento.objects.get(id=intento_id, pago__id=pago.id)
        except PagoIntento.DoesNotExist:
            return Response({"detail": "Intento no encontrado para este pago."}, status=404)

        with transaction.atomic():
            # Marcar intento
            if hasattr(intento, "estado"):
                intento.estado = "APROBADO"
                intento.save(update_fields=["estado"]) if intento.pk else intento.save()

            # Marcar pago
            if pago.estado != "APROBADO":
                pago.estado = "APROBADO"
                pago.save(update_fields=["estado"]) if pago.pk else pago.save()

            # Recalcular cargos asociados
            cargo_ids = list(pago.pagodetalle_set.values_list("cargo_id", flat=True))
            try:
                self._recalc_cargos(cargo_ids)
            except Exception:
                # no fallar si la función de la DB no existe en entorno de pruebas
                pass

        documento_id = pago.documento.id if pago.documento else None
        return Response({"ok": True, "documento_id": documento_id, "pago": PagoSerializer(pago).data})
    # --------- Pasarela (tarjeta/billetera) ----------
    @action(detail=True, methods=["post"])
    def pasarela_redirect(self, request, pk=None):
        """
        Devuelve URL de redirección a pasarela FAKE (demo).
        En prod, integrar proveedor real y guardar session/preference en 'payload'.
        """
        pago = self.get_object()
        if pago.medio not in ["TARJETA", "BILLETERA"]:
            return Response({"detail": "Medio no soportado para pasarela."}, status=400)

        intento = PagoIntento.objects.create(pago=pago, medio=pago.medio, estado="CREADO")
        fake_url = request.build_absolute_uri(f"/finanzas/pasarelas/fake/checkout/{intento.id}/")
        if hasattr(intento, "payload"):
            intento.payload = json.dumps({"checkout_url": fake_url})
            intento.save(update_fields=["payload"])
        return Response({"url": fake_url, "intento_id": intento.id})
    # --------------------------------


class PagoDetalleViewSet(ModelViewSet):
    queryset = PagoDetalle.objects.all()
    serializer_class = PagoDetalleSerializer


class DocumentoArchivoViewSet(ModelViewSet):
    queryset = DocumentoArchivo.objects.all()
    serializer_class = DocumentoArchivoSerializer


class PagoIntentoViewSet(ModelViewSet):
    queryset = PagoIntento.objects.all()
    serializer_class = PagoIntentoSerializer

    @action(detail=True, methods=["get"], url_path="qr.png")
    def qr_png(self, request, pk=None):
        """Devuelve el PNG del QR para el intento."""
        if qrcode is None:
            return Response({"detail": "Servidor sin 'qrcode'."}, status=500)
        intento = self.get_object()
        # Intentamos obtener el texto QR desde diferentes campos según cómo se guardó
        payload = getattr(intento, "payload", None)
        if not payload:
            raw = getattr(intento, "raw_request", None)
            if raw and isinstance(raw, dict) and raw.get("qr_text"):
                payload = raw.get("qr_text")
            elif raw and isinstance(raw, str):
                try:
                    parsed = json.loads(raw)
                    payload = parsed.get("qr_text")
                except Exception:
                    payload = None
        if not payload:
            return Response({"detail": "Intento sin payload QR."}, status=404)
        text = payload if isinstance(payload, str) else json.dumps(payload, separators=(",", ":"))
        img = qrcode.make(text)
        buff = BytesIO()
        img.save(buff, format="PNG")
        buff.seek(0)
        return HttpResponse(buff.read(), content_type="image/png")

    @action(detail=True, methods=["get"])
    def estado(self, request, pk=None):
        """Devuelve el estado del intento y del pago (para polling)."""
        intento = self.get_object()
        pago = intento.pago
        return Response({
            "intento_id": intento.id,
            "estado_intento": getattr(intento, "estado", None),
            "pago_id": pago.id,
            "estado_pago": pago.estado,
        })


class ReembolsoViewSet(ModelViewSet):
    queryset = Reembolso.objects.all()
    serializer_class = ReembolsoSerializer


class EstadoCuentaUnidadViewSet(ReadOnlyModelViewSet):
    queryset = EstadoCuentaUnidad.objects.all().order_by("periodo", "cargo_id")
    serializer_class = EstadoCuentaUnidadSerializer

    @action(detail=False, methods=["get"], url_path="unidad/(?P<unidad_id>[^/.]+)")
    def list_por_unidad(self, request, unidad_id=None):
        qs = self.queryset.filter(unidad_id=unidad_id)
        d = request.query_params.get("desde")
        h = request.query_params.get("hasta")
        e = request.query_params.get("estado")
        if d:
            pd = parse_date(d);  qs = qs.filter(periodo__gte=pd) if pd else qs
        if h:
            ph = parse_date(h);  qs = qs.filter(periodo__lte=ph) if ph else qs
        if e:
            from django.db import models as djm
            qs = qs.filter(djm.Q(estado_calculado=e) | djm.Q(estado_registrado=e))
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = EstadoCuentaUnidadSerializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = EstadoCuentaUnidadSerializer(qs, many=True)
        return Response(ser.data)


# -------------------------------
# Pasarela FAKE (demo)
# -------------------------------
def fake_checkout(request, intento_id: int):
    """
    Pantalla mínima para simular APROBAR/FALLAR desde el navegador.
    """
    intento = get_object_or_404(PagoIntento, id=intento_id)
    html = f"""
    <html><body style="font-family:sans-serif">
      <h3>Pasarela FAKE</h3>
      <p>Intento #{intento.id} – Pago #{intento.pago_id} – Monto: {intento.pago.monto}</p>
      <form method="post" action="{request.build_absolute_uri('/finanzas/pasarelas/fake/webhook/')}">
        <input type="hidden" name="intento_id" value="{intento.id}">
        <button name="status" value="approved">APROBAR</button>
        <button name="status" value="failed">FALLAR</button>
      </form>
    </body></html>
    """
    return HttpResponse(mark_safe(html))  # noqa: S308


@csrf_exempt
def fake_webhook(request):
    """
    Webhook de demo: marca el Pago/PagoIntento según 'status' (approved/failed).
    """
    if request.method != "POST":
        return HttpResponse("Only POST", status=405)
    intento_id = request.POST.get("intento_id")
    status_flag = request.POST.get("status")
    if not intento_id or status_flag not in ("approved", "failed"):
        return HttpResponse("Bad payload", status=400)

    intento = get_object_or_404(PagoIntento, id=intento_id)
    pago = intento.pago

    with transaction.atomic():
        if hasattr(intento, "estado"):
            intento.estado = "APROBADO" if status_flag == "approved" else "FALLIDO"
            intento.save(update_fields=["estado"])

        if status_flag == "approved" and pago.estado != "APROBADO":
            pago.estado = "APROBADO"
            pago.save(update_fields=["estado"])
            cargo_ids = list(pago.pagodetalle_set.values_list("cargo_id", flat=True))
            try:
                PagoViewSet._recalc_cargos(PagoViewSet, cargo_ids)
            except Exception:
                pass

    return HttpResponse("ok")
