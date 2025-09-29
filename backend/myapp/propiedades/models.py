from django.db import models

class Condominio(models.Model):
    nombre = models.CharField(max_length=200, unique=True)
    direccion = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "condominios"

    def __str__(self): return self.nombre

class Unidad(models.Model):
    condominio = models.ForeignKey(Condominio, models.CASCADE, db_column="condominio_id", related_name="unidades")
    codigo = models.CharField(max_length=50)
    piso = models.IntegerField(blank=True, null=True)
    area_m2 = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    estado = models.CharField(max_length=20, blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "unidades"
        unique_together = (("condominio","codigo"),)

    def __str__(self): return f"{self.condominio.nombre} - {self.codigo}"

class UsuarioUnidad(models.Model):
    usuario = models.ForeignKey("usuarios.Usuarios", models.CASCADE, db_column="usuario_id", related_name="copropiedades")
    unidad  = models.ForeignKey(Unidad, models.CASCADE, db_column="unidad_id", related_name="copropietarios")
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    es_principal = models.BooleanField(default=False)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "usuarios_unidades"
        unique_together = (("usuario","unidad","fecha_inicio"),)
