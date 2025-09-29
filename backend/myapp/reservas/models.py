from django.db import models
class AreaComun(models.Model):
    condominio = models.ForeignKey("propiedades.Condominio", models.CASCADE, db_column="condominio_id")
    nombre = models.CharField(max_length=80)
    capacidad = models.IntegerField(blank=True, null=True)
    requiere_pago = models.BooleanField(default=False)
    costo_base = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    politica = models.JSONField(default=dict)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    class Meta: db_table = "areas_comunes"; unique_together = (("condominio","nombre"),)

class Reserva(models.Model):
    area = models.ForeignKey(AreaComun, models.CASCADE, db_column="area_id")
    solicitante = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="solicitante_id")
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    asistentes = models.IntegerField(blank=True, null=True)
    motivo = models.CharField(max_length=140, blank=True, null=True)
    estado = models.CharField(max_length=15, default="PENDIENTE")
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    class Meta: db_table = "reservas"

class ReservaPago(models.Model):
    reserva = models.ForeignKey(Reserva, models.CASCADE, db_column="reserva_id")
    pago = models.ForeignKey("finanzas.Pago", models.CASCADE, db_column="pago_id")
    class Meta: db_table = "reservas_pagos"
