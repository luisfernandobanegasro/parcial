from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def root(_):
    # opcional: evita 404 en "/"
    return HttpResponse("Backend OK. La UI está en http://localhost:3000")

urlpatterns = [
    path("", root),  # opcional, solo para no ver 404 en "/"
    path("admin/", admin.site.urls),

    # 👇 Endpoints JWT de SimpleJWT
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # 👇 tus endpoints de app
    path("api/", include("myapp.urls")),
]
