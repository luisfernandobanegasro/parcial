from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.filters import OrderingFilter
from django.db import models
from django.utils.dateparse import parse_date
from .models import (Concepto, Cargo, Documento, Pago, PagoDetalle, DocumentoArchivo, PagoIntento, Reembolso, EstadoCuentaUnidad)
from .serializers import (ConceptoSerializer, CargoSerializer, DocumentoSerializer, PagoSerializer, PagoDetalleSerializer, DocumentoArchivoSerializer, PagoIntentoSerializer, ReembolsoSerializer, EstadoCuentaUnidadSerializer)

class ConceptoViewSet(ModelViewSet): queryset=Concepto.objects.all(); serializer_class=ConceptoSerializer
class CargoViewSet(ModelViewSet): queryset=Cargo.objects.all(); serializer_class=CargoSerializer
class DocumentoViewSet(ModelViewSet): queryset=Documento.objects.all(); serializer_class=DocumentoSerializer
class PagoViewSet(ModelViewSet): queryset=Pago.objects.all(); serializer_class=PagoSerializer
class PagoDetalleViewSet(ModelViewSet): queryset=PagoDetalle.objects.all(); serializer_class=PagoDetalleSerializer
class DocumentoArchivoViewSet(ModelViewSet): queryset=DocumentoArchivo.objects.all(); serializer_class=DocumentoArchivoSerializer
class PagoIntentoViewSet(ModelViewSet): queryset=PagoIntento.objects.all(); serializer_class=PagoIntentoSerializer
class ReembolsoViewSet(ModelViewSet): queryset=Reembolso.objects.all(); serializer_class=ReembolsoSerializer

class EstadoCuentaUnidadViewSet(ReadOnlyModelViewSet):
    queryset = EstadoCuentaUnidad.objects.all().order_by("periodo","cargo_id")
    serializer_class = EstadoCuentaUnidadSerializer
    filter_backends = [OrderingFilter]
    ordering_fields = ["periodo","saldo","estado_calculado"]
    def get_queryset(self):
        qs = super().get_queryset()
        u = self.request.query_params.get("unidad_id")
        d = self.request.query_params.get("desde")
        h = self.request.query_params.get("hasta")
        e = self.request.query_params.get("estado")
        if u: qs = qs.filter(unidad_id=u)
        if d:
            pd = parse_date(d)
            if pd: qs = qs.filter(periodo__gte=pd)
        if h:
            ph = parse_date(h)
            if ph: qs = qs.filter(periodo__lte=ph)
        if e:
            qs = qs.filter(models.Q(estado_calculado=e) | models.Q(estado_registrado=e))
        return qs
