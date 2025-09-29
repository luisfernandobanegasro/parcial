# backend/myapp/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    home,
    MeView,
    PasswordForgotView,
    PasswordResetConfirmView,
    PasswordChangeView,
)

urlpatterns = [
    # Públicas
    path("", home, name="home"),

    # === Auth (ambos paths para compatibilidad) ===
    path("auth/login/",  TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/",  TokenObtainPairView.as_view(), name="token_obtain_pair_compat"),   # << alias que usa el front
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("auth/password/forgot/",  PasswordForgotView.as_view(), name="password_forgot"),
    path("auth/password/reset/",   PasswordResetConfirmView.as_view(), name="password_reset"),

    # === Perfil (ambos paths para compatibilidad) ===
    path("me/",        MeView.as_view(), name="me"),
    path("users/me/",  MeView.as_view(), name="users-me"),  # << alias EXACTO que usa el front

    # Protegidas extra
    path("auth/password/change/", PasswordChangeView.as_view(), name="password_change"),

    # Módulos
    path("usuarios/", include("myapp.usuarios.urls")),
    path("roles/",    include("myapp.roles.urls")),
    path("api/propiedades/", include("myapp.propiedades.urls")),
    path("residentes/", include("myapp.residentes.urls")),
    path("finanzas/", include("myapp.finanzas.urls")),
    path("comunicacion/", include("myapp.comunicacion.urls")),
    path("reservas/", include("myapp.reservas.urls")),
    path("seguridad/", include("myapp.seguridad.urls")),
    path("mantenimiento/", include("myapp.mantenimiento.urls")),
    

]
