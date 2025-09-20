import uuid
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Usuarios
from .serializers import UsuarioSerializer, UsuarioCreateSerializer

def get_or_create_usuario_for_django_user(dj_user) -> Usuarios:
    perfil = getattr(dj_user, 'perfil', None)
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
        return Response(UsuarioSerializer(perfil).data)

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuarios.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return UsuarioCreateSerializer if self.action == 'create' else UsuarioSerializer
    
    def get_serializer_class(self):
        # Cuando es POST (create) usamos el serializer de creación,
        # en los demás casos (list, retrieve, update, etc.) el de lectura.
        return UsuarioCreateSerializer if self.action == "create" else UsuarioSerializer