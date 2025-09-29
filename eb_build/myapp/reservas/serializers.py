from rest_framework import serializers
from .models import AreaComun, Reserva, ReservaPago

class AreaComunSerializer(serializers.ModelSerializer):
    class Meta:
        model = AreaComun
        fields = "__all__"

class ReservaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reserva
        fields = "__all__"

class ReservaPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservaPago
        fields = "__all__"
