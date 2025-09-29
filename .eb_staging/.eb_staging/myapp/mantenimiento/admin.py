from django.contrib import admin
from .models import TareaMantenimiento, TareaAsignacion, TareaComentario, TareaEvidencia

admin.site.register(TareaMantenimiento)
admin.site.register(TareaAsignacion)
admin.site.register(TareaComentario)
admin.site.register(TareaEvidencia)
