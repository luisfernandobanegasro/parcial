# myapp/reservas/admin.py
from django.contrib import admin
from .models import AreaComun, Reserva, ReservaPago

@admin.register(AreaComun)
class AreaComunAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "capacidad", "requiere_pago", "costo_base", "condominio_id")
    search_fields = ("nombre",)
    list_filter = ("requiere_pago",)

@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ("id", "area", "solicitante", "inicio", "fin", "estado", "asistentes", "motivo")
    search_fields = ("motivo", "area__nombre", "solicitante__username")
    list_filter = ("estado", "area")

@admin.register(ReservaPago)
class ReservaPagoAdmin(admin.ModelAdmin):
    list_display = ("id", "reserva", "pago_id")
    search_fields = ("reserva__id", "pago_id")
