# myapp/reservas/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AreaComunViewSet, ReservaViewSet   # 👈 solo estos dos

router = DefaultRouter()
router.register(r"areas", AreaComunViewSet, basename="areas")
router.register(r"reservas", ReservaViewSet, basename="reservas")

urlpatterns = [
    path("", include(router.urls)),
]
