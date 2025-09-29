from django.db import models
class Aviso(models.Model):
    creado_por = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="creado_por")
    condominio = models.ForeignKey("propiedades.Condominio", models.SET_NULL, db_column="condominio_id", null=True, blank=True)
    titulo = models.CharField(max_length=140)
    cuerpo = models.TextField()
    categoria = models.CharField(max_length=20)
    vigente_desde = models.DateTimeField(auto_now_add=True)
    vigente_hasta = models.DateTimeField(blank=True, null=True)
    estado = models.CharField(max_length=12, default="PUBLICADO")
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    class Meta: db_table = "avisos"

class AvisoAdjunto(models.Model):
    aviso = models.ForeignKey(Aviso, models.CASCADE, db_column="aviso_id", related_name="adjuntos")
    url = models.TextField(); mime = models.CharField(max_length=60)
    class Meta: db_table = "avisos_adjuntos"

class AvisoDestinatario(models.Model):
    aviso = models.ForeignKey(Aviso, models.CASCADE, db_column="aviso_id", related_name="destinatarios")
    usuario = models.ForeignKey("usuarios.Usuarios", models.CASCADE, db_column="usuario_id", null=True, blank=True)
    unidad = models.ForeignKey("propiedades.Unidad", models.CASCADE, db_column="unidad_id", null=True, blank=True)
    alcance = models.CharField(max_length=12)  # TODOS/ROL/UNIDAD/USUARIO
    class Meta: db_table = "avisos_destinatarios"
