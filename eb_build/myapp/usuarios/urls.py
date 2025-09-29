from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import MeView, UsuarioViewSet

router = DefaultRouter()
router.register(r'', UsuarioViewSet, basename='usuarios')

urlpatterns = [
    path('me/', MeView.as_view()),  # /api/usuarios/me/
]
urlpatterns += router.urls
