from rest_framework import serializers
from .models import (
    Concepto, Cargo, Documento, Pago, PagoDetalle,
    DocumentoArchivo, PagoIntento, Reembolso, EstadoCuentaUnidad,
)

class ConceptoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concepto
        fields = "__all__"

class CargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cargo
        fields = "__all__"

class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = "__all__"

class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
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
