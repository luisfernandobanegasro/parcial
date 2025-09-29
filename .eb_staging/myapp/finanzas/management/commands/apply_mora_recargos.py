from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
import os

from myapp.finanzas.models import Cargo

class Command(BaseCommand):
    help = "Aplica recargos de mora a Cargos vencidos. Controlado por FINANZAS_TASA_MORA_DIARIA (por defecto 0)."

    def add_arguments(self, parser):
        parser.add_argument('--tasa', type=float, default=None, help="Tasa diaria de mora (por ejemplo 0.001 = 0.1%/día)")

    @transaction.atomic
    def handle(self, *args, **opts):
        tasa_env = os.getenv("FINANZAS_TASA_MORA_DIARIA", "0")
        tasa = Decimal(str(opts['tasa'])) if opts['tasa'] is not None else Decimal(tasa_env)
        hoy = timezone.localdate()

        qs = Cargo.objects.select_for_update().filter(vencimiento__lt=hoy, estado__in=["PENDIENTE","PARCIAL"])
        actualizados = 0
        for c in qs:
            dias = (hoy - c.vencimiento).days if c.vencimiento else 0
            if dias <= 0 or tasa <= 0:
                continue
            recargo_calc = (Decimal(c.monto) * tasa * dias).quantize(Decimal("0.01"))
            if recargo_calc <= 0:
                continue
            c.recargo = recargo_calc
            c.save(update_fields=['recargo'])
            actualizados += 1

        self.stdout.write(self.style.SUCCESS(f"Recargos aplicados a {actualizados} cargos (tasa diaria {tasa})."))
