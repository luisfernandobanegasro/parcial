# myapp/reservas/models.py
from django.db import models
from myapp.usuarios.models import Usuarios  # <- perfil con UUID


class AreaComun(models.Model):
    nombre = models.CharField(max_length=80)
    capacidad = models.IntegerField(null=True, blank=True)
    requiere_pago = models.BooleanField(default=False)
    costo_base = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    politica = models.JSONField(null=True, blank=True, default=dict)
    condominio_id = models.BigIntegerField(null=True, blank=True)

    class Meta:
        db_table = "areas_comunes"
        managed = False
        ordering = ["id"]

    def __str__(self):
        return self.nombre


class Reserva(models.Model):
    # columnas reales en BD
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    asistentes = models.IntegerField(default=0)
    motivo = models.CharField(max_length=140, blank=True)
    estado = models.CharField(max_length=15, default="PENDIENTE")

    area = models.ForeignKey(AreaComun, on_delete=models.PROTECT, related_name="reservas")

    # MUY IMPORTANTE: en la BD solicitante_id es UUID y referencia a "usuarios"
    solicitante = models.ForeignKey(
        Usuarios,
        on_delete=models.PROTECT,
        related_name="reservas",
        db_column="solicitante_id",
    )

    class Meta:
        db_table = "reservas"
        managed = False
        ordering = ["-inicio", "-id"]

    def __str__(self):
        return f"Reserva #{self.id} — {self.area} ({self.inicio:%Y-%m-%d %H:%M})"


class ReservaPago(models.Model):
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE, related_name="pagos_link")
    pago_id = models.BigIntegerField()

    class Meta:
        db_table = "reservas_pagos"
        managed = False
        ordering = ["id"]

    def __str__(self):
        return f"ReservaPago #{self.id} (reserva={self.reserva_id}, pago={self.pago_id})"
