from django.db import models

class TareaMantenimiento(models.Model):
    id = models.BigAutoField(primary_key=True)
    condominio = models.ForeignKey("propiedades.Condominio", models.CASCADE, db_column="condominio_id")
    titulo = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, null=True)
    prioridad = models.CharField(max_length=8, choices=[("BAJA","BAJA"),("MEDIA","MEDIA"),("ALTA","ALTA")])
    estado = models.CharField(max_length=15, default="PENDIENTE",
             choices=[("PENDIENTE","PENDIENTE"),("ASIGNADA","ASIGNADA"),("EN_CURSO","EN_CURSO"),
                      ("RESUELTA","RESUELTA"),("CERRADA","CERRADA"),("PAUSADA","PAUSADA")])
    unidad = models.ForeignKey("propiedades.Unidad", models.SET_NULL, db_column="unidad_id", null=True, blank=True)
    creada_por = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="creada_por")
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = "tareas_mantenimiento"
        indexes = [models.Index(fields=["estado","prioridad"])]

class TareaAsignacion(models.Model):
    id = models.BigAutoField(primary_key=True)
    tarea = models.ForeignKey(TareaMantenimiento, models.CASCADE, db_column="tarea_id")
    asignado_a = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="asignado_a")
    asignado_en = models.DateTimeField(auto_now_add=True)
    class Meta: db_table = "tareas_asignaciones"

class TareaComentario(models.Model):
    id = models.BigAutoField(primary_key=True)
    tarea = models.ForeignKey(TareaMantenimiento, models.CASCADE, db_column="tarea_id")
    autor = models.ForeignKey("usuarios.Usuarios", models.RESTRICT, db_column="autor_id")
    comentario = models.TextField()
    creado_en = models.DateTimeField(auto_now_add=True)
    class Meta: db_table = "tareas_comentarios"

class TareaEvidencia(models.Model):
    id = models.BigAutoField(primary_key=True)
    tarea = models.ForeignKey(TareaMantenimiento, models.CASCADE, db_column="tarea_id")
    url = models.TextField()
    tipo = models.CharField(max_length=20)  # foto/pdf/doc
    class Meta: db_table = "tareas_evidencias"
