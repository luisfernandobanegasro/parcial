from decimal import Decimal
from datetime import date

from rest_framework import serializers
from django.db import transaction

from .models import (
    Concepto, Cargo, Documento, Pago, PagoDetalle,
    DocumentoArchivo, PagoIntento, Reembolso, EstadoCuentaUnidad,
)
# myapp/finanzas/serializers.py
from rest_framework import serializers
from .models import Pago, PagoDetalle, Cargo, Documento, Concepto, DocumentoArchivo, Reembolso, EstadoCuentaUnidad



# =============== BÁSICOS ===============
class ConceptoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concepto
        fields = "__all__"


class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = "__all__"


class PagoDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoDetalle
        fields = "__all__"


class DocumentoArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoArchivo
        fields = "__all__"


class PagoIntentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoIntento
        fields = "__all__"


class ReembolsoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reembolso
        fields = "__all__"


class EstadoCuentaUnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoCuentaUnidad
        fields = "__all__"


# =============== CARGOS ===============
class CargoSerializer(serializers.ModelSerializer):
    # ⚠️ En el modelo NO existe "condominio".
    # Lo aceptamos como write_only para que, si llega desde el front (para filtros),
    # no rompa la creación/edición. Lo IGNORAMOS en create/update.
    condominio = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Cargo
        fields = "__all__"
        read_only_fields = ("estado",)

    # ------- helpers -------
    def _ensure_periodo(self, validated_data):
        """Si no mandan 'periodo', usar el 1er día del mes del 'vencimiento'."""
        if "periodo" not in validated_data and validated_data.get("vencimiento"):
            v = validated_data["vencimiento"]
            validated_data["periodo"] = date(v.year, v.month, 1)

    # ------- validación general -------
    def validate(self, attrs):
        errors = {}
        if not attrs.get("concepto"):
            errors["concepto"] = "Requerido"
        if not attrs.get("unidad"):
            errors["unidad"] = "Requerido"
        if not attrs.get("monto"):
            errors["monto"] = "Requerido"
        if not attrs.get("vencimiento"):
            errors["vencimiento"] = "Requerido"
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    # ------- persistencia -------
    def create(self, validated_data):
        validated_data.pop("condominio", None)  # ignorar si vino del front
        self._ensure_periodo(validated_data)
        validated_data.setdefault("recargo", Decimal("0.00"))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("condominio", None)  # ignorar si vino del front
        self._ensure_periodo(validated_data)
        return super().update(instance, validated_data)


# =============== PAGOS ===============
class PagoReadDetalleSerializer(serializers.ModelSerializer):
    concepto = serializers.CharField(source="cargo.concepto.nombre", read_only=True)
    periodo = serializers.DateField(source="cargo.periodo", read_only=True)

    class Meta:
        model = PagoDetalle
        fields = ("id", "cargo", "concepto", "periodo", "monto_aplicado")



class PagoDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoDetalle
        fields = ("id", "cargo", "monto_aplicado")

class PagoSerializer(serializers.ModelSerializer):
    # Nuevo: unidad (read-only) para que se muestre en el listado
    unidad = serializers.SerializerMethodField()
    documento = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Pago
        fields = ("id", "fecha", "medio", "estado", "monto", "documento", "unidad")

    def get_unidad(self, obj):
        # toma la unidad del primer detalle (si hay)
        det = getattr(obj, "primer_detalle", None)
        if det and det.cargo_id:
            # si prefetch/annotamos primer_detalle en el viewset (ver abajo)
            c = det.cargo if hasattr(det, "cargo") else None
            if c and c.unidad_id:
                return c.unidad_id
        # fallback sin anotación
        pd = obj.pagodetalle_set.select_related("cargo__unidad").order_by("id").first()
        return pd.cargo.unidad_id if pd and pd.cargo and pd.cargo.unidad_id else None


# ---- Serializador para registrar pagos (payload custom) ----
class PagoDetalleInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoDetalle
        fields = ("cargo", "monto_aplicado")


class PagoRegistrarSerializer(serializers.Serializer):
    unidad_id = serializers.IntegerField()
    medio = serializers.ChoiceField(choices=["EFECTIVO", "QR", "TARJETA", "BILLETERA", "TRANSFERENCIA"])
    moneda = serializers.CharField(required=False, allow_blank=True, default="BOB")
    detalles = PagoDetalleInlineSerializer(many=True)
    generar_documento = serializers.BooleanField(required=False, default=True)
    tipo_documento = serializers.ChoiceField(choices=["RECIBO", "FACTURA"], required=False, default="RECIBO")
    numero_documento = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        from .models import Cargo  # evitar ciclos
        unidad_id = attrs["unidad_id"]
        detalles = attrs["detalles"]
        if not detalles:
            raise serializers.ValidationError("Debes enviar al menos un detalle.")
        total = Decimal("0.00")
        cargos = []
        for d in detalles:
            cargo = d["cargo"]
            if isinstance(cargo, int):
                cargo = Cargo.objects.get(pk=cargo)
                d["cargo"] = cargo
            if cargo.unidad_id != unidad_id:
                raise serializers.ValidationError(f"El cargo {cargo.id} no pertenece a la unidad indicada.")
            if cargo.estado == "ANULADO":
                raise serializers.ValidationError(f"El cargo {cargo.id} está ANULADO.")
            if Decimal(d["monto_aplicado"]) <= 0:
                raise serializers.ValidationError("Los montos aplicados deben ser > 0.")
            cargos.append(cargo)
            total += Decimal(d["monto_aplicado"])
        if total <= 0:
            raise serializers.ValidationError("El total debe ser mayor a 0.")
        attrs["__total__"] = total
        attrs["__cargos__"] = cargos
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        # La creación real se hace en la view PagoViewSet.registrar.
        raise NotImplementedError("Uso interno en PagoViewSet.registrar")
