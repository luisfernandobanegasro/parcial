# myapp/comunicacion/admin.py
from django.contrib import admin
from .models import Aviso, ArchivoAviso, LecturaAviso

class ArchivoAvisoInline(admin.TabularInline):
    model = ArchivoAviso
    extra = 0

class LecturaAvisoInline(admin.TabularInline):
    model = LecturaAviso
    extra = 0
    readonly_fields = ("usuario", "visto_at")

@admin.register(Aviso)
class AvisoAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo", "prioridad", "alcance", "condominio_id", "unidad_id",
                    "is_activo", "publicado_at", "vence_at")
    list_filter = ("prioridad", "alcance", "is_activo")
    search_fields = ("titulo", "cuerpo")
    inlines = [ArchivoAvisoInline, LecturaAvisoInline]

@admin.register(ArchivoAviso)
class ArchivoAvisoAdmin(admin.ModelAdmin):
    list_display = ("id", "aviso", "nombre", "subido_at")

@admin.register(LecturaAviso)
class LecturaAvisoAdmin(admin.ModelAdmin):
    list_display = ("id", "aviso", "usuario", "visto_at")
    autocomplete_fields = ("usuario",)
