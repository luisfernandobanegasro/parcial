# myapp/finanzas/views.py
from decimal import Decimal
from io import BytesIO
import os

from django.conf import settings
from django.db import transaction, connection
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.http import FileResponse, Http404
from django.template.loader import render_to_string

from rest_framework import status
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
    Intenta generar PDF con WeasyPrint. Si falla, usa ReportLab.
    Retorna bytes del PDF.
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
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
            from reportlab.lib.units import mm
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
    """
    CRUD de cargos. Para filtrar por condominio: ?condominio=<id> (mapea a unidad__condominio).
    """
    queryset = Cargo.objects.all().order_by("id")
    serializer_class = CargoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "concepto": ["exact"],
        "unidad": ["exact"],
        "unidad__condominio": ["exact"],  # ?condominio=<id>
    }


class DocumentoViewSet(ModelViewSet):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer

    @action(detail=True, methods=["get"], url_path="descargar")
    def descargar(self, request, pk=None):
        """
        Devuelve el PDF del documento. Si no existe en base, lo genera y lo guarda.
        """
        try:
            doc = self.get_queryset().get(pk=pk)
        except Documento.DoesNotExist:
            raise Http404("Documento no existe")

        # Si ya hay archivo, devolverlo. El modelo DocumentoArchivo usa `url` (TextField)
        # en lugar de un FileField llamado `archivo`, así que soportamos ambos casos.
        existente = DocumentoArchivo.objects.filter(documento=doc).first()
        if existente:
            # 1) Caso antiguo: FileField llamado 'archivo'
            archivo_field = getattr(existente, "archivo", None)
            if archivo_field:
                return FileResponse(
                    archivo_field.open("rb"),
                    as_attachment=True,
                    filename=archivo_field.name.rsplit("/", 1)[-1],
                )

            # 2) Si existe una URL/ruta en el campo `url`, intentar servirla
            if existente.url:
                url = existente.url
                # si es una URL remota, intentar descargarla (requests opcional)
                if url.startswith("http://") or url.startswith("https://"):
                    try:
                        import requests
                    except Exception:
                        return Response({"detail": "No se puede descargar recurso remoto: 'requests' no está disponible en el servidor."}, status=500)
                    try:
                        r = requests.get(url)
                        r.raise_for_status()
                    except Exception as e:
                        return Response({"detail": f"No se pudo descargar recurso remoto: {e}"}, status=500)
                    return FileResponse(BytesIO(r.content), as_attachment=True, filename=url.rsplit("/", 1)[-1])

                # ruta local relativa dentro de MEDIA_ROOT
                fullpath = os.path.join(getattr(settings, "MEDIA_ROOT", ""), url)
                if os.path.exists(fullpath):
                    return FileResponse(open(fullpath, "rb"), as_attachment=True, filename=os.path.basename(fullpath))
                # si la ruta no existe continuamos y reprocesamos (generar de nuevo)

        # Preparar contexto del recibo
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

        # Generar PDF (WeasyPrint o ReportLab)
        pdf_bytes = render_recibo_pdf_bytes(request, contexto)

        # Guardar en disco dentro de MEDIA_ROOT/documentos/ y registrar la ruta en DocumentoArchivo.url
        media_root = getattr(settings, "MEDIA_ROOT", None)
        if not media_root:
            raise RuntimeError("MEDIA_ROOT no está configurado en settings; no se puede guardar el PDF")
        documentos_dir = os.path.join(media_root, "documentos")
        os.makedirs(documentos_dir, exist_ok=True)
        filename = f"recibo_{doc.id}.pdf"
        filepath = os.path.join(documentos_dir, filename)
        with open(filepath, "wb") as f:
            f.write(pdf_bytes)

        # Guardar registro en la tabla documentos_archivos
        with transaction.atomic():
            nuevo = DocumentoArchivo.objects.create(documento=doc, url=os.path.join("documentos", filename), tipo="PDF")

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
        """
        Crea un Pago + sus PagoDetalle en una sola transacción.
        """
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
            pago = Pago.objects.create(
                documento=documento,
                monto=Decimal("0.00"),
                medio=data["medio"],
                estado="APROBADO" if data["medio"] in ["EFECTIVO", "TRANSFERENCIA"] else "PENDIENTE",
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


class PagoDetalleViewSet(ModelViewSet):
    queryset = PagoDetalle.objects.all()
    serializer_class = PagoDetalleSerializer


class DocumentoArchivoViewSet(ModelViewSet):
    queryset = DocumentoArchivo.objects.all()
    serializer_class = DocumentoArchivoSerializer


class PagoIntentoViewSet(ModelViewSet):
    queryset = PagoIntento.objects.all()
    serializer_class = PagoIntentoSerializer


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
            pd = parse_date(d)
            if pd:
                qs = qs.filter(periodo__gte=pd)
        if h:
            ph = parse_date(h)
            if ph:
                qs = qs.filter(periodo__lte=ph)
        if e:
            from django.db import models as djm
            qs = qs.filter(djm.Q(estado_calculado=e) | djm.Q(estado_registrado=e))
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = EstadoCuentaUnidadSerializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = EstadoCuentaUnidadSerializer(qs, many=True)
        return Response(ser.data)
