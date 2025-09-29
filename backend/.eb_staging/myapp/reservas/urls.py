from rest_framework.routers import DefaultRouter
from .views import AreaComunViewSet, ReservaViewSet, ReservaPagoViewSet
router = DefaultRouter()
router.register(r"areas-comunes", AreaComunViewSet)
router.register(r"reservas", ReservaViewSet)
router.register(r"reservas-pagos", ReservaPagoViewSet)
urlpatterns = router.urls
