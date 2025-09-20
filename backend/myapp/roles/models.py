from django.db import models
from myapp.usuarios.models import Usuarios

class Roles(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'roles'

    def __str__(self):
        return self.nombre

class UsuarioRoles(models.Model):
    # ajusta db_column si en tu tabla se llama distinto (p.ej. role_id / id_rol)
    usuario = models.ForeignKey(Usuarios, models.DO_NOTHING, db_column='usuario_id')
    rol     = models.ForeignKey(Roles,    models.DO_NOTHING, db_column='rol_id')

    class Meta:
        managed = False
        db_table = 'usuario_roles'
        unique_together = (('usuario', 'rol'),)
