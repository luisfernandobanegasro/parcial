from django.db import models

class AreaComun(models.Model):
    id = models.AutoField(primary_key=True)
    condominio = models.ForeignKey("propiedades.Condominio", models.CASCADE, db_column="condominio_id")
    nombre = models.CharField(max_length=80)
    capacidad = models.IntegerField(blank=True, null=True)
    requiere_pago = models.BooleanField(default=False)
    costo_base = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    politica = models.JSONField(default=dict)   # horarios, penalidades
    class Meta:
        db_table = "areas_comunes"
        constraints = [models.UniqueConstraint(fields=["condominio","nombre"], name="uq_area_nombre")]

class Reserva(models.Model):
    id = models.BigAutoField(primary_key=True)
    area = models.ForeignKey(AreaComun, models.CASCADE, db_column="area_id")
    solicitante = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="solicitante_id")
    inicio = models.DateTimeField()
    fin    = models.DateTimeField()
    asistentes = models.IntegerField(blank=True, null=True)
    motivo  = models.CharField(max_length=140, blank=True, null=True)
    estado  = models.CharField(max_length=15, default="PENDIENTE",
              choices=[("PENDIENTE","PENDIENTE"),("CONFIRMADA","CONFIRMADA"),("RECHAZADA","RECHAZADA"),("CANCELADA","CANCELADA"),("USADA","USADA"),("EXPIRADA","EXPIRADA")])
    class Meta:
        db_table = "reservas"
        indexes = [models.Index(fields=["area","inicio","fin"])]

class ReservaPago(models.Model):
    id = models.BigAutoField(primary_key=True)
    reserva = models.ForeignKey(Reserva, models.CASCADE, db_column="reserva_id")
    pago    = models.ForeignKey("finanzas.Pago", models.CASCADE, db_column="pago_id")
    class Meta: db_table = "reservas_pagos"
