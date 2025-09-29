from django.db import models

class Aviso(models.Model):
    id = models.BigAutoField(primary_key=True)
    creado_por = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="creado_por")
    condominio = models.ForeignKey("propiedades.Condominio", models.SET_NULL, db_column="condominio_id", null=True, blank=True)
    titulo = models.CharField(max_length=140)
    cuerpo = models.TextField()
    categoria = models.CharField(max_length=20)  # normativa/mantenimiento/evento/seguridad
    vigente_desde = models.DateTimeField(auto_now_add=True)
    vigente_hasta = models.DateTimeField(blank=True, null=True)
    estado = models.CharField(max_length=12, default="PUBLICADO",
             choices=[("BORRADOR","BORRADOR"),("PUBLICADO","PUBLICADO"),("INACTIVO","INACTIVO"),("ELIMINADO","ELIMINADO")])
    class Meta: db_table = "avisos"

class AvisoDestinatario(models.Model):
    id = models.BigAutoField(primary_key=True)
    aviso = models.ForeignKey(Aviso, models.CASCADE, db_column="aviso_id")
    usuario = models.ForeignKey("usuarios.Usuarios", models.CASCADE, db_column="usuario_id", null=True, blank=True)
    unidad  = models.ForeignKey("propiedades.Unidad", models.CASCADE, db_column="unidad_id", null=True, blank=True)
    alcance = models.CharField(max_length=12)  # TODOS/ROL/UNIDAD/USUARIO
    class Meta: db_table = "avisos_destinatarios"

class AvisoAdjunto(models.Model):
    id = models.BigAutoField(primary_key=True)
    aviso = models.ForeignKey(Aviso, models.CASCADE, db_column="aviso_id")
    url = models.TextField()
    mime = models.CharField(max_length=60)
    class Meta: db_table = "avisos_adjuntos"
