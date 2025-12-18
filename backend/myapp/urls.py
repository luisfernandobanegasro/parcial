from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    home, MeView, PasswordForgotView, PasswordResetConfirmView, PasswordChangeView,
)

urlpatterns = [
    path("", home, name="home"),

    # Auth
    path("auth/login/",   TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/",   TokenObtainPairView.as_view(), name="token_obtain_pair_compat"),
    path("auth/refresh/", TokenRefreshView.as_view(),    name="token_refresh"),
    path("auth/password/forgot/",  PasswordForgotView.as_view(),    name="password_forgot"),
    path("auth/password/reset/",   PasswordResetConfirmView.as_view(), name="password_reset"),
    path("auth/password/change/",  PasswordChangeView.as_view(),     name="password_change"),

    # Perfil
    path("me/",       MeView.as_view(), name="me"),
    path("users/me/", MeView.as_view(), name="users-me"),

    # Módulos (todos aquí)
    path("usuarios/",     include("myapp.usuarios.urls")),
    path("roles/",        include("myapp.roles.urls")),
    path("propiedades/", include("myapp.propiedades.urls")),
    path("residentes/",   include("myapp.residentes.urls")),
    path("finanzas/",     include("myapp.finanzas.urls")),
    path("comunicacion/", include("myapp.comunicacion.urls")),
    path("reservas/",     include("myapp.reservas.urls")),
    path("seguridad/",    include("myapp.seguridad.urls")),
    path("mantenimiento/",include("myapp.mantenimiento.urls")),

    path("push/", include("myapp.push.urls")),

]
