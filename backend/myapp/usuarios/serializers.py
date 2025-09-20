# myapp/usuarios/serializers.py
import uuid
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Usuarios

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuarios
        fields = (
            "id",
            "usuario",
            "correo",
            "nombre_completo",
            "telefono",
            "activo",
            "auth_user_id",
        )
        read_only_fields = ("id", "activo", "auth_user_id")

class UsuarioCreateSerializer(serializers.Serializer):
    # campos de entrada
    username        = serializers.CharField(write_only=True)
    password        = serializers.CharField(write_only=True)
    email           = serializers.EmailField(required=False, allow_blank=True, write_only=True)
    nombre_completo = serializers.CharField(required=False, allow_blank=True)
    telefono        = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated):
        User = get_user_model()

        # 1) crear usuario de Django
        dj = User.objects.create_user(
            username = validated["username"],
            email    = validated.get("email") or "",
            password = validated["password"],
            is_active=True,
        )

        # 2) crear perfil de negocio
        perfil = Usuarios.objects.create(
            id              = uuid.uuid4(),
            usuario         = dj.username,
            correo          = dj.email or f"{dj.username}@example.com",
            nombre_completo = validated.get("nombre_completo") or dj.get_full_name() or dj.username,
            telefono        = validated.get("telefono") or "",
            hash_contrasena = "(externo)",
            activo          = True,
            creado_en       = timezone.now(),     # ← añade si tu columna es NOT NULL
            actualizado_en  = timezone.now(),     # ← idem
            auth_user       = dj,
        )
        return perfil

    # Al responder el POST, devolvemos la forma “de lectura”
    def to_representation(self, instance):
        return UsuarioSerializer(instance, context=self.context).data
