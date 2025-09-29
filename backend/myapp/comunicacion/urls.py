# myapp/comunicacion/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AvisoViewSet, LecturaViewSet

router = DefaultRouter()
router.register(r"avisos", AvisoViewSet, basename="avisos")
router.register(r"lecturas", LecturaViewSet, basename="lecturas")

urlpatterns = [
    path("", include(router.urls)),
]
