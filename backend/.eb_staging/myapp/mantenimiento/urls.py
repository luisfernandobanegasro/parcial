from rest_framework.routers import DefaultRouter
from .views import TareaMantenimientoViewSet, TareaAsignacionViewSet, TareaComentarioViewSet, TareaEvidenciaViewSet
router = DefaultRouter()
router.register(r"tareas", TareaMantenimientoViewSet)
router.register(r"tareas-asignaciones", TareaAsignacionViewSet)
router.register(r"tareas-comentarios", TareaComentarioViewSet)
router.register(r"tareas-evidencias", TareaEvidenciaViewSet)
urlpatterns = router.urls
