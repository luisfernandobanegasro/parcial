# myapp/propiedades/serializers.py
from rest_framework import serializers
from .models import Condominio, Unidad, UsuarioUnidad

class CondominioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condominio
        fields = "__all__"

class UnidadSerializer(serializers.ModelSerializer):
    """Serializer de escritura/lectura básica."""
    class Meta:
        model  = Unidad
        fields = ["id", "condominio", "codigo", "piso", "area_m2", "estado", "creado_en", "actualizado_en"]

class UnidadListSerializer(serializers.ModelSerializer):
    """
    Serializer de LISTA con campos 'derivados' para mostrar en la tabla:
      - condominio_nombre
      - propietario (id del usuario actual principal)
      - propietario_nombre
    Estos campos los anota el ViewSet con Subquery.
    """
    condominio_nombre  = serializers.CharField(read_only=True)
    propietario        = serializers.UUIDField(read_only=True, allow_null=True)
    propietario_nombre = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model  = Unidad
        fields = [
            "id", "condominio", "condominio_nombre",
            "codigo", "piso", "area_m2", "estado",
            "propietario", "propietario_nombre",
            "creado_en", "actualizado_en",
        ]

class UsuarioUnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UsuarioUnidad
        fields = "__all__"
