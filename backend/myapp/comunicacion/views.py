# myapp/comunicacion/views.py
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import Aviso, ArchivoAviso, LecturaAviso
from .serializers import AvisoSerializer, ArchivoAvisoSerializer, LecturaSerializer


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class AvisoViewSet(ModelViewSet):
    queryset = Aviso.objects.all()
    serializer_class = AvisoSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Filtros rápidos por querystring
        estado = self.request.query_params.get("estado")  # vigente|todos|expirados
        prioridad = self.request.query_params.get("prioridad")
        condominio = self.request.query_params.get("condominio")
        unidad = self.request.query_params.get("unidad")

        if prioridad:
            qs = qs.filter(prioridad=prioridad)

        if condominio:
            qs = qs.filter(Q(alcance="TODOS") | Q(alcance="CONDOMINIO", condominio_id=condominio) | Q(alcance="UNIDAD", condominio_id=condominio))
        if unidad:
            qs = qs.filter(Q(alcance="TODOS") | Q(unidad_id=unidad))

        from django.utils import timezone
        now = timezone.now()
        if estado == "vigente":
            qs = qs.filter(is_activo=True).filter(Q(vence_at__isnull=True) | Q(vence_at__gt=now))
        elif estado == "expirados":
            qs = qs.filter(Q(is_activo=False) | Q(vence_at__lte=now))

        return qs

    @action(detail=True, methods=["post"])
    def marcar_visto(self, request, pk=None):
        aviso = self.get_object()
        if not request.user or request.user.is_anonymous:
            return Response({"detail": "No autenticado."}, status=401)
        LecturaAviso.objects.get_or_create(aviso=aviso, usuario=request.user)
        return Response({"ok": True})

    @action(detail=True, methods=["patch"])
    def archivar(self, request, pk=None):
        aviso = self.get_object()
        aviso.is_activo = False
        aviso.save(update_fields=["is_activo"])
        return Response(AvisoSerializer(aviso, context={"request": request}).data)

    # -------- Archivos --------
    @action(detail=True, methods=["post"], url_path="upload")
    def upload(self, request, pk=None):
        aviso = self.get_object()
        f = request.FILES.get("file")
        if not f:
            return Response({"detail": "Falta 'file'."}, status=400)
        nombre = request.data.get("nombre") or f.name
        arc = ArchivoAviso.objects.create(aviso=aviso, archivo=f, nombre=nombre)
        return Response(ArchivoAvisoSerializer(arc, context={"request": request}).data, status=201)

    @action(detail=True, methods=["delete"], url_path="archivos/(?P<archivo_id>[^/.]+)")
    def borrar_archivo(self, request, pk=None, archivo_id=None):
        aviso = self.get_object()
        arc = get_object_or_404(ArchivoAviso, id=archivo_id, aviso=aviso)
        arc.delete()
        return Response(status=204)


class LecturaViewSet(ModelViewSet):
    queryset = LecturaAviso.objects.all()
    serializer_class = LecturaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.filter(usuario=self.request.user)
