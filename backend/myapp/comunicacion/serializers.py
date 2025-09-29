# myapp/comunicacion/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Aviso, ArchivoAviso, LecturaAviso


class ArchivoAvisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchivoAviso
        fields = ["id", "nombre", "archivo", "subido_at"]


class AvisoSerializer(serializers.ModelSerializer):
    archivos = ArchivoAvisoSerializer(many=True, read_only=True)
    autor_nombre = serializers.SerializerMethodField()
    vigente = serializers.SerializerMethodField()
    leido = serializers.SerializerMethodField()

    class Meta:
        model = Aviso
        fields = [
            "id", "titulo", "cuerpo", "prioridad", "alcance",
            "condominio_id", "unidad_id", "vence_at",
            "publicado_at", "is_activo", "vigente",
            "autor", "autor_nombre", "archivos", "leido",
        ]
        read_only_fields = ["autor", "publicado_at", "vigente", "autor_nombre", "leido"]

    def get_autor_nombre(self, obj):
        u = getattr(obj, "autor", None)
        if not u:
            return None
        full = (getattr(u, "first_name", "") or "").strip() + " " + (getattr(u, "last_name", "") or "").strip()
        return full.strip() or getattr(u, "username", None)

    def get_vigente(self, obj):
        return obj.esta_vigente

    def get_leido(self, obj):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            return False
        return obj.lecturas.filter(usuario=request.user).exists()

    def create(self, validated_data):
        req = self.context.get("request")
        if req and req.user and not req.user.is_anonymous:
            validated_data["autor"] = req.user
        return super().create(validated_data)


class LecturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LecturaAviso
        fields = ["id", "aviso", "usuario", "visto_at"]
        read_only_fields = ["usuario", "visto_at"]

    def create(self, validated_data):
        req = self.context.get("request")
        if req and req.user and not req.user.is_anonymous:
            validated_data["usuario"] = req.user
        return super().create(validated_data)
