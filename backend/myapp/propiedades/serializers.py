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
        fields = [
            "id", "condominio", "codigo", "piso", "area_m2",
            "estado", "creado_en", "actualizado_en"
        ]

    def validate(self, attrs):
        """
        Evita duplicados condominio+codigo, excluyendo la instancia en edición.
        """
        instance = getattr(self, "instance", None)
        condominio = attrs.get("condominio", getattr(instance, "condominio", None))
        codigo     = attrs.get("codigo",     getattr(instance, "codigo", None))

        if condominio and codigo:
            qs = Unidad.objects.filter(condominio=condominio, codigo=codigo)
            if instance:
                qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    "non_field_errors": [
                        "Ya existe una unidad con ese código en el condominio."
                    ]
                })
        return attrs

class UsuarioUnidadSerializer(serializers.ModelSerializer):
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
            "usuario_nombre", "usuario_correo",
            "unidad_codigo", "condominio_id", "condominio_nombre",
            "activo",
        ]

    def get_activo(self, obj):
        return obj.fecha_fin is None


class UnidadListSerializer(serializers.ModelSerializer):
    condominio = serializers.IntegerField(source="condominio_id", read_only=True)
    condominio_nombre = serializers.CharField(source="condominio.nombre", read_only=True)

    # nuevos campos desde las anotaciones del ViewSet
    propietario_id = serializers.UUIDField(read_only=True)
    propietario_nombre = serializers.CharField(read_only=True)
    residente_id = serializers.UUIDField(read_only=True)
    residente_nombre = serializers.CharField(read_only=True)

    class Meta:
        model = Unidad
        fields = (
            "id", "codigo", "piso", "area_m2", "estado",
            "condominio", "condominio_nombre",
            "propietario_id", "propietario_nombre",
            "residente_id", "residente_nombre",
        )
