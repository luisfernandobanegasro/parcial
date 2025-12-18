# myapp/roles/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RolViewSet, UsuarioRolesView, UsuarioRolDestroy, MisRolesView
from .views_permissions import (
    PermissionListView, PermissionDetailView, PermissionSyncView, GroupPermissionsView
)

router = DefaultRouter()
router.register(r"", RolViewSet, basename="roles")

urlpatterns = [
    # Permisos catálogo
    path("permisos/", PermissionListView.as_view(), name="permissions-list"),      # GET + POST
    path("permisos/<int:pk>/", PermissionDetailView.as_view(), name="permissions-detail"),  # DELETE
    path("permisos/sync/", PermissionSyncView.as_view(), name="permissions-sync"),

    # Permisos por grupo (o por tu rol id que se resuelve a Group)
    path("<int:group_id>/permisos/", GroupPermissionsView.as_view(), name="group-permissions"),
    path("<int:group_id>/permisos/<int:perm_id>/", GroupPermissionsView.as_view(), name="group-permissions-del"),

    # Roles por usuario
    path("usuarios/<uuid:usuario_id>/roles/", UsuarioRolesView.as_view(), name="usuario-roles"),
    path("usuarios/<uuid:usuario_id>/roles/<int:rol_id>/", UsuarioRolDestroy.as_view(), name="usuario-rol-destroy"),

    # Mis roles y CRUD de roles
    path("mios/", MisRolesView.as_view(), name="mis-roles"),
    path("", include(router.urls)),
]
