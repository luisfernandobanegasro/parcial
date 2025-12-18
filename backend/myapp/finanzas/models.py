from django.db import models

class Concepto(models.Model):
    id = models.SmallAutoField(primary_key=True)
    nombre = models.CharField(max_length=30, unique=True)  # CUOTA/EXPENSA/SERVICIO/MULTA
    codigo = models.CharField(max_length=30, blank=True, default="")
    tipo = models.CharField(max_length=20, default="cuota",
                            choices=[("cuota", "cuota"), ("multa", "multa"), ("extraordinario", "extraordinario")])
    class Meta: db_table = "conceptos"
    def __str__(self): return self.nombre

class Cargo(models.Model):
    id = models.BigAutoField(primary_key=True)
    unidad   = models.ForeignKey("propiedades.Unidad", models.CASCADE, db_column="unidad_id")
    concepto = models.ForeignKey(Concepto, models.PROTECT, db_column="concepto_id")
    periodo  = models.DateField()
    monto    = models.DecimalField(max_digits=12, decimal_places=2)
    vencimiento = models.DateField(blank=True, null=True)
    recargo  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estado   = models.CharField(max_length=12, default="PENDIENTE",
                 choices=[("PENDIENTE","PENDIENTE"),("PAGADO","PAGADO"),("ANULADO","ANULADO")])
    class Meta:
        db_table = "cargos"
        constraints = [models.UniqueConstraint(fields=["unidad","concepto","periodo"], name="uq_cargo")]
        indexes = [models.Index(fields=["unidad","periodo"]), models.Index(fields=["estado"])]

class Documento(models.Model):
    id = models.BigAutoField(primary_key=True)
    numero = models.CharField(max_length=40)
    fecha  = models.DateField(auto_now_add=True)
    total  = models.DecimalField(max_digits=12, decimal_places=2)
    tipo   = models.CharField(max_length=12, choices=[("RECIBO","RECIBO"),("FACTURA","FACTURA")])
    moneda = models.CharField(max_length=8, default="BOB")
    condominio = models.ForeignKey("propiedades.Condominio", models.SET_NULL, db_column="condominio_id", null=True, blank=True)
    class Meta:
        db_table = "documentos"
        constraints = [models.UniqueConstraint(fields=["condominio","numero"], name="uq_documento_numero")]

class Pago(models.Model):
    id = models.BigAutoField(primary_key=True)
    documento = models.ForeignKey(Documento, models.SET_NULL, db_column="documento_id", null=True, blank=True)
    fecha  = models.DateTimeField(auto_now_add=True)
    monto  = models.DecimalField(max_digits=12, decimal_places=2)
    medio  = models.CharField(max_length=15, choices=[("EFECTIVO","EFECTIVO"),("TRANSFERENCIA","TRANSFERENCIA"),("QR","QR"),("TARJETA","TARJETA"),("BILLETERA","BILLETERA")])
    estado = models.CharField(max_length=12, default="APROBADO", choices=[("APROBADO","APROBADO"),("RECHAZADO","RECHAZADO"),("PENDIENTE","PENDIENTE")])
    pasarela = models.CharField(max_length=40, blank=True, null=True)
    transaccion_id = models.CharField(max_length=80, blank=True, null=True)
    ref_externa = models.CharField(max_length=120, blank=True, null=True)
    class Meta: db_table = "pagos"

class PagoDetalle(models.Model):
    id = models.BigAutoField(primary_key=True)
    pago  = models.ForeignKey(Pago, models.CASCADE, db_column="pago_id")
    cargo = models.ForeignKey(Cargo, models.RESTRICT, db_column="cargo_id")
    monto_aplicado = models.DecimalField(max_digits=12, decimal_places=2)
    class Meta: db_table = "pagos_detalle"

class DocumentoArchivo(models.Model):
    id = models.BigAutoField(primary_key=True)
    documento = models.ForeignKey(Documento, models.CASCADE, db_column="documento_id")
    url  = models.TextField()
    tipo = models.CharField(max_length=15, choices=[("PDF","PDF"),("PNG","PNG"),("JPG","JPG"),("XML","XML")])
    class Meta: db_table = "documentos_archivos"

class PagoIntento(models.Model):
    ESTADOS = (("CREADO","CREADO"),("EN_PROCESO","EN_PROCESO"),
               ("APROBADO","APROBADO"),("RECHAZADO","RECHAZADO"),("EXPIRO","EXPIRO"))
    unidad = models.ForeignKey("propiedades.Unidad", models.CASCADE, db_column="unidad_id")
    total = models.DecimalField(max_digits=12, decimal_places=2)
    medio = models.CharField(max_length=15, choices=[("TARJETA","TARJETA"),("QR","QR"),("BILLETERA","BILLETERA"),("TRANSFERENCIA","TRANSFERENCIA")])
    pasarela = models.CharField(max_length=40, blank=True, null=True)
    estado = models.CharField(max_length=16, choices=ESTADOS, default="CREADO")
    transaccion_id = models.CharField(max_length=120, blank=True, null=True)
    raw_request  = models.JSONField(blank=True, null=True)
    raw_response = models.JSONField(blank=True, null=True)
    pago = models.ForeignKey("finanzas.Pago", models.SET_NULL, blank=True, null=True, db_column="pago_id")
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    # --- en PagoIntento ---
    bnb_qr_id = models.CharField(max_length=128, blank=True, null=True)
    bnb_qr_image_b64 = models.TextField(blank=True, null=True)
    bnb_status_code = models.IntegerField(blank=True, null=True)  # 1=No usado, 2=Usado, 3=Expirado, 4=Error
    bnb_payload = models.JSONField(blank=True, null=True)



    class Meta:
        db_table = "pagos_intentos"

class Reembolso(models.Model):
    ESTADOS = (("SOLICITADO","SOLICITADO"),("APROBADO","APROBADO"),
               ("RECHAZADO","RECHAZADO"),("EJECUTADO","EJECUTADO"))
    pago = models.ForeignKey("finanzas.Pago", models.CASCADE, db_column="pago_id")
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    motivo = models.CharField(max_length=120, blank=True, null=True)
    estado = models.CharField(max_length=16, choices=ESTADOS, default="SOLICITADO")
    pasarela_ref = models.CharField(max_length=120, blank=True, null=True)
    raw_response = models.JSONField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reembolsos"

class EstadoCuentaUnidad(models.Model):
    cargo_id = models.BigIntegerField(primary_key=True)  # id del cargo
    unidad_id = models.IntegerField()
    concepto_id = models.SmallIntegerField()
    periodo = models.DateField()
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    recargo = models.DecimalField(max_digits=12, decimal_places=2)
    vencimiento = models.DateField(null=True, blank=True)
    estado_registrado = models.CharField(max_length=12)
    pagado = models.DecimalField(max_digits=12, decimal_places=2)
    saldo = models.DecimalField(max_digits=12, decimal_places=2)
    estado_calculado = models.CharField(max_length=12)

    class Meta:
        managed = False               # <- importante: es una VIEW
        db_table = "vw_estado_cuenta_unidad"