from rest_framework.viewsets import ModelViewSet
from .models import AreaComun, Reserva, ReservaPago
from .serializers import AreaComunSerializer, ReservaSerializer, ReservaPagoSerializer
class AreaComunViewSet(ModelViewSet): queryset=AreaComun.objects.all(); serializer_class=AreaComunSerializer
class ReservaViewSet(ModelViewSet): queryset=Reserva.objects.all(); serializer_class=ReservaSerializer
class ReservaPagoViewSet(ModelViewSet): queryset=ReservaPago.objects.all(); serializer_class=ReservaPagoSerializer
