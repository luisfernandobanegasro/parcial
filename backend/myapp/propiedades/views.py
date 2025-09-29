# myapp/propiedades/views.py
from django.db.models import OuterRef, Subquery, Value
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
    - GET /propiedades/unidades/ usa UnidadListSerializer con anotaciones:
        condominio_nombre, propietario, propietario_nombre
    - POST/PUT/PATCH usan UnidadSerializer
    - POST /propiedades/unidades/{id}/set_owner/  asigna/actualiza copropietario
    """
    queryset = Unidad.objects.all().select_related("condominio").order_by("id")

    def get_serializer_class(self):
        return UnidadListSerializer if self.action == "list" else UnidadSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        # Subquery: último copropietario principal sin fecha_fin
        activos = (
            UsuarioUnidad.objects
            .filter(unidad=OuterRef("pk"), es_principal=True, fecha_fin__isnull=True)
            .order_by("-fecha_inicio", "-creado_en")
        )

        return (
            qs
            .annotate(
                condominio_nombre=Coalesce(Subquery(
                    Condominio.objects.filter(id=OuterRef("condominio_id")).values("nombre")[:1]
                ), Value("")),
                propietario=Subquery(activos.values("usuario_id")[:1]),
                propietario_nombre=Subquery(
                    activos.select_related("usuario").values("usuario__nombre_completo")[:1]
                )
            )
        )

    @action(detail=True, methods=["post"])
    def set_owner(self, request, pk=None):
        """
        Asigna/actualiza copropietario principal:
          body: { "usuario": UUID, "porcentaje": 100, "fecha_inicio": "YYYY-MM-DD" }
        Cierra el anterior (fecha_fin=today) si existía.
        """
        unidad = self.get_object()
        usuario = request.data.get("usuario")
        if not usuario:
            return Response({"usuario": ["Este campo es requerido."]}, status=400)

        porcentaje   = request.data.get("porcentaje", 100)
        fecha_inicio = request.data.get("fecha_inicio")  # espera "YYYY-MM-DD"

        # Cerrar anterior activo si lo hay
        anterior = UsuarioUnidad.objects.filter(unidad=unidad, es_principal=True, fecha_fin__isnull=True).first()
        if anterior:
            anterior.fecha_fin = request.data.get("fecha_fin") or fecha_inicio
            anterior.save(update_fields=["fecha_fin"])

        # Crear nuevo registro
        payload = {
            "usuario": usuario,
            "unidad":  unidad.id,
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
