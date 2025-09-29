// src/pages/Reservas/AreasAdmin.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ReservasAPI } from "../../api/reservas.api";

const EMPTY = {
  id: null,
  nombre: "",
  capacidad: 0,
  requiere_pago: false,
  costo_base: "0.00",
  politica: "{}",        // string JSON en el form
  condominio_id: "",    // texto para input; se envía como número o null
};

export default function AreasAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const editing = form.id !== null;

  async function fetch() {
    setLoading(true);
    try {
      const data = await ReservasAPI.areas.list({ page_size: 200 });
      setRows(data?.results || data || []);
    } catch {
      toast.error("No se pudieron cargar las áreas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetch(); }, []);

  function parsePolitica(str) {
    try {
      const obj = str?.trim() ? JSON.parse(str) : {};
      if (typeof obj !== "object" || Array.isArray(obj)) throw new Error();
      return obj;
    } catch {
      throw new Error("La política debe ser un JSON de objeto válido. Ej: {\"reglas\":\"...\"}");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre: (form.nombre || "").trim(),
        capacidad: Number(form.capacidad || 0),
        requiere_pago: !!form.requiere_pago,
        costo_base: (form.costo_base || "0.00").toString(),
        politica: parsePolitica(form.politica || "{}"),
        condominio_id: form.condominio_id ? Number(form.condominio_id) : null,
      };

      if (!payload.nombre) throw new Error("El nombre es requerido.");
      if (payload.capacidad < 0) throw new Error("Capacidad no puede ser negativa.");

      if (editing) {
        await ReservasAPI.areas.update(form.id, payload);
        toast.success("Área actualizada");
      } else {
        await ReservasAPI.areas.create(payload);
        toast.success("Área creada");
      }
      setForm(EMPTY);
      fetch();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Error al guardar el área.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm(EMPTY);
  }

  function fillFromRow(r) {
    setForm({
      id: r.id,
      nombre: r.nombre ?? "",
      capacidad: r.capacidad ?? 0,
      requiere_pago: !!r.requiere_pago,
      costo_base: (r.costo_base ?? "0.00").toString(),
      politica: JSON.stringify(r.politica || {}, null, 2),
      condominio_id: r.condominio_id ?? "",
    });
  }

  function prettyPolitica() {
    try {
      const pretty = JSON.stringify(parsePolitica(form.politica), null, 2);
      setForm((f) => ({ ...f, politica: pretty }));
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-4">
      {/* FORMULARIO */}
      <form onSubmit={onSubmit} className="border rounded p-4 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{editing ? "Editar área" : "Nueva área"}</h4>
          {editing && (
            <button type="button" className="btn" onClick={resetForm}>
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Nombre</label>
            <input
              className="input"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Sala de usos múltiples"
            />
          </div>

          <div>
            <label className="text-sm">Capacidad</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.capacidad}
              onChange={(e) => setForm((f) => ({ ...f, capacidad: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm">Condominio ID (opcional)</label>
            <input
              className="input"
              value={form.condominio_id}
              onChange={(e) => setForm((f) => ({ ...f, condominio_id: e.target.value }))}
              placeholder="Ej: 1"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="chk-pago"
              type="checkbox"
              checked={form.requiere_pago}
              onChange={(e) => setForm((f) => ({ ...f, requiere_pago: e.target.checked }))}
            />
            <label htmlFor="chk-pago">Requiere pago</label>
          </div>

          <div>
            <label className="text-sm">Costo base</label>
            <input
              className="input"
              value={form.costo_base}
              onChange={(e) => setForm((f) => ({ ...f, costo_base: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Política (JSON)</label>
              <button type="button" className="btn" onClick={prettyPolitica}>
                Formatear JSON
              </button>
            </div>
            <textarea
              rows={4}
              className="input"
              value={form.politica}
              onChange={(e) => setForm((f) => ({ ...f, politica: e.target.value }))}
              placeholder='{"max_horas":2,"anticipacion_horas":24}'
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? (editing ? "Actualizando…" : "Creando…") : editing ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>

      {/* TABLA */}
      <div className="border rounded bg-white overflow-x-auto">
        <div className="p-2 font-semibold border-b">Áreas</div>

        {loading ? (
          <div className="p-3">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="p-3">Sin áreas creadas.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Capacidad</th>
                <th className="text-left p-2">Pago</th>
                <th className="text-left p-2">Costo</th>
                <th className="text-left p-2">Condominio</th>
                <th className="text-left p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.nombre}</td>
                  <td className="p-2">{r.capacidad}</td>
                  <td className="p-2">{r.requiere_pago ? "Sí" : "No"}</td>
                  <td className="p-2">{r.costo_base}</td>
                  <td className="p-2">{r.condominio_id ?? "—"}</td>
                  <td className="p-2 flex flex-wrap gap-2">
                    <button className="btn" onClick={() => fillFromRow(r)}>
                      Editar
                    </button>
                    <button
                      className="btn"
                      onClick={async () => {
                        if (!window.confirm("¿Eliminar área?")) return;
                        try {
                          await ReservasAPI.areas.remove(r.id);
                          toast.success("Área eliminada");
                          fetch();
                          if (editing && form.id === r.id) resetForm();
                        } catch {
                          toast.error("No se pudo eliminar");
                        }
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
