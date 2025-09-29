from rest_framework.routers import DefaultRouter
from .views import VisitanteViewSet, VisitaViewSet
router = DefaultRouter()
router.register(r"visitantes", VisitanteViewSet)
router.register(r"visitas", VisitaViewSet)
urlpatterns = router.urls
