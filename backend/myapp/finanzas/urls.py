from rest_framework.routers import DefaultRouter
from .views import (ConceptoViewSet, CargoViewSet, DocumentoViewSet, PagoViewSet, PagoDetalleViewSet, DocumentoArchivoViewSet, PagoIntentoViewSet, ReembolsoViewSet, EstadoCuentaUnidadViewSet)

router = DefaultRouter()
router.register(r"conceptos", ConceptoViewSet)
router.register(r"cargos", CargoViewSet)
router.register(r"documentos", DocumentoViewSet)
router.register(r"pagos", PagoViewSet)
router.register(r"pagos-detalle", PagoDetalleViewSet)
router.register(r"documentos-archivos", DocumentoArchivoViewSet)
router.register(r"pagos-intentos", PagoIntentoViewSet)
router.register(r"reembolsos", ReembolsoViewSet)
router.register(r"estado-cuenta", EstadoCuentaUnidadViewSet, basename="estado-cuenta")

urlpatterns = router.urls
