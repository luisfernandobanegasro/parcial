# myapp/roles/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RolViewSet, UsuarioRolesView, UsuarioRolDestroy, MisRolesView
from .views_permissions import PermissionListView, PermissionSyncView, GroupPermissionsView

router = DefaultRouter()
router.register(r"", RolViewSet, basename="roles")

urlpatterns = [
    # ⚠️ Primero las rutas que empiezan con "permisos" para que NO las capture el router.
    path("permisos/", PermissionListView.as_view(), name="permissions-list"),
    path("permisos/sync/", PermissionSyncView.as_view(), name="permissions-sync"),
    path("<int:group_id>/permisos/", GroupPermissionsView.as_view(), name="group-permissions"),
    path("<int:group_id>/permisos/<int:perm_id>/", GroupPermissionsView.as_view(), name="group-permissions-del"),

    # Roles de usuario
    path("usuarios/<uuid:usuario_id>/roles/", UsuarioRolesView.as_view()),
    path("usuarios/<uuid:usuario_id>/roles/<int:rol_id>/", UsuarioRolDestroy.as_view()),
    path("mios/", MisRolesView.as_view()),

    # Al final, el router
    path("", include(router.urls)),
]
