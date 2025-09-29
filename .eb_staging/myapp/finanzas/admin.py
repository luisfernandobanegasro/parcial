from django.contrib import admin
from .models import Concepto, Cargo, Documento, Pago, PagoDetalle, DocumentoArchivo

admin.site.register(Concepto)
admin.site.register(Cargo)
admin.site.register(Documento)
admin.site.register(Pago)
admin.site.register(PagoDetalle)
admin.site.register(DocumentoArchivo)
