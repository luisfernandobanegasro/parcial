from django.urls import path,include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
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
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/password/forgot/", PasswordForgotView.as_view(), name="password_forgot"),
    path("auth/password/reset/", PasswordResetConfirmView.as_view(), name="password_reset"),

    # Protegidas
    path("me/", MeView.as_view(), name="me"),
    path("auth/password/change/", PasswordChangeView.as_view(), name="password_change"),  # 👈 NUEVO (JWT requerido)
    
    
    path('usuarios/', include('myapp.usuarios.urls')),
    path("roles/",    include("myapp.roles.urls")), 

]
