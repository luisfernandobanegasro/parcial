from datetime import date

from django.db.models import OuterRef, Subquery, Value, Q
from django.db.models.functions import Coalesce
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from .models import Condominio, Unidad, UsuarioUnidad
from .serializers import (
    CondominioSerializer,
    UnidadSerializer, UnidadListSerializer,
    UsuarioUnidadSerializer,
)


class CondominioViewSet(ModelViewSet):
    queryset = Condominio.objects.all().order_by("id")
    serializer_class = CondominioSerializer


class UnidadViewSet(ModelViewSet):
    """
    - GET  /propiedades/unidades/         → UnidadListSerializer (con anotaciones)
    - POST/PUT/PATCH/DELETE               → UnidadSerializer
    - POST /propiedades/unidades/{id}/set_owner/  {usuario|null, porcentaje?, fecha_inicio?}
        * Si usuario = null → desasigna propietario (cierra el anterior)
    """
    queryset = Unidad.objects.select_related("condominio").all().order_by("id")

    def get_serializer_class(self):
        return UnidadListSerializer if self.action == "list" else UnidadSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        # Subquery: propietario principal activo
        activos = (
            UsuarioUnidad.objects
            .filter(unidad=OuterRef("pk"), es_principal=True, fecha_fin__isnull=True)
            .order_by("-fecha_inicio", "-creado_en")
        )

        qs = qs.annotate(
            condominio_nombre=Coalesce(
                Subquery(Condominio.objects.filter(id=OuterRef("condominio_id")).values("nombre")[:1]),
                Value("")
            ),
            propietario=Subquery(activos.values("usuario_id")[:1]),
            propietario_nombre=Subquery(
                activos.select_related("usuario").values("usuario__nombre_completo")[:1]
            )
        )

        # ---- filtros para búsqueda rápida desde la UI ----
        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(
                Q(codigo__icontains=q)
                | Q(condominio__nombre__icontains=q)
                | Q(propietarios__usuario__nombre_completo__icontains=q)  # relación inversa: related_name="copropietarios"
            ).distinct()

        return qs

    @action(detail=True, methods=["post"])
    def set_owner(self, request, pk=None):
        """
        Asigna/actualiza copropietario principal.
          body:
            - usuario: UUID | null
            - porcentaje (opcional, default 100)
            - fecha_inicio (opcional, YYYY-MM-DD; default: hoy)
        Si usuario == null → cierra el propietario actual (si existe) y no crea nuevo.
        """
        unidad = self.get_object()

        usuario = request.data.get("usuario", None)
        porcentaje = request.data.get("porcentaje", 100)
        fecha_inicio = request.data.get("fecha_inicio") or date.today().isoformat()

        # Cerrar propietario actual si existe
        actual = UsuarioUnidad.objects.filter(
            unidad=unidad, es_principal=True, fecha_fin__isnull=True
        ).first()
        if actual:
            # si no viene fecha_fin, usamos fecha_inicio para cerrar
            actual.fecha_fin = request.data.get("fecha_fin") or fecha_inicio
            actual.save(update_fields=["fecha_fin"])

        # Si usuario viene null → sólo desasignar
        if usuario in (None, "", "null"):
            return Response({"ok": True, "cleared": True}, status=status.HTTP_200_OK)

        # Crear nuevo propietario principal
        payload = {
            "usuario": usuario,           # UUID
            "unidad": unidad.id,
            "porcentaje": porcentaje,
            "es_principal": True,
            "fecha_inicio": fecha_inicio,
        }
        ser = UsuarioUnidadSerializer(data=payload)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)


class UsuarioUnidadViewSet(ModelViewSet):
    queryset = UsuarioUnidad.objects.all().order_by("id")
    serializer_class = UsuarioUnidadSerializer
