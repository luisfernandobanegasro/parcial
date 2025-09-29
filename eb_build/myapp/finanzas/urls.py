from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConceptoViewSet, CargoViewSet, DocumentoViewSet, PagoViewSet,
    PagoDetalleViewSet, DocumentoArchivoViewSet, PagoIntentoViewSet,
    ReembolsoViewSet, EstadoCuentaUnidadViewSet,
)

router = DefaultRouter()
router.register(r"conceptos",           ConceptoViewSet,           basename="conceptos")
router.register(r"cargos",              CargoViewSet,              basename="cargos")
router.register(r"documentos",          DocumentoViewSet,          basename="documentos")
router.register(r"pagos",               PagoViewSet,               basename="pagos")
router.register(r"pagos-detalle",       PagoDetalleViewSet,        basename="pagos-detalle")
router.register(r"documentos-archivos", DocumentoArchivoViewSet,   basename="documentos-archivos")
router.register(r"pagos-intentos",      PagoIntentoViewSet,        basename="pagos-intentos")
router.register(r"reembolsos",          ReembolsoViewSet,          basename="reembolsos")
router.register(r"estados",             EstadoCuentaUnidadViewSet, basename="estados")

urlpatterns = [
    path("", include(router.urls)),
    path("pagos/<int:pk>/asentar/", PagoViewSet.as_view({"patch": "asentar"}), name="pago-asentar"),
    path("pagos/<int:pk>/anular/",  PagoViewSet.as_view({"patch": "anular"}),  name="pago-anular"),
    path(
        "estados/unidad/<int:unidad_id>/",
        EstadoCuentaUnidadViewSet.as_view({"get": "list_por_unidad"}),
        name="estado-cuenta-unidad",
    ),
]
