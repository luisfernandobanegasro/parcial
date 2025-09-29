from django.contrib import admin
from .models import Residencia, Mascota

@admin.register(Residencia)
class ResidenciaAdmin(admin.ModelAdmin):
    list_display = ("id","usuario","unidad","tipo","estado","fecha_ingreso","fecha_salida")
    list_filter = ("tipo","estado")
    search_fields = ("usuario__usuario","unidad__codigo")

@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = ("id","unidad","responsable","nombre","especie","estado")
    list_filter = ("especie","estado")
    search_fields = ("nombre","unidad__codigo")
