import { useEffect, useState } from "react";

export default function CondominioForm({ initial, onCancel, onSave, working }) {
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    ruc: "",
    activo: true,
  });

  useEffect(() => {
    if (initial) {
      setForm({
        nombre: initial?.nombre ?? "",
        direccion: initial?.direccion ?? "",
        ruc: initial?.ruc ?? "",
        activo: typeof initial?.activo === "boolean" ? initial.activo : true,
      });
    }
  }, [initial]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            required
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Dirección</label>
          <input
            name="direccion"
            value={form.direccion}
            onChange={onChange}
            className="input"
          />
        </div>

        {/* RUC = Registro Único de Contribuyente (ID fiscal). Puedes renombrar la etiqueta si no aplica. */}
        <div>
          <label className="block text-sm mb-1">RUC</label>
          <input
            name="ruc"
            value={form.ruc}
            onChange={onChange}
            className="input"
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="activo"
            type="checkbox"
            name="activo"
            checked={form.activo}
            onChange={onChange}
            className="check"
          />
          <label htmlFor="activo" className="text-sm">Activo</label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn">
          Cancelar
        </button>
        <button
          type="button"
          disabled={working}
          onClick={() => onSave(form)}
          className="btn btn-primary disabled:opacity-60"
        >
          {working ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
