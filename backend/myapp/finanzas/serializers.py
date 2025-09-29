from decimal import Decimal
from django.utils.dateparse import parse_date
from rest_framework import serializers

from .models import (
    Concepto, Cargo, Documento, Pago, PagoDetalle,
    DocumentoArchivo, PagoIntento, Reembolso, EstadoCuentaUnidad
)

# -----------------------------
# Conceptos
# -----------------------------
class ConceptoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concepto
        fields = "__all__"


# -----------------------------
# Cargos
# -----------------------------
class CargoSerializer(serializers.ModelSerializer):
    """
    - Valida monto > 0
    - Si no viene 'periodo', lo infiere de 'vencimiento' (primer día del mes)
    - 'unidad' es requerida (cuando no es un proceso masivo del frontend)
    """
    concepto = serializers.PrimaryKeyRelatedField(queryset=Concepto.objects.all())
    unidad = serializers.PrimaryKeyRelatedField(required=True, allow_null=False, queryset=Cargo._meta.get_field('unidad').remote_field.model.objects.all())

    class Meta:
        model = Cargo
        fields = [
            "id", "concepto", "unidad",
            "monto", "vencimiento", "periodo",
            "estado",  # por si lo expones como read-only
        ]
        read_only_fields = ["estado"]

    def validate_monto(self, value):
        try:
            v = Decimal(value)
        except Exception:
            raise serializers.ValidationError("Monto inválido.")
        if v <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0.")
        return v

    def validate(self, attrs):
        venc = attrs.get("vencimiento")
        periodo = attrs.get("periodo")
        if not periodo:
            # si no viene periodo, infiere del vencimiento
            if not venc:
                raise serializers.ValidationError({"vencimiento": "Debes enviar fecha de vencimiento."})
            d = parse_date(str(venc))
            if not d:
                raise serializers.ValidationError({"vencimiento": "Fecha de vencimiento inválida."})
            attrs["periodo"] = d.replace(day=1)

        # unidad obligatoria (los masivos el front los crea uno por unidad)
        if not attrs.get("unidad"):
            raise serializers.ValidationError({"unidad": "Debes seleccionar una unidad."})

        return attrs

    def create(self, validated_data):
        return super().create(validated_data)


# -----------------------------
# Documentos / Archivos
# -----------------------------
class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = "__all__"


class DocumentoArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoArchivo
        fields = "__all__"


# -----------------------------
# Pagos
# -----------------------------
class PagoDetalleSerializer(serializers.ModelSerializer):
    cargo = serializers.PrimaryKeyRelatedField(queryset=Cargo.objects.all())

    class Meta:
        model = PagoDetalle
        fields = ["id", "pago", "cargo", "monto_aplicado"]
        read_only_fields = ["pago"]


class PagoRegistrarDetalleSerializer(serializers.Serializer):
    cargo = serializers.PrimaryKeyRelatedField(queryset=Cargo.objects.all())
    monto_aplicado = serializers.DecimalField(max_digits=12, decimal_places=2)


class PagoRegistrarSerializer(serializers.Serializer):
    unidad_id = serializers.IntegerField(required=True)
    medio = serializers.ChoiceField(choices=["EFECTIVO", "TRANSFERENCIA", "QR", "TARJETA", "BILLETERA"])
    moneda = serializers.CharField(required=False, default="BOB")
    generar_documento = serializers.BooleanField(required=False, default=True)
    tipo_documento = serializers.CharField(required=False, default="RECIBO")
    numero_documento = serializers.CharField(required=False, allow_blank=True)
    detalles = PagoRegistrarDetalleSerializer(many=True)

    def validate(self, attrs):
        dets = attrs.get("detalles") or []
        if not dets:
            raise serializers.ValidationError({"detalles": "Debes enviar por lo menos un detalle."})
        total = Decimal("0")
        for d in dets:
            if Decimal(d["monto_aplicado"]) <= 0:
                raise serializers.ValidationError({"detalles": "Todos los montos deben ser > 0."})
            total += Decimal(d["monto_aplicado"])
        if total <= 0:
            raise serializers.ValidationError({"detalles": "El total debe ser > 0."})
        return attrs


class PagoSerializer(serializers.ModelSerializer):
    unidad = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Pago
        fields = "__all__"

    def get_unidad(self, obj):
        # Intentamos usar primer_detalle inyectado en queryset por el viewset
        det = getattr(obj, "primer_detalle", None)
        if det is None:
            det = obj.pagodetalle_set.select_related("cargo__unidad").first()
        if not det or not getattr(det, 'cargo', None) or not getattr(det.cargo, 'unidad_id', None):
            return None
        unidad = det.cargo.unidad
        # Preferir codigo, luego nombre, luego id
        return getattr(unidad, "codigo", None) or getattr(unidad, "nombre", None) or unidad.id


# -----------------------------
# PagoIntento
# -----------------------------
class PagoIntentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoIntento
        fields = "__all__"


# -----------------------------
# Reembolso
# -----------------------------
class ReembolsoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reembolso
        fields = "__all__"


# -----------------------------
# EstadoCuentaUnidad (read-only)
# -----------------------------
class EstadoCuentaUnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoCuentaUnidad
        fields = "__all__"
