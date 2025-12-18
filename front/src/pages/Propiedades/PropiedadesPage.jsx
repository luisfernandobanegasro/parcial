// src/pages/Propiedades/PropiedadesPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { PropiedadesAPI } from "../../api/propiedades.api";
import { CondominiosAPI } from "../../api/condominios.api";
import { toast } from "react-toastify";
import PropiedadForm from "./PropiedadForm";

export default function PropiedadesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [modal, setModal] = useState({ open: false, record: null });
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PropiedadesAPI.list({ page, q: q || undefined });
      setRows(data?.results || data || []);
      setCount(data?.count ?? (Array.isArray(data) ? data.length : 0));
    } catch (e) {
      toast.error(e?.message || "Error al cargar unidades");
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Mapa id -> nombre de condominio (fallback)
  const [condominiosMap, setCondominiosMap] = useState({});
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await CondominiosAPI.list({ page_size: 1000 });
        const rows = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        if (!cancel) {
          const map = Object.fromEntries(rows.map(r => [String(r.id), r.nombre || `Condominio ${r.id}`]));
          setCondominiosMap(map);
        }
      } catch {/* noop */}
    })();
    return () => { cancel = true; };
  }, []);

  const onSearch = () => { setPage(1); fetchData(); };

  const openNew  = () => setModal({ open: true, record: null });
  const openEdit = (r) => setModal({ open: true, record: r });
  const closeModal = () => setModal({ open: false, record: null });

  const onSave = async (payload, ownerId) => {
    setWorking(true);
    try {
      const body = {
        condominio: Number(payload.condominio),
        codigo: (payload.codigo || "").trim(),
        piso: payload.piso ?? null,
        area_m2: payload.area_m2 ?? null,
        estado: payload.estado || "activo",
      };

      if (modal.record?.id) {
        const unidadId = modal.record.id;
        await PropiedadesAPI.update(unidadId, body);

        if (ownerId === null) {
          // (opcional) podrías crear un endpoint para “remover dueño”.
        } else if (ownerId) {
          const hoy = new Date().toISOString().slice(0, 10);
          await PropiedadesAPI.setOwner(unidadId, {
            usuario: ownerId,
            porcentaje: 100,
            es_principal: true,
            fecha_inicio: hoy,
          });
        }
      } else {
        const nueva = await PropiedadesAPI.create(body);
        if (ownerId) {
          const hoy = new Date().toISOString().slice(0, 10);
          await PropiedadesAPI.setOwner(nueva.id, {
            usuario: ownerId,
            porcentaje: 100,
            es_principal: true,
            fecha_inicio: hoy,
          });
        }
      }

      toast.success("Propiedad guardada");
      closeModal();
      fetchData();
    } catch (e) {
      const data = e?.payload || e?.response?.data;
      console.error("Guardar unidad - error:", data || e);
      const msg = data?.non_field_errors?.[0] || data?.detail || e?.message || "No se pudo guardar";
      toast.error(msg);
    } finally {
      setWorking(false);
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`¿Eliminar la unidad "${row.codigo}"?`)) return;
    try {
      await PropiedadesAPI.remove(row.id);
      toast.success("Eliminado");
      fetchData();
    } catch (e) {
      toast.error(e?.message || "No se pudo eliminar");
    }
  };

  const totalPages = useMemo(
    () => (count && count > 0 ? Math.ceil(count / 10) : 1),
    [count]
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Propiedades</h2>
        <button onClick={openNew} className="btn btn-primary">Nueva</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Buscar por condominio/código/propietario…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="input w-64"
        />
        <button onClick={onSearch} className="btn">Buscar</button>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Condominio</th>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Piso</th>
              <th className="px-4 py-3 text-left">Área m²</th>
              <th className="px-4 py-3 text-left">Propietario</th>
              <th className="px-4 py-3 text-left">Residente</th>
              <th className="px-4 py-3 text-left">Activo</th>
              <th className="px-4 py-3 text-left w-48">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-6 text-gray-500">Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-6 text-gray-500">Sin resultados.</td></tr>
            ) : (
              rows.map((r) => {
                const activo = String(r.estado || "").toLowerCase() === "activo";
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.id}</td>
                    <td className="px-4 py-3">
                      {r.condominio_nombre || condominiosMap[String(r.condominio) || String(r.condominio_id)] || "-"}
                    </td>
                    <td className="px-4 py-3">{r.codigo || "-"}</td>
                    <td className="px-4 py-3">{r.piso ?? "-"}</td>
                    <td className="px-4 py-3">{r.area_m2 ?? "-"}</td>
                    <td className="px-4 py-3">{r.propietario_nombre || "-"}</td>
                    <td className="px-4 py-3">{r.residente_nombre || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${activo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                        {activo ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)} className="btn">Editar</button>
                        <button onClick={() => onDelete(r)} className="btn btn-danger">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          ← Anterior
        </button>
        <span className="text-sm">Página {page} de {totalPages}</span>
        <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
          Siguiente →
        </button>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-4xl rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {modal.record ? "Editar propiedad" : "Nueva propiedad"}
              </h3>
              <button onClick={closeModal} className="rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
            </div>
            <PropiedadForm
              initial={modal.record}
              working={working}
              onCancel={closeModal}
              onSave={onSave}
            />
          </div>
        </div>
      )}
    </section>
  );
}
