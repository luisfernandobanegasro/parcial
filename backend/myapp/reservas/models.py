# myapp/reservas/models.py
from django.db import models
from django.conf import settings


class AreaComun(models.Model):
    """Mapea la tabla existente public.areas_comunes"""
    nombre = models.CharField(max_length=80)
    capacidad = models.IntegerField(null=True, blank=True)
    requiere_pago = models.BooleanField(default=False)
    costo_base = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    # En tu DB es jsonb -> usa JSONField
    politica = models.JSONField(null=True, blank=True, default=dict)
    # Guardan id plano del condominio (no FK real en este módulo)
    condominio_id = models.BigIntegerField(null=True, blank=True)

    class Meta:
        db_table = "areas_comunes"
        managed = False  # ¡muy importante!
        ordering = ["id"]

    def __str__(self):
        return self.nombre


class Reserva(models.Model):
    """Mapea la tabla existente public.reservas"""
    # Ojo: en la DB los campos son 'inicio' y 'fin' (NO *_at)
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    asistentes = models.IntegerField(default=0)
    motivo = models.CharField(max_length=140, blank=True)
    # En la DB es varchar(15). Usa los valores que ya manejas.
    estado = models.CharField(max_length=15, default="PENDIENTE")

    area = models.ForeignKey(AreaComun, on_delete=models.PROTECT, related_name="reservas")
    # solicitante_id en DB es UUID (tu user pk es UUID). Si tu AUTH_USER_MODEL usa BigInt, cambia a BigIntegerField.
    solicitante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="reservas")

    class Meta:
        db_table = "reservas"
        managed = False  # ¡muy importante!
        ordering = ["-inicio", "-id"]

    def __str__(self):
        return f"Reserva #{self.id} — {self.area} ({self.inicio:%Y-%m-%d %H:%M})"


class ReservaPago(models.Model):
    """Tabla pivote ya existente public.reservas_pagos"""
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE, related_name="pagos_link")
    # La tabla de pagos existe fuera de este módulo. Guardamos el id como BigInt (sin FK dura para evitar dependencias).
    pago_id = models.BigIntegerField()

    class Meta:
        db_table = "reservas_pagos"
        managed = False  # ¡muy importante!
        ordering = ["id"]

    def __str__(self):
        return f"ReservaPago #{self.id} (reserva={self.reserva_id}, pago={self.pago_id})"
