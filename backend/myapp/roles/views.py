from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import Group

from myapp.usuarios.models import Usuarios
from .serializers import RolSerializer   #  IMPORTA EL SERIALIZER

class RolViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated]

    # Solo admins pueden crear/editar/borrar roles
    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return super().get_permissions()

class UsuarioRolesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, usuario_id):
        usuario = Usuarios.objects.get(pk=usuario_id)
        groups = usuario.auth_user.groups.all() if usuario.auth_user else Group.objects.none()
        return Response(RolSerializer(groups, many=True).data)

    def post(self, request, usuario_id):
        usuario = Usuarios.objects.get(pk=usuario_id)
        rol_id = request.data.get("rol_id")
        if not rol_id:
            return Response({"detail": "rol_id requerido"}, status=400)
        rol = Group.objects.get(pk=rol_id)
        usuario.auth_user.groups.add(rol)
        return Response({"ok": True}, status=201)

class UsuarioRolDestroy(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, usuario_id, rol_id):
        usuario = Usuarios.objects.get(pk=usuario_id)
        rol = Group.objects.get(pk=rol_id)
        usuario.auth_user.groups.remove(rol)
        return Response(status=204)
