# myapp/propiedades/views.py
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from django.db.models import Q
from .models import Condominio, Unidad, UsuarioUnidad
from .serializers import CondominioSerializer, UnidadSerializer, UsuarioUnidadSerializer

class CondominioViewSet(ModelViewSet):
    queryset = Condominio.objects.all()
    serializer_class = CondominioSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class UnidadViewSet(ModelViewSet):
    queryset = Unidad.objects.all()
    serializer_class = UnidadSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class UsuarioUnidadViewSet(ModelViewSet):
    queryset = UsuarioUnidad.objects.select_related(
        "usuario", "unidad", "unidad__condominio"
    ).all()
    serializer_class = UsuarioUnidadSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def get_queryset(self):
        qs = super().get_queryset()

        # Filtros: ?activo=true|false  ?unidad=ID  ?condominio=ID  ?q=texto
        activo = self.request.query_params.get("activo")
        if activo is not None:
            if activo.lower() in ("1", "true", "t", "yes", "si", "sí"):
                qs = qs.filter(fecha_fin__isnull=True)
            else:
                qs = qs.filter(fecha_fin__isnull=False)

        unidad_id = self.request.query_params.get("unidad")
        if unidad_id:
            qs = qs.filter(unidad_id=unidad_id)

        condominio_id = self.request.query_params.get("condominio")
        if condominio_id:
            qs = qs.filter(unidad__condominio_id=condominio_id)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(usuario__nombre_completo__icontains=q) |
                Q(usuario__usuario__icontains=q) |
                Q(usuario__correo__icontains=q) |
                Q(unidad__codigo__icontains=q)
            )

        return qs.order_by("-creado_en")
