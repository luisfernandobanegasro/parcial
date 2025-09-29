from rest_framework.routers import DefaultRouter
from .views import ResidenciaViewSet, MascotaViewSet

router = DefaultRouter()
router.register(r"residencias", ResidenciaViewSet, basename="residencias")
router.register(r"mascotas", MascotaViewSet, basename="mascotas")

urlpatterns = router.urls
