from django.db import models
class TareaMantenimiento(models.Model):
    condominio = models.ForeignKey("propiedades.Condominio", models.CASCADE, db_column="condominio_id")
    titulo = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, null=True)
    prioridad = models.CharField(max_length=8, default="MEDIA")
    estado = models.CharField(max_length=15, default="PENDIENTE")
    unidad = models.ForeignKey("propiedades.Unidad", models.SET_NULL, db_column="unidad_id", null=True, blank=True)
    creada_por = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="creada_por")
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    class Meta: db_table = "tareas_mantenimiento"

class TareaAsignacion(models.Model):
    tarea = models.ForeignKey(TareaMantenimiento, models.CASCADE, db_column="tarea_id", related_name="asignaciones")
    asignado_a = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="asignado_a")
    asignado_en = models.DateTimeField(auto_now_add=True)
    class Meta: db_table = "tareas_asignaciones"

class TareaComentario(models.Model):
    tarea = models.ForeignKey(TareaMantenimiento, models.CASCADE, db_column="tarea_id", related_name="comentarios")
    autor = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="autor_id")
    comentario = models.TextField()
    creado_en = models.DateTimeField(auto_now_add=True)
    class Meta: db_table = "tareas_comentarios"

class TareaEvidencia(models.Model):
    tarea = models.ForeignKey(TareaMantenimiento, models.CASCADE, db_column="tarea_id", related_name="evidencias")
    url = models.TextField()
    tipo = models.CharField(max_length=20)
    class Meta: db_table = "tareas_evidencias"
