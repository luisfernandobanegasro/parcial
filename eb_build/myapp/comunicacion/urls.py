from rest_framework.routers import DefaultRouter
from .views import AvisoViewSet, AvisoAdjuntoViewSet, AvisoDestinatarioViewSet
router = DefaultRouter()
router.register(r"avisos", AvisoViewSet)
router.register(r"avisos-adjuntos", AvisoAdjuntoViewSet)
router.register(r"avisos-destinatarios", AvisoDestinatarioViewSet)
urlpatterns = router.urls
