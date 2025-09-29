// src/pages/Finanzas/EstadoUnidadPage.jsx
import { useMemo, useState } from "react";
import { FinanzasAPI } from "../../api/finanzas.api";
import { unwrapList } from "../../api/api";
import { toast } from "react-toastify";

function toMoney(n) {
  const v = Number(n || 0);
  return v.toFixed(2);
}

export default function EstadoUnidadPage() {
  const [unidadId, setUnidadId] = useState("");
  const [rows, setRows] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(false);

  const conceptosMap = useMemo(
    () => Object.fromEntries((conceptos || []).map(c => [String(c.id), c.nombre || c.codigo || String(c.id)])),
    [conceptos]
  );

  const fetchConceptos = async () => {
    try {
      const data = await FinanzasAPI.conceptos.list({ page_size: 1000 });
      setConceptos(unwrapList(data));
    } catch (e) {
      // no bloquea la página si falla
      console.warn("No se pudo cargar conceptos:", e);
    }
  };

  const buscar = async () => {
    if (!unidadId) {
      toast.error("Ingresa el ID de la unidad");
      return;
    }
    setLoading(true);
    setRows([]);
    try {
      // 1) catálogo de conceptos (en paralelo)
      fetchConceptos();

      // 2) estado de unidad (cargos con su estado)
      const data = await FinanzasAPI.estadoCuentaUnidad(unidadId, { page_size: 1000 });
      const items = data?.results || data || [];

      // normalizamos y ordenamos por periodo, cargo_id
      const sorted = [...items].sort((a, b) => {
        const pa = String(a.periodo || "");
        const pb = String(b.periodo || "");
        if (pa < pb) return -1;
        if (pa > pb) return 1;
        return Number(a.cargo_id || 0) - Number(b.cargo_id || 0);
      });

      // calculamos débitos/créditos y saldo acumulado
      let saldoAcum = 0;
      const enriched = sorted.map(r => {
        const debito = Number(r.monto || 0) + Number(r.recargo || 0);
        const credito = Number(r.pagado || 0);
        saldoAcum += (debito - credito);
        return {
          ...r,
          debito,
          credito,
          saldo_acumulado: saldoAcum,
        };
      });

      setRows(enriched);
    } catch (e) {
      toast.error(e?.message || "No se pudo consultar (verifica token/API)");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // totales
  const totales = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.debito += Number(r.debito || 0);
        acc.credito += Number(r.credito || 0);
        acc.saldo = Number(r.saldo_acumulado || acc.saldo);
        return acc;
      },
      { debito: 0, credito: 0, saldo: 0 }
    );
  }, [rows]);

  const exportCSV = () => {
    if (!rows.length) return;
    const headers = [
      "Periodo",
      "Concepto",
      "Débito",
      "Crédito",
      "Saldo acumulado",
      "Estado",
    ];
    const lines = rows.map(r => {
      const conceptoNombre = conceptosMap[String(r.concepto_id)] || String(r.concepto_id || "-");
      return [
        r.periodo || "",
        conceptoNombre,
        toMoney(r.debito),
        toMoney(r.credito),
        toMoney(r.saldo_acumulado),
        r.estado_calculado || "",
      ].join(",");
    });
    const csv = [headers.join(","), ...lines, "", `Totales,,${toMoney(totales.debito)},${toMoney(totales.credito)},${toMoney(totales.saldo)}`].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estado_unidad_${unidadId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm">ID unidad</label>
          <input
            className="input w-40"
            placeholder="Ej: 1"
            value={unidadId}
            onChange={(e)=>setUnidadId(e.target.value)}
          />
        </div>
        <button className="btn" onClick={buscar} disabled={loading || !unidadId}>
          {loading ? "Cargando..." : "Buscar"}
        </button>

        <div className="ml-auto">
          <button className="btn" onClick={exportCSV} disabled={!rows.length}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="rounded border overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Período</th>
              <th className="px-3 py-2 text-left">Concepto</th>
              <th className="px-3 py-2 text-left">Débito</th>
              <th className="px-3 py-2 text-left">Crédito</th>
              <th className="px-3 py-2 text-left">Saldo</th>
              <th className="px-3 py-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6">Sin movimientos.</td></tr>
            ) : rows.map((r) => {
              const conceptoNombre = conceptosMap[String(r.concepto_id)] || String(r.concepto_id || "-");
              return (
                <tr key={`${r.cargo_id}-${r.periodo}`}>
                  <td className="px-3 py-2">{r.periodo || "-"}</td>
                  <td className="px-3 py-2">{conceptoNombre}</td>
                  <td className="px-3 py-2">{toMoney(r.debito)}</td>
                  <td className="px-3 py-2">{toMoney(r.credito)}</td>
                  <td className="px-3 py-2">{toMoney(r.saldo_acumulado)}</td>
                  <td className="px-3 py-2">{r.estado_calculado || "-"}</td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t">
                <td className="px-3 py-2 font-semibold" colSpan={2}>Totales</td>
                <td className="px-3 py-2 font-semibold">{toMoney(totales.debito)}</td>
                <td className="px-3 py-2 font-semibold">{toMoney(totales.credito)}</td>
                <td className="px-3 py-2 font-semibold">{toMoney(totales.saldo)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
