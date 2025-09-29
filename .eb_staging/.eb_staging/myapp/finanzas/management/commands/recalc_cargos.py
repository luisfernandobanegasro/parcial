from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = "Recalcula el estado de cargos (PENDIENTE|PARCIAL|PAGADO) usando pagos_detalle."

    def add_arguments(self, parser):
        parser.add_argument("--unidad_id", type=int, help="Filtrar por unidad_id")
        parser.add_argument("--desde", type=str, help="Periodo desde (YYYY-MM-DD)")
        parser.add_argument("--hasta", type=str, help="Periodo hasta (YYYY-MM-DD)")

    def handle(self, *args, **opts):
        unidad_id = opts.get("unidad_id")
        desde = opts.get("desde")
        hasta = opts.get("hasta")

        where = []
        params = []

        if unidad_id:
            where.append("unidad_id = %s")
            params.append(unidad_id)

        if desde:
            where.append("periodo >= %s")
            params.append(desde)

        if hasta:
            where.append("periodo <= %s")
            params.append(hasta)

        sql_list = "SELECT id FROM public.cargos"
        if where:
            sql_list += " WHERE " + " AND ".join(where)

        total = 0
        with connection.cursor() as cur:
            cur.execute(sql_list, params)
            ids = [r[0] for r in cur.fetchall()]
            for cid in ids:
                cur.execute("SELECT public.recalc_estado_cargo(%s)", [cid])
                total += 1

        self.stdout.write(self.style.SUCCESS(f"Listo: recalculados {total} cargos"))
