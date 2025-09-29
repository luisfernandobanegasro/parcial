from rest_framework import serializers
from .models import Residencia, Mascota

class ResidenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Residencia
        fields = "__all__"

class MascotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mascota
        fields = "__all__"
