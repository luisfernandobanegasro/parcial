from rest_framework.viewsets import ModelViewSet
from .models import Visitante, Visita
from .serializers import VisitanteSerializer, VisitaSerializer
class VisitanteViewSet(ModelViewSet): queryset=Visitante.objects.all(); serializer_class=VisitanteSerializer
class VisitaViewSet(ModelViewSet): queryset=Visita.objects.all(); serializer_class=VisitaSerializer
