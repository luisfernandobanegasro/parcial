from rest_framework.viewsets import ModelViewSet
from .models import Aviso, AvisoAdjunto, AvisoDestinatario
from .serializers import AvisoSerializer, AvisoAdjuntoSerializer, AvisoDestinatarioSerializer
class AvisoViewSet(ModelViewSet): queryset=Aviso.objects.all(); serializer_class=AvisoSerializer
class AvisoAdjuntoViewSet(ModelViewSet): queryset=AvisoAdjunto.objects.all(); serializer_class=AvisoAdjuntoSerializer
class AvisoDestinatarioViewSet(ModelViewSet): queryset=AvisoDestinatario.objects.all(); serializer_class=AvisoDestinatarioSerializer
