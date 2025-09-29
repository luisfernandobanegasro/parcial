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
    
    path("api/roles/", include("myapp.roles.urls")),
    path("api/propiedades/", include("myapp.propiedades.urls")),  # si creaste urls en propiedades
    path("api/residentes/", include("myapp.residentes.urls")),
    path("api/finanzas/", include("myapp.finanzas.urls")),
    path("api/comunicacion/", include("myapp.comunicacion.urls")),
    path("api/reservas/", include("myapp.reservas.urls")),
    path("api/seguridad/", include("myapp.seguridad.urls")),
    path("api/mantenimiento/", include("myapp.mantenimiento.urls")),
]



    # "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU4NTI4NTkxLCJpYXQiOjE3NTg1MjQ5OTIsImp0aSI6IjM0MGEyZDdjMTJlYjQ3ODU5MzllZDZhOTk2NDZmMjljIiwidXNlcl9pZCI6IjIifQ.e1sWdKCWaOCt0S9Xkh