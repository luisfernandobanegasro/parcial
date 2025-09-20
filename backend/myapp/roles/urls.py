from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RolViewSet, UsuarioRolesView, UsuarioRolDestroy

router = DefaultRouter()
router.register(r"", RolViewSet, basename="roles")

urlpatterns = [
    path("", include(router.urls)),
    path("usuarios/<uuid:usuario_id>/roles/", UsuarioRolesView.as_view()),
    path("usuarios/<uuid:usuario_id>/roles/<int:rol_id>/", UsuarioRolDestroy.as_view()),
]
