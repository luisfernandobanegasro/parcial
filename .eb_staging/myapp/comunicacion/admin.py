from django.contrib import admin
from .models import Aviso, AvisoDestinatario, AvisoAdjunto

admin.site.register(Aviso)
admin.site.register(AvisoDestinatario)
admin.site.register(AvisoAdjunto)
