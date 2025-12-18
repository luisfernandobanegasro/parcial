from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CondominioViewSet, UnidadViewSet, UsuarioUnidadViewSet

router = DefaultRouter()
router.register(r"condominios", CondominioViewSet, basename="condominios")
router.register(r"unidades", UnidadViewSet, basename="unidades")
router.register(r"usuarios-unidades", UsuarioUnidadViewSet, basename="usuarios-unidades")

urlpatterns = [
    # Ruta explícita al action para asegurar que POST exista y no caiga en 404
    path(
        "unidades/<int:pk>/set_owner/",
        UnidadViewSet.as_view({"post": "set_owner"}),
        name="unidades-set-owner-explicit",
    ),
]

urlpatterns += router.urls
