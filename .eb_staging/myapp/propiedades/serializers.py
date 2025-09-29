# myapp/propiedades/serializers.py
from rest_framework import serializers
from .models import Condominio, Unidad, UsuarioUnidad

class CondominioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condominio
        fields = "__all__"

class UnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidad
        fields = ["id", "condominio", "codigo", "piso", "area_m2", "estado", "creado_en", "actualizado_en"]

class UsuarioUnidadSerializer(serializers.ModelSerializer):
    # Solo lectura (conveniencia para la UI)
    usuario_nombre = serializers.CharField(source="usuario.nombre_completo", read_only=True)
    usuario_correo = serializers.CharField(source="usuario.correo", read_only=True)
    unidad_codigo  = serializers.CharField(source="unidad.codigo", read_only=True)
    condominio_id  = serializers.IntegerField(source="unidad.condominio_id", read_only=True)
    condominio_nombre = serializers.CharField(source="unidad.condominio.nombre", read_only=True)
    activo = serializers.SerializerMethodField()

    class Meta:
        model  = UsuarioUnidad
        fields = [
            "id", "usuario", "unidad", "porcentaje", "es_principal",
            "fecha_inicio", "fecha_fin", "creado_en", "actualizado_en",
            # extras
            "usuario_nombre", "usuario_correo",
            "unidad_codigo", "condominio_id", "condominio_nombre",
            "activo",
        ]

    def get_activo(self, obj):
        return obj.fecha_fin is None
