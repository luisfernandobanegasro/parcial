# myapp/reservas/serializers.py
from rest_framework import serializers
from .models import AreaComun, Reserva, ReservaPago
from myapp.usuarios.models import Usuarios  # <- para obtener el perfil

class AreaComunSerializer(serializers.ModelSerializer):
    class Meta:
        model = AreaComun
        fields = ["id", "nombre", "capacidad", "requiere_pago", "costo_base", "politica", "condominio_id"]


class ReservaSerializer(serializers.ModelSerializer):
    area_nombre = serializers.CharField(source="area.nombre", read_only=True)
    # username viene desde el auth_user asociado al perfil Usuarios
    solicitante_username = serializers.CharField(source="solicitante.auth_user.username", read_only=True)

    class Meta:
        model = Reserva
        fields = [
            "id", "inicio", "fin", "asistentes", "motivo", "estado",
            "area", "area_nombre", "solicitante", "solicitante_username"
        ]
        read_only_fields = ["solicitante", "estado"]

    def validate(self, attrs):
        inicio = attrs.get("inicio", getattr(self.instance, "inicio", None))
        fin = attrs.get("fin", getattr(self.instance, "fin", None))
        if not inicio or not fin or fin <= inicio:
            raise serializers.ValidationError("Rango de tiempo inválido (fin debe ser > inicio).")
        return attrs

    def create(self, validated_data):
        req = self.context.get("request")
        if not req or not req.user or req.user.is_anonymous:
            raise serializers.ValidationError("Usuario no autenticado.")
        # Buscar el perfil (UUID) vinculado al auth_user actual
        perfil = Usuarios.objects.filter(auth_user=req.user).first()
        if not perfil:
            raise serializers.ValidationError("No existe un perfil (Usuarios) para el usuario actual.")
        validated_data["solicitante"] = perfil
        validated_data.setdefault("estado", "PENDIENTE")
        return super().create(validated_data)


class ReservaPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservaPago
        fields = ["id", "reserva", "pago_id"]
