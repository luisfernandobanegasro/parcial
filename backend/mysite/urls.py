from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def root(_):
    return HttpResponse("Backend OK. La UI está en http://localhost:3000")

urlpatterns = [
    path("", root),
    path("admin/", admin.site.urls),

    # JWT (si los quieres también aquí, está bien)
    path("api/auth/token/",   TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(),    name="token_refresh"),

    # 👇 Monta TODO el backend de myapp aquí una sola vez
    path("api/", include("myapp.urls")),
]
