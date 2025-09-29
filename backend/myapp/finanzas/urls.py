from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConceptoViewSet, CargoViewSet, DocumentoViewSet, PagoViewSet,
    PagoDetalleViewSet, DocumentoArchivoViewSet, PagoIntentoViewSet,
    ReembolsoViewSet, EstadoCuentaUnidadViewSet,
    fake_checkout, fake_webhook,
)

router = DefaultRouter()
router.register(r"conceptos",           ConceptoViewSet,           basename="conceptos")
router.register(r"cargos",              CargoViewSet,              basename="cargos")
router.register(r"documentos",          DocumentoViewSet,          basename="documentos")
router.register(r"pagos",               PagoViewSet,               basename="pagos")
router.register(r"pagos-detalle",       PagoDetalleViewSet,        basename="pagos-detalle")
router.register(r"documentos-archivos", DocumentoArchivoViewSet,   basename="documentos-archivos")
# 👇 importante: SIN guion para que coincida con lo que usa el front: /pagointentos/...
router.register(r"pagointentos",        PagoIntentoViewSet,        basename="pagointentos")
router.register(r"reembolsos",          ReembolsoViewSet,          basename="reembolsos")
router.register(r"estados",             EstadoCuentaUnidadViewSet, basename="estados")

urlpatterns = [
    # Todas las rutas generadas por el router
    path("", include(router.urls)),

    # Acciones explícitas sobre Pago (además de las del router):
    path("pagos/<int:pk>/asentar/",     PagoViewSet.as_view({"patch": "asentar"}),     name="pago-asentar"),
    path("pagos/<int:pk>/anular/",      PagoViewSet.as_view({"patch": "anular"}),      name="pago-anular"),

    # 👇 añadimos explícitamente las dos acciones que te daban 404
    path("pagos/<int:pk>/qr_png/",      PagoViewSet.as_view({"get":   "qr_png"}),      name="pago-qr-png"),
    path("pagos/<int:pk>/validar_qr/",  PagoViewSet.as_view({"post":  "validar_qr"}),  name="pago-validar-qr"),

    # Estado de cuenta por unidad (action custom del viewset de lectura)
    path(
        "estados/unidad/<int:unidad_id>/",
        EstadoCuentaUnidadViewSet.as_view({"get": "list_por_unidad"}),
        name="estado-cuenta-unidad",
    ),

    # Pasarela FAKE de demo
    path("pasarelas/fake/checkout/<int:intento_id>/", fake_checkout),
    path("pasarelas/fake/webhook/", fake_webhook),
]
