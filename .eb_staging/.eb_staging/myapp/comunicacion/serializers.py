from rest_framework import serializers
from .models import Aviso, AvisoAdjunto, AvisoDestinatario

class AvisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aviso
        fields = "__all__"

class AvisoAdjuntoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvisoAdjunto
        fields = "__all__"

class AvisoDestinatarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvisoDestinatario
        fields = "__all__"
