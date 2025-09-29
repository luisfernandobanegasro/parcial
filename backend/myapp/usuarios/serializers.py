# myapp/usuarios/serializers.py
import uuid
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Usuarios

User = get_user_model()


class UsuarioSerializer(serializers.ModelSerializer):
    # Campo solo-lectura calculado a partir de auth_user.groups
    roles = serializers.SerializerMethodField()

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
            "roles",
        )
        read_only_fields = ("id", "auth_user_id", "roles")

    def get_roles(self, obj):
        """Devuelve [{id, name}] de los grupos del auth_user vinculado."""
        if not obj.auth_user_id:
            return []
        return list(obj.auth_user.groups.values("id", "name"))


# ---------- CREATE ----------
class UsuarioCreateSerializer(serializers.Serializer):
    # payload que envía tu front
    usuario         = serializers.CharField(write_only=True)
    password        = serializers.CharField(write_only=True, min_length=4)
    correo          = serializers.EmailField(required=False, allow_blank=True, write_only=True)
    nombre_completo = serializers.CharField(required=False, allow_blank=True)
    telefono        = serializers.CharField(required=False, allow_blank=True)
    activo          = serializers.BooleanField(required=False, default=True)

    # ---- Validaciones de unicidad (en Django y en tu tabla Usuarios) ----
    def validate_usuario(self, v):
        if User.objects.filter(username=v).exists():
            raise serializers.ValidationError("Ya existe un usuario con ese nombre.")
        if Usuarios.objects.filter(usuario=v).exists():
            raise serializers.ValidationError("El perfil ya existe para ese usuario.")
        return v

    def validate_correo(self, v):
        if not v:
            return v
        if User.objects.filter(email=v).exists():
            raise serializers.ValidationError("Ese correo ya está registrado.")
        if Usuarios.objects.filter(correo=v).exists():
            raise serializers.ValidationError("Ese correo ya está en uso en perfiles.")
        return v

    def create(self, validated):
        username = validated["usuario"]
        email    = validated.get("correo") or ""
        password = validated["password"]
        activo   = validated.get("activo", True)

        # 1) auth_user
        dj_user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=activo,
        )

        # 2) perfil Usuarios
        perfil = Usuarios.objects.create(
            id              = uuid.uuid4(),
            usuario         = dj_user.username,
            correo          = dj_user.email or f"{dj_user.username}@example.com",
            nombre_completo = validated.get("nombre_completo") or dj_user.get_full_name() or dj_user.username,
            telefono        = validated.get("telefono") or "",
            hash_contrasena = "(externo)",
            activo          = activo,
            creado_en       = timezone.now(),
            actualizado_en  = timezone.now(),
            auth_user       = dj_user,
        )
        return perfil

    def to_representation(self, instance):
        return UsuarioSerializer(instance, context=self.context).data


# ---------- UPDATE/PATCH (sincroniza con auth_user) ----------
class UsuarioUpdateSerializer(serializers.ModelSerializer):
    # password opcional: si viene, se cambia en auth_user
    password = serializers.CharField(write_only=True, required=False, allow_blank=False, min_length=4)

    class Meta:
        model = Usuarios
        fields = (
            "usuario",          # si no quieres permitir cambiar username, elimínalo
            "correo",
            "nombre_completo",
            "telefono",
            "activo",
            "password",
        )

    # Validaciones de unicidad al actualizar (excluyendo el propio registro)
    def validate_usuario(self, v):
        instance = self.instance
        if not v:
            return v
        if User.objects.filter(username=v).exclude(id=instance.auth_user_id).exists():
            raise serializers.ValidationError("Ya existe un usuario con ese nombre.")
        if Usuarios.objects.filter(usuario=v).exclude(id=instance.id).exists():
            raise serializers.ValidationError("El perfil ya existe para ese usuario.")
        return v

    def validate_correo(self, v):
        instance = self.instance
        if not v:
            return v
        if User.objects.filter(email=v).exclude(id=instance.auth_user_id).exists():
            raise serializers.ValidationError("Ese correo ya está registrado.")
        if Usuarios.objects.filter(correo=v).exclude(id=instance.id).exists():
            raise serializers.ValidationError("Ese correo ya está en uso en perfiles.")
        return v

    def update(self, instance: Usuarios, validated):
        dj_user = instance.auth_user

        # username
        new_username = validated.get("usuario")
        if new_username and new_username != instance.usuario:
            dj_user.username = new_username
            instance.usuario = new_username

        # email
        new_email = validated.get("correo", instance.correo or "")
        if new_email != (instance.correo or ""):
            dj_user.email = new_email
            instance.correo = new_email

        # is_active
        if "activo" in validated:
            dj_user.is_active = bool(validated["activo"])
            instance.activo   = bool(validated["activo"])

        # password
        if "password" in validated and validated["password"]:
            dj_user.set_password(validated["password"])

        # otros campos del perfil
        if "nombre_completo" in validated:
            instance.nombre_completo = validated["nombre_completo"] or ""
        if "telefono" in validated:
            instance.telefono = validated["telefono"] or ""

        instance.actualizado_en = timezone.now()
        dj_user.save()
        instance.save()
        return instance
