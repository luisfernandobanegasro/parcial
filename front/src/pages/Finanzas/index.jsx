// src/pages/Finanzas/index.jsx
import { useMemo, useState } from "react";
import ConceptosPage from "./ConceptosPage";
import CargosPage from "./CargosPage";
import EstadoUnidadPage from "./EstadoUnidadPage";
import PagosPage from "./PagosPage";

const tabs = [
  { key: "conceptos", label: "Conceptos" },
  { key: "cargos", label: "Cargos" },
  { key: "pagos", label: "Pagos" },
  { key: "estado", label: "Estado de Unidad" },
];

export default function FinanzasHome() {
  const [tab, setTab] = useState("conceptos");
  const Current = useMemo(() => {
    if (tab === "cargos") return CargosPage;
    if (tab === "pagos") return PagosPage;
    if (tab === "estado") return EstadoUnidadPage;
    return ConceptosPage;
  }, [tab]);

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Finanzas</h2>

      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`btn ${tab === t.key ? "btn-primary" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border p-4">
        <Current />
      </div>
    </section>
  );
}
