from datetime import date
from django.db import transaction, IntegrityError
from django.db.models import OuterRef, Subquery, Value
from django.db.models.functions import Coalesce
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Condominio, Unidad, UsuarioUnidad
from .serializers import (
    CondominioSerializer,
    UnidadSerializer, UnidadListSerializer,
    UsuarioUnidadSerializer,
)


class CondominioViewSet(ModelViewSet):
    queryset = Condominio.objects.all().order_by("id")
    serializer_class = CondominioSerializer
    permission_classes = [IsAuthenticated]


class UnidadViewSet(ModelViewSet):
    """
    - GET /propiedades/unidades/ usa UnidadListSerializer con anotaciones:
      condominio_nombre, propietario_id/propietario_nombre (rol=Copropietario),
      residente_id/residente_nombre (rol=Residente)
    - POST/PUT/PATCH usan UnidadSerializer
    - POST /propiedades/unidades/{id}/set_owner/  asigna/actualiza copropietario principal
    """
    queryset = Unidad.objects.all().select_related("condominio").order_by("id")
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return UnidadListSerializer if self.action == "list" else UnidadSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        owners_qs = (
            UsuarioUnidad.objects
            .filter(
                unidad=OuterRef("pk"),
                es_principal=True,
                fecha_fin__isnull=True,
                usuario__auth_user__groups__name__iexact="Copropietario",
            )
            .order_by("-fecha_inicio", "-creado_en")
        )

        residents_qs = (
            UsuarioUnidad.objects
            .filter(
                unidad=OuterRef("pk"),
                es_principal=True,
                fecha_fin__isnull=True,
                usuario__auth_user__groups__name__iexact="Residente",
            )
            .order_by("-fecha_inicio", "-creado_en")
        )

        return (
            qs.annotate(
                condominio_nombre=Coalesce(
                    Subquery(
                        Condominio.objects.filter(id=OuterRef("condominio_id")).values("nombre")[:1]
                    ),
                    Value("")
                ),
                propietario_id=Subquery(owners_qs.values("usuario_id")[:1]),
                propietario_nombre=Subquery(
                    owners_qs.select_related("usuario").values("usuario__nombre_completo")[:1]
                ),
                residente_id=Subquery(residents_qs.values("usuario_id")[:1]),
                residente_nombre=Subquery(
                    residents_qs.select_related("usuario").values("usuario__nombre_completo")[:1]
                ),
            )
        )

    # url_path/url_name explícitos para evitar rarezas con el router
    @action(
        detail=True,
        methods=["post"],
        url_path="set_owner",
        url_name="set_owner",
        permission_classes=[IsAuthenticated],
    )
    def set_owner(self, request, pk=None):
        """
        Asigna / cambia / quita COPROPIETARIO principal.

        Body:
          - usuario: UUID del perfil (o null para quitar)
          - porcentaje (opcional, default 100)
          - fecha_inicio (opcional, default hoy, YYYY-MM-DD)
          - fecha_fin (opcional, al cerrar anterior)
        """
        unidad = self.get_object()
        raw_usuario   = request.data.get("usuario", None)   # puede ser null/""
        porcentaje    = request.data.get("porcentaje", 100)
        fecha_inicio  = request.data.get("fecha_inicio") or date.today().isoformat()
        fecha_fin_req = request.data.get("fecha_fin")

        anterior = UsuarioUnidad.objects.filter(
            unidad=unidad, es_principal=True, fecha_fin__isnull=True
        ).first()

        # quitar propietario actual
        if raw_usuario in (None, "", "null"):
            if anterior:
                anterior.fecha_fin = fecha_fin_req or fecha_inicio
                anterior.save(update_fields=["fecha_fin", "actualizado_en"])
            return Response({"ok": True, "cleared": bool(anterior)}, status=200)

        # validar usuario
        from myapp.usuarios.models import Usuarios
        try:
            nuevo_usuario = Usuarios.objects.get(pk=str(raw_usuario))
        except Usuarios.DoesNotExist:
            return Response({"usuario": ["No existe."]}, status=400)

        with transaction.atomic():
            # mismo usuario ya activo → actualizar
            if anterior and anterior.usuario_id == nuevo_usuario.id:
                changed = False
                if str(anterior.fecha_inicio) != str(fecha_inicio):
                    anterior.fecha_inicio = fecha_inicio; changed = True
                if anterior.porcentaje != porcentaje:
                    anterior.porcentaje = porcentaje; changed = True
                if changed:
                    anterior.save(update_fields=["fecha_inicio", "porcentaje", "actualizado_en"])
                return Response(UsuarioUnidadSerializer(anterior).data, status=200)

            # si ya existe (usuario, unidad, fecha_inicio) → reutilizar
            mismo_dia = UsuarioUnidad.objects.filter(
                usuario=nuevo_usuario, unidad=unidad, fecha_inicio=fecha_inicio, es_principal=True
            ).first()
            if mismo_dia:
                if anterior and anterior.pk != mismo_dia.pk:
                    anterior.fecha_fin = fecha_fin_req or fecha_inicio
                    anterior.save(update_fields=["fecha_fin", "actualizado_en"])
                if mismo_dia.fecha_fin is not None:
                    mismo_dia.fecha_fin = None
                if mismo_dia.porcentaje != porcentaje:
                    mismo_dia.porcentaje = porcentaje
                mismo_dia.es_principal = True
                mismo_dia.save(update_fields=["fecha_fin", "porcentaje", "es_principal", "actualizado_en"])
                return Response(UsuarioUnidadSerializer(mismo_dia).data, status=200)

            # cerrar anterior si era otro
            if anterior:
                anterior.fecha_fin = fecha_fin_req or fecha_inicio
                anterior.save(update_fields=["fecha_fin", "actualizado_en"])

            # crear nuevo propietario
            try:
                nuevo = UsuarioUnidad.objects.create(
                    usuario_id=nuevo_usuario.id,
                    unidad=unidad,
                    porcentaje=porcentaje,
                    es_principal=True,
                    fecha_inicio=fecha_inicio,
                )
            except IntegrityError:
                nuevo = UsuarioUnidad.objects.get(
                    usuario=nuevo_usuario, unidad=unidad, fecha_inicio=fecha_inicio
                )
                if nuevo.fecha_fin is not None or not nuevo.es_principal or nuevo.porcentaje != porcentaje:
                    nuevo.fecha_fin = None
                    nuevo.es_principal = True
                    nuevo.porcentaje = porcentaje
                    nuevo.save(update_fields=["fecha_fin", "es_principal", "porcentaje", "actualizado_en"])

        return Response(UsuarioUnidadSerializer(nuevo).data, status=201)


class UsuarioUnidadViewSet(ModelViewSet):
    queryset = UsuarioUnidad.objects.all().order_by("id")
    serializer_class = UsuarioUnidadSerializer
    permission_classes = [IsAuthenticated]
