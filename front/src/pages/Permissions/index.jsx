// src/pages/Permissions/index.jsx
import { useEffect, useMemo, useState } from "react";
import { RolesAPI } from "../../api/roles.api";
import { toast } from "react-toastify";

export default function PermissionsPage() {
  const [rows, setRows]   = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros / búsqueda
  const [q, setQ]         = useState("");
  const [app, setApp]     = useState("");
  const [model, setModel] = useState("");

  // form crear/editar
  const [form, setForm] = useState({ id:null, name:"", codename:"", app_label:"", model:"" });
  const isEditing = useMemo(()=> form.id != null, [form.id]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await RolesAPI.listPermissions({ q, app, model });
      setRows(data ?? []);
    } catch (e) {
      toast.error(e?.message || "No se pudieron cargar permisos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable react-hooks/exhaustive-deps */ }, []);
  const onSearch = () => load();

  const onResetForm = () => setForm({ id:null, name:"", codename:"", app_label:"", model:"" });

  const onEdit = (p) => {
    setForm({
      id: p.id,
      name: p.name || "",
      codename: p.codename || "",
      app_label: p.app_label || "",
      model: p.model || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (p) => {
    if (!window.confirm(`¿Eliminar permiso "${p.codename}"?`)) return;
    try {
      await RolesAPI.deletePermission(p.id);
      toast.success("Permiso eliminado");
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudo eliminar");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      codename: form.codename.trim(),
      app_label: form.app_label.trim(),
      model: form.model.trim(),
    };
    if (!payload.name || !payload.codename || !payload.app_label || !payload.model) {
      toast.error("Completa: nombre, codename, app_label y model");
      return;
    }
    try {
      if (isEditing) {
        await RolesAPI.updatePermission(form.id, payload);
        toast.success("Permiso actualizado");
      } else {
        await RolesAPI.createPermission(payload);
        toast.success("Permiso creado");
      }
      onResetForm();
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudo guardar");
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Permisos (CRUD)</h2>

      {/* BUSCADOR */}
      <div className="flex flex-wrap gap-2 items-end">
        <input className="border rounded px-3 py-2" value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar texto…" />
        <input className="border rounded px-3 py-2" value={app} onChange={e=>setApp(e.target.value)} placeholder="app_label (ej: auth, myapp)" />
        <input className="border rounded px-3 py-2" value={model} onChange={e=>setModel(e.target.value)} placeholder="model (ej: user, usuarios)" />
        <button onClick={onSearch} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
          Buscar
        </button>
        <button onClick={async ()=>{
          try {
            await RolesAPI.syncPermissions();
            toast.success("Catálogo sincronizado");
            load();
          } catch(e) {
            toast.error(e?.message || "No se pudo sincronizar");
          }
        }} className="px-3 py-2 rounded border">
          Recargar catálogo
        </button>
      </div>

      {/* FORM CREAR/EDITAR */}
      <form onSubmit={onSubmit} className="grid md:grid-cols-5 gap-2 items-end border rounded p-3">
        <input className="border rounded px-3 py-2" placeholder="Nombre" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))}/>
        <input className="border rounded px-3 py-2" placeholder="Codename (ej: add_usuario)" value={form.codename} onChange={e=>setForm(f=>({...f, codename:e.target.value}))}/>
        <input className="border rounded px-3 py-2" placeholder="app_label (ej: myapp)" value={form.app_label} onChange={e=>setForm(f=>({...f, app_label:e.target.value}))}/>
        <input className="border rounded px-3 py-2" placeholder="model (ej: usuarios)" value={form.model} onChange={e=>setForm(f=>({...f, model:e.target.value}))}/>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">
            {isEditing ? "Actualizar" : "Crear"}
          </button>
          {isEditing && (
            <button type="button" onClick={onResetForm} className="px-3 py-2 rounded border">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* TABLA */}
      <div className="rounded-xl border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Codename</th>
              <th className="px-3 py-2 text-left">App</th>
              <th className="px-3 py-2 text-left">Modelo</th>
              <th className="px-3 py-2 w-40 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-6 text-gray-500">Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-gray-500">Sin datos.</td></tr>
            ) : rows.map(p => (
              <tr key={p.id}>
                <td className="px-3 py-2">{p.id}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.codename}</td>
                <td className="px-3 py-2">{p.app_label}</td>
                <td className="px-3 py-2">{p.model}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={()=>onEdit(p)} className="px-3 py-1 rounded border hover:bg-gray-50">Editar</button>
                    <button onClick={()=>onDelete(p)} className="px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
