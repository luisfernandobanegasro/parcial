from django.db import models

class Visitante(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=120)
    doc_id = models.CharField(max_length=40, blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    class Meta: db_table = "visitantes"

class Visita(models.Model):
    id = models.BigAutoField(primary_key=True)
    visitante = models.ForeignKey(Visitante, models.CASCADE, db_column="visitante_id")
    unidad    = models.ForeignKey("propiedades.Unidad", models.CASCADE, db_column="unidad_id")
    registrado_por = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="registrado_por")
    motivo = models.CharField(max_length=140, blank=True, null=True)
    foto_url = models.TextField(blank=True, null=True)
    vehiculo_placa = models.CharField(max_length=20, blank=True, null=True)
    ingreso_previsto = models.DateTimeField(blank=True, null=True)
    ingreso_real     = models.DateTimeField(blank=True, null=True)
    salida_real      = models.DateTimeField(blank=True, null=True)
    estado = models.CharField(max_length=12, default="PENDIENTE",
             choices=[("PENDIENTE","PENDIENTE"),("INGRESO","INGRESO"),("SALIDA","SALIDA"),("CANCELADA","CANCELADA")])
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = "visitas"
        indexes = [models.Index(fields=["unidad","estado"]), models.Index(fields=["visitante"])]
