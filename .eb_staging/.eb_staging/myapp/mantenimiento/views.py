from rest_framework.viewsets import ModelViewSet
from .models import TareaMantenimiento, TareaAsignacion, TareaComentario, TareaEvidencia
from .serializers import TareaMantenimientoSerializer, TareaAsignacionSerializer, TareaComentarioSerializer, TareaEvidenciaSerializer

class TareaMantenimientoViewSet(ModelViewSet): queryset=TareaMantenimiento.objects.all(); serializer_class=TareaMantenimientoSerializer
class TareaAsignacionViewSet(ModelViewSet): queryset=TareaAsignacion.objects.all(); serializer_class=TareaAsignacionSerializer
class TareaComentarioViewSet(ModelViewSet): queryset=TareaComentario.objects.all(); serializer_class=TareaComentarioSerializer
class TareaEvidenciaViewSet(ModelViewSet): queryset=TareaEvidencia.objects.all(); serializer_class=TareaEvidenciaSerializer
