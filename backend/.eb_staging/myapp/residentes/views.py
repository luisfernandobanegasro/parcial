from rest_framework.viewsets import ModelViewSet
from .models import Residencia, Mascota
from .serializers import ResidenciaSerializer, MascotaSerializer

class ResidenciaViewSet(ModelViewSet):
    queryset = Residencia.objects.all(); serializer_class = ResidenciaSerializer

class MascotaViewSet(ModelViewSet):
    queryset = Mascota.objects.all(); serializer_class = MascotaSerializer
