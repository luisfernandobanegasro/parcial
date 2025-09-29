from django.db import models

class Residencia(models.Model):
    usuario = models.ForeignKey("usuarios.Usuarios", models.CASCADE, db_column="usuario_id")
    unidad  = models.ForeignKey("propiedades.Unidad", models.CASCADE, db_column="unidad_id")
    tipo = models.CharField(max_length=15, choices=[("TITULAR","TITULAR"),("INQUILINO","INQUILINO"),("FAMILIAR","FAMILIAR")])
    estado = models.CharField(max_length=10, default="ACTIVO")
    fecha_ingreso = models.DateField()
    fecha_salida  = models.DateField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta: db_table = "residencias"; unique_together = (("usuario","unidad","fecha_ingreso"),)

class Mascota(models.Model):
    unidad = models.ForeignKey("propiedades.Unidad", models.CASCADE, db_column="unidad_id")
    responsable = models.ForeignKey("usuarios.Usuarios", models.SET_NULL, db_column="responsable_id", null=True, blank=True)
    nombre = models.CharField(max_length=60)
    especie = models.CharField(max_length=30)
    raza = models.CharField(max_length=40, blank=True, null=True)
    tamano = models.CharField(max_length=15, blank=True, null=True)
    color = models.CharField(max_length=30, blank=True, null=True)
    esterilizada = models.BooleanField(default=False)
    peligrosa = models.BooleanField(default=False)
    autorizada = models.BooleanField(default=True)
    estado = models.CharField(max_length=12, default="ACTIVA")
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta: db_table = "mascotas"; unique_together = (("unidad","nombre"),)
