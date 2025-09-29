# myapp/propiedades/urls.py
from rest_framework.routers import DefaultRouter
from .views import CondominioViewSet, UnidadViewSet, UsuarioUnidadViewSet

router = DefaultRouter()
router.register(r"condominios", CondominioViewSet, basename="condominios")
router.register(r"unidades", UnidadViewSet, basename="unidades")
router.register(r"usuarios-unidades", UsuarioUnidadViewSet, basename="usuarios-unidades")

urlpatterns = router.urls
