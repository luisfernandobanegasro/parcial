from django.contrib import admin
from .models import Condominio, Unidad, UsuarioUnidad

@admin.register(Condominio)
class CondominioAdmin(admin.ModelAdmin):
    list_display = ("id","nombre","direccion","creado_en")

@admin.register(Unidad)
class UnidadAdmin(admin.ModelAdmin):
    list_display = ("id","condominio","codigo","piso","area_m2","estado")

@admin.register(UsuarioUnidad)
class UsuarioUnidadAdmin(admin.ModelAdmin):
    list_display = ("id","usuario","unidad","porcentaje","es_principal","fecha_inicio","fecha_fin")
