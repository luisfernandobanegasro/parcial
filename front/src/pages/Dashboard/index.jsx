// src/pages/Dashboard/index.jsx
import { useEffect, useState } from "react";
import KPIStat from "../../components/KPIStat";
import {
  getCondominiosCount,
  getUsuariosCount,
  getPagosCount,
} from "../../api/stats.api";
import { useStatsBusOptional } from "../../context/StatsContext";

export default function Dashboard() {
  // Hook opcional: evita crash si el provider no está listo (hot-reload, etc.)
  const { version, bump } = useStatsBusOptional();

  const [stats, setStats] = useState({
    condominios: null,
    usuarios: null,
    pagos: null,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para feedback del botón "Actualizar"
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const safe = async (fn) => {
      try {
        return await fn();
      } catch (e) {
        console.error("[Dashboard] fetch error:", e);
        return null;
      }
    };

    setLoading(true);

    (async () => {
      try {
        const [condominios, usuarios, pagos] = await Promise.all([
          safe(getCondominiosCount),
          safe(getUsuariosCount),
          safe(getPagosCount),
        ]);

        if (!cancelled) {
          setStats({ condominios, usuarios, pagos });
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError("No se pudieron cargar los datos.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setManualLoading(false); // apagar estado del botón tras el refetch
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [version]);

  // Forzar recarga desde el botón
  const onRefresh = () => {
    setManualLoading(true);
    bump(); // incrementa versión -> dispara el useEffect
  };

  // Trazas (útil para debug)
  // eslint-disable-next-line no-console
  console.log("[Dashboard] render v=", version, { stats, loading, error });

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>

        <button
          onClick={onRefresh}
          disabled={loading || manualLoading}
          className={`px-3 py-1 rounded border text-sm flex items-center gap-2
            ${loading || manualLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          title="Forzar recarga de KPIs"
          aria-busy={loading || manualLoading}
        >
          {(loading || manualLoading) && (
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                opacity="0.25"
              />
              <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
          )}
          {loading || manualLoading ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-gray-500">
          Cargando KPIs…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div key="kpi-condos"><KPIStat label="Condominios" value={stats.condominios} /></div>
          <div key="kpi-users"><KPIStat label="Usuarios" value={stats.usuarios} /></div>
          <div key="kpi-pagos"><KPIStat label="Pagos" value={stats.pagos} /></div>
        </div>

      )}
    </section>
  );
}
