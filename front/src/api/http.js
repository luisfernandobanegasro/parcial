// src/pages/Finanzas/ConceptosPage.jsx
import { useEffect, useState } from "react";
import { FinanzasAPI } from "../../api/finanzas.api";
import { toast } from "react-toastify";

export default function ConceptosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ codigo: "", nombre: "", tipo: "cuota" });
  const [editingId, setEditingId] = useState(null);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await FinanzasAPI.conceptos.list({ page_size: 500 });
      setRows(data?.results || data || []);
    } catch (e) {
      toast.error(e?.message || "No se pudieron cargar conceptos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const onSave = async () => {
    // Ensure we have a name; if only codigo provided, use it as nombre
    const nombreVal = form.nombre?.trim() || form.codigo?.trim();
    if (!form.codigo && !nombreVal) return toast.error("Código y/o nombre son requeridos");

    const payload = { nombre: nombreVal, codigo: form.codigo?.trim() || "", tipo: form.tipo || "cuota" };
    try {
      if (editingId) {
        await FinanzasAPI.conceptos.update(editingId, payload);
        toast.success("Concepto actualizado");
      } else {
        await FinanzasAPI.conceptos.create(payload);
        toast.success("Concepto creado");
      }
      setModal(false);
      setEditingId(null);
      setForm({ codigo: "", nombre: "", tipo: "cuota" });
      fetchData();
    } catch (e) {
      toast.error(e?.message || "No se pudo guardar");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar concepto?")) return;
    try {
      await FinanzasAPI.conceptos.remove(id);
      toast.success("Eliminado");
      fetchData();
    } catch (e) {
      toast.error(e?.message || "No se pudo eliminar");
    }
  };

  const onEdit = (r) => {
    // Prefill form using actual backend fields (do not copy nombre into codigo)
    setForm({ codigo: r.codigo || "", nombre: r.nombre || "", tipo: r.tipo || "cuota" });
    setEditingId(r.id);
    setModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="font-semibold">Conceptos</h3>
        <button className="btn btn-primary" onClick={() => setModal(true)}>Nuevo</button>
      </div>

      <div className="rounded border overflow-x-auto">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left w-32">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-6">Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6">Sin resultados.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td className="px-3 py-2">{r.id}</td>
                <td className="px-3 py-2">{r.codigo && r.codigo.length ? r.codigo : '—'}</td>
                <td className="px-3 py-2">{r.nombre}</td>
                <td className="px-3 py-2">{r.tipo}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button className="btn" onClick={() => onEdit(r)}>Editar</button>
                    <button className="btn btn-danger" onClick={() => onDelete(r.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)} title="Nuevo concepto">
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Código</label>
              <input className="input" value={form.codigo} onChange={(e) => setForm(f => ({...f, codigo: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Nombre</label>
              <input className="input" value={form.nombre} onChange={(e) => setForm(f => ({...f, nombre: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Tipo</label>
              <select className="select" value={form.tipo} onChange={(e) => setForm(f => ({...f, tipo: e.target.value}))}>
                <option value="cuota">Cuota</option>
                <option value="multa">Multa</option>
                <option value="extraordinario">Extraordinario</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="btn" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={onSave}>Guardar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white dark:bg-gray-900 border p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">{title}</h4>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
