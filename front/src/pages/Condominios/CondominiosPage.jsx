// src/pages/Condominios/CondominiosPage.jsx
import { useEffect, useMemo, useState } from "react";
import { CondominiosAPI } from "../../api/condominios.api";
import { toast } from "react-toastify";
import CondominioForm from "./CondominioForm";

export default function CondominiosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [modal, setModal] = useState({ open: false, record: null });
  const [working, setWorking] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // tu cliente acepta (url, params). En DRF soporta ?page=&search=
      const data = await CondominiosAPI.list({
        page,
        search: q || undefined,
      });

      // Si el backend devuelve paginado DRF:
      setRows(data?.results || data || []);
      setCount(data?.count ?? (Array.isArray(data) ? data.length : 0));
    } catch (e) {
      toast.error(e?.message || "Error al cargar condominios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onSearch = () => {
    setPage(1);
    fetchData();
  };

  const openNew = () => setModal({ open: true, record: null });
  const openEdit = (r) => setModal({ open: true, record: r });
  const closeModal = () => setModal({ open: false, record: null });

  const onSave = async (payload) => {
    setWorking(true);
    try {
      if (modal.record?.id) {
        await CondominiosAPI.update(modal.record.id, payload);
        toast.success("Condominio actualizado");
      } else {
        await CondominiosAPI.create(payload);
        toast.success("Condominio creado");
      }
      closeModal();
      fetchData();
    } catch (e) {
      toast.error(e?.message || "No se pudo guardar");
    } finally {
      setWorking(false);
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`¿Eliminar condominio "${row.nombre}"?`)) return;
    try {
      await CondominiosAPI.remove(row.id);
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
        <h2 className="text-2xl font-semibold">Condominios</h2>
        <button
          onClick={openNew}
          className="rounded-lg px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          Nuevo
        </button>
      </div>

      {/* Filtros simples */}
      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Buscar por nombre/dirección…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="border rounded-lg px-3 py-2 w-64"
        />
        <button
          onClick={onSearch}
          className="rounded-lg px-4 py-2 border hover:bg-gray-50"
        >
          Buscar
        </button>
      </div>

      {/* Tabla responsive horizontal */}
      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-[840px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Dirección</th>
              <th className="px-4 py-3 text-left">RUC</th>
              <th className="px-4 py-3 text-left">Activo</th>
              <th className="px-4 py-3 text-left w-48">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-gray-500">
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-gray-500">
                  Sin resultados.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3">{r.nombre}</td>
                  <td className="px-4 py-3">{r.direccion}</td>
                  <td className="px-4 py-3">{r.ruc}</td>
                  <td className="px-4 py-3">
                    {r.activo ? (
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-green-100 text-green-700">
                        Sí
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-gray-200 text-gray-700">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded-lg px-3 py-1 border hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(r)}
                        className="rounded-lg px-3 py-1 border border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación simple */}
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg px-3 py-1 border hover:bg-gray-50 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ← Anterior
        </button>
        <span className="text-sm">
          Página {page} de {totalPages}
        </span>
        <button
          className="rounded-lg px-3 py-1 border hover:bg-gray-50 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Siguiente →
        </button>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-3xl rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {modal.record ? "Editar condominio" : "Nuevo condominio"}
              </h3>
              <button
                onClick={closeModal}
                className="rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <CondominioForm
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
