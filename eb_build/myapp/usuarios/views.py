# backend/myapp/usuarios/views.py
import uuid
from django.utils import timezone
from django.db.models import Q                   # 👈 añade esto
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Usuarios
from .serializers import (
    UsuarioSerializer, UsuarioCreateSerializer, UsuarioUpdateSerializer
)

def get_or_create_usuario_for_django_user(dj_user) -> Usuarios:
    perfil = Usuarios.objects.filter(auth_user=dj_user).first()
    if perfil:
        return perfil
    return Usuarios.objects.create(
        id=uuid.uuid4(),
        usuario=dj_user.username,
        correo=dj_user.email or f"{dj_user.username}@example.com",
        nombre_completo=dj_user.get_full_name() or dj_user.username,
        hash_contrasena="(externo)",
        activo=True,
        creado_en=timezone.now(),
        actualizado_en=timezone.now(),
        auth_user=dj_user,
    )

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        perfil = get_or_create_usuario_for_django_user(request.user)
        auth = request.user
        groups = list(auth.groups.values_list("name", flat=True))
        return Response({
            **UsuarioSerializer(perfil).data,
            "auth": {
                "username": auth.username,
                "email": auth.email,
                "is_superuser": auth.is_superuser,
                "is_staff": auth.is_staff,
                "groups": groups,
            }
        })

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuarios.objects.all().order_by("nombre_completo", "usuario")
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def get_queryset(self):
        qs = super().get_queryset()

        # Permisos de visibilidad
        u = self.request.user
        if not (u.is_superuser or u.is_staff or u.groups.filter(name__in=["Admin", "Gestor"]).exists()):
            qs = qs.filter(auth_user=u)

        # --- Filtros para autocompletar ---
        q = self.request.query_params.get("q", "").strip()
        if q:
            from django.db.models import Q
            qs = qs.filter(
                Q(nombre_completo__icontains=q) |
                Q(usuario__icontains=q) |
                Q(correo__icontains=q)
            )

        role = self.request.query_params.get("role", "").strip()
        if role:
            # filtra por pertenencia al grupo (rol) solicitado, p. ej. "Copropietario"
            qs = qs.filter(auth_user__groups__name__iexact=role)

        ordering = self.request.query_params.get("ordering", "").strip()
        if ordering:
            qs = qs.order_by(ordering)

        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return UsuarioCreateSerializer
        if self.action in ("update", "partial_update"):
            return UsuarioUpdateSerializer
        return UsuarioSerializer
