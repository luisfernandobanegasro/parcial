from rest_framework import serializers
from .models import TareaMantenimiento, TareaAsignacion, TareaComentario, TareaEvidencia

class TareaMantenimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TareaMantenimiento
        fields = "__all__"

class TareaAsignacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TareaAsignacion
        fields = "__all__"

class TareaComentarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TareaComentario
        fields = "__all__"

class TareaEvidenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TareaEvidencia
        fields = "__all__"
