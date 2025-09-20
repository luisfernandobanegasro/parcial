from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

class Usuarios(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.TextField(unique=True)
    correo = models.TextField(unique=True)
    nombre_completo = models.TextField(blank=True, null=True)
    telefono = models.TextField(blank=True, null=True)
    hash_contrasena = models.TextField()  # no se usa para login
    activo = models.BooleanField(default=True)
    ultimo_login_en = models.DateTimeField(blank=True, null=True)


    #creado_en = models.DateTimeField(default=timezone.now)
    #actualizado_en = models.DateTimeField(default=timezone.now)
    
     # ✅ que se llenen solos
    creado_en = models.DateTimeField(auto_now_add=True)   # antes: default=timezone.now
    actualizado_en = models.DateTimeField(auto_now=True)  # antes: default=timezone.now


    auth_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        db_column='auth_user_id',
        null=True, blank=True,
        related_name='perfil',
    )

    class Meta:
        managed = False           # la tabla YA existe
        db_table = 'usuarios'

    def __str__(self):
        return self.usuario
