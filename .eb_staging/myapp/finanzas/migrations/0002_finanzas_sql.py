from django.db import migrations

SQL = r"""
CREATE OR REPLACE FUNCTION public.trigger_set_timestamps()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.creado_en IS NULL THEN NEW.creado_en := now(); END IF;
  END IF;
  NEW.actualizado_en := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE VIEW public.vw_estado_cuenta_unidad AS
SELECT
  c.id            AS cargo_id,
  c.unidad_id,
  c.concepto_id,
  c.periodo,
  c.monto,
  COALESCE(c.recargo,0) AS recargo,
  c.vencimiento,
  c.estado        AS estado_registrado,
  COALESCE(SUM(pd.monto_aplicado),0) AS pagado,
  (c.monto + COALESCE(c.recargo,0) - COALESCE(SUM(pd.monto_aplicado),0))::numeric(12,2) AS saldo,
  CASE
    WHEN (c.monto + COALESCE(c.recargo,0) - COALESCE(SUM(pd.monto_aplicado),0)) <= 0 THEN 'PAGADO'
    WHEN c.vencimiento IS NOT NULL AND c.vencimiento < CURRENT_DATE THEN 'VENCIDO'
    ELSE 'PENDIENTE'
  END AS estado_calculado
FROM public.cargos c
LEFT JOIN public.pagos_detalle pd ON pd.cargo_id = c.id
GROUP BY c.id;

CREATE OR REPLACE FUNCTION public.recalc_estado_cargo(_cargo_id bigint)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_monto   numeric(12,2);
  v_recargo numeric(12,2);
  v_pagado  numeric(12,2);
BEGIN
  SELECT monto, COALESCE(recargo,0) INTO v_monto, v_recargo FROM public.cargos WHERE id=_cargo_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COALESCE(SUM(monto_aplicado),0) INTO v_pagado FROM public.pagos_detalle WHERE cargo_id=_cargo_id;

  IF v_pagado <= 0 THEN
    UPDATE public.cargos SET estado='PENDIENTE' WHERE id=_cargo_id;
  ELSIF v_pagado < (v_monto + v_recargo) THEN
    UPDATE public.cargos SET estado='PARCIAL' WHERE id=_cargo_id;
  ELSE
    UPDATE public.cargos SET estado='PAGADO' WHERE id=_cargo_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalc_cargo_from_pd()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    PERFORM public.recalc_estado_cargo(NEW.cargo_id);
  END IF;
  IF TG_OP IN ('UPDATE','DELETE') THEN
    PERFORM public.recalc_estado_cargo(OLD.cargo_id);
  END IF;
  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_pd_recalc_cargo') THEN
    CREATE TRIGGER trg_pd_recalc_cargo
    AFTER INSERT OR UPDATE OR DELETE ON public.pagos_detalle
    FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_cargo_from_pd();
  END IF;
END$$;
"""

SQL_DOWN = r"""
DROP TRIGGER IF EXISTS trg_pd_recalc_cargo ON public.pagos_detalle;
DROP FUNCTION IF EXISTS public.trg_recalc_cargo_from_pd() CASCADE;
DROP FUNCTION IF EXISTS public.recalc_estado_cargo(bigint) CASCADE;
DROP VIEW IF EXISTS public.vw_estado_cuenta_unidad;
"""

class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(SQL, SQL_DOWN),
    ]