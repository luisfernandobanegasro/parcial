# myapp/roles/views.py
from django.contrib.auth.models import Group
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from myapp.usuarios.models import Usuarios
from .serializers import RolSerializer


class IsStaffOrReadOnly(permissions.BasePermission):
    """Solo staff/superuser pueden crear/editar/eliminar roles."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


# CRUD de Roles (usa django.contrib.auth.models.Group)
class RolViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by("name", "id")
    serializer_class = RolSerializer
    permission_classes = [IsStaffOrReadOnly]


# GET/POST roles de un usuario (perfil -> auth_user -> groups)
class UsuarioRolesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_auth_user(self, usuario_id):
        perfil = get_object_or_404(Usuarios, pk=usuario_id)
        if not perfil.auth_user:
            return None, Response({"detail": "El perfil no está vinculado a auth_user."}, status=400)
        return perfil.auth_user, None

    def get(self, request, usuario_id):
        auth_user, error = self._get_auth_user(usuario_id)
        if error:
            return error
        roles = auth_user.groups.all().order_by("name", "id")
        return Response(RolSerializer(roles, many=True).data, status=200)

    def post(self, request, usuario_id):
        # requiere staff/superuser para asignar
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        role_id = request.data.get("role_id")
        if not role_id:
            return Response({"detail": "role_id requerido"}, status=400)

        auth_user, error = self._get_auth_user(usuario_id)
        if error:
            return error

        role = get_object_or_404(Group, pk=role_id)
        auth_user.groups.add(role)
        return Response({"ok": True}, status=201)


# DELETE de un rol específico del usuario
class UsuarioRolDestroy(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, usuario_id, rol_id):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        perfil = get_object_or_404(Usuarios, pk=usuario_id)
        if not perfil.auth_user:
            return Response({"detail": "El perfil no está vinculado a auth_user."}, status=400)

        role = get_object_or_404(Group, pk=rol_id)
        perfil.auth_user.groups.remove(role)
        return Response(status=204)


# Roles del usuario autenticado (útil para el front)
class MisRolesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        roles = request.user.groups.all().order_by("name", "id")
        return Response(RolSerializer(roles, many=True).data, status=200)
