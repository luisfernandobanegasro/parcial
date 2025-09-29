# myapp/comunicacion/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone


class Aviso(models.Model):
    PRIORIDAD_CHOICES = (
        ("INFO", "Informativo"),
        ("ALERTA", "Alerta"),
        ("URGENTE", "Urgente"),
    )
    ALCANCE_CHOICES = (
        ("TODOS", "Todos"),
        ("CONDOMINIO", "Condominio"),
        ("UNIDAD", "Unidad"),
    )

    titulo = models.CharField(max_length=200)
    cuerpo = models.TextField()
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default="INFO")
    alcance = models.CharField(max_length=12, choices=ALCANCE_CHOICES, default="TODOS")

    # Para no acoplar a otros apps/llaves, guardamos IDs directamente (opcional)
    condominio_id = models.IntegerField(null=True, blank=True)
    unidad_id = models.IntegerField(null=True, blank=True)

    vence_at = models.DateTimeField(null=True, blank=True)
    publicado_at = models.DateTimeField(default=timezone.now)
    is_activo = models.BooleanField(default=True)

    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ["-publicado_at", "-id"]

    def __str__(self):
        return f"[{self.prioridad}] {self.titulo}"

    @property
    def esta_vigente(self):
        return self.is_activo and (self.vence_at is None or self.vence_at > timezone.now())


def aviso_upload_to(instance, filename):
    return f"avisos/{instance.aviso_id}/{filename}"


class ArchivoAviso(models.Model):
    aviso = models.ForeignKey(Aviso, related_name="archivos", on_delete=models.CASCADE)
    archivo = models.FileField(upload_to=aviso_upload_to)
    nombre = models.CharField(max_length=200, blank=True)
    subido_at = models.DateTimeField(auto_now_add=True)


class LecturaAviso(models.Model):
    aviso = models.ForeignKey(Aviso, related_name="lecturas", on_delete=models.CASCADE)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    visto_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("aviso", "usuario")]
        indexes = [models.Index(fields=["usuario", "aviso"])]
