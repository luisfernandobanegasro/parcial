import { useCallback, useEffect, useState } from "react";
import { ResidentesAPI } from "../../api/residentes.api";
import { CondominiosAPI } from "../../api/condominios.api";
import { UsuariosAPI } from "../../api/usuarios.api";
import { PropiedadesAPI } from "../../api/propiedades.api"; // para listar unidades si ya lo tienes
import { toast } from "react-toastify";

function ResidenteForm({ onCancel, onSave, working }) {
  const [condos, setCondos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [owners, setOwners] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    condominio: "",
    unidad: "",
    usuario: "",       // UUID del usuario residente
    fecha_inicio: new Date().toISOString().slice(0,10),
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await CondominiosAPI.list({ page_size: 1000 });
        setCondos(Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []));
      } catch (e) { /* noop */ }
    })();
  }, []);

  useEffect(() => {
    if (!form.condominio) { setUnidades([]); setForm(f=>({...f, unidad:""})); return; }
    (async () => {
      // si ya tienes endpoint para unidades con filtro, úsalo
      const data = await PropiedadesAPI.list({ condominio: form.condominio, page_size: 1000 });
      const rows = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setUnidades(rows);
    })();
  }, [form.condominio]);

  useEffect(() => {
    if (!q || q.trim().length < 2) { setOwners([]); return; }
    const t = setTimeout(async () => {
      try {
        const data = await UsuariosAPI.list({ q: q.trim(), ordering: "nombre_completo", page_size: 20 });
        const rows = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setOwners(rows);
      } catch { setOwners([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = () => {
    if (!form.condominio) return toast.error("Selecciona condominio");
    if (!form.unidad) return toast.error("Selecciona unidad");
    if (!form.usuario) return toast.error("Selecciona residente");
    onSave({
      usuario: String(form.usuario),                     // UUID
      unidad: Number(form.unidad),                      // ID numérico
      fecha_inicio: form.fecha_inicio || new Date().toISOString().slice(0,10),
      // porcentaje/es_principal opcional
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm mb-1">Condominio</label>
          <select name="condominio" value={form.condominio} onChange={onChange} className="select">
            <option value="">— Selecciona —</option>
            {condos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Unidad</label>
          <select name="unidad" value={form.unidad} onChange={onChange} className="select">
            <option value="">— Selecciona —</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo}</option>)}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm mb-1">Residente</label>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Buscar usuario…" value={q} onChange={(e)=>setQ(e.target.value)} />
            <select name="usuario" value={form.usuario} onChange={onChange} className="select w-64">
              <option value="">— Selecciona —</option>
              {owners.map(o => (
                <option key={o.id} value={o.id}>
                  {o.nombre_completo || o.usuario || o.correo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn" onClick={onCancel} type="button">Cancelar</button>
        <button className="btn btn-primary" onClick={submit} disabled={working}>
          {working ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

export default function ResidentesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ResidentesAPI.list({ q: q || undefined, activo: true, page_size: 100 });
      setRows(data?.results || data || []);
    } catch (e) {
      toast.error(e?.message || "Error al cargar residentes");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSave = async (payload) => {
    setWorking(true);
    try {
      await ResidentesAPI.create(payload);
      toast.success("Residente agregado");
      setModal(false);
      fetchData();
    } catch (e) {
      const data = e?.payload || e?.response?.data;
      toast.error(data?.detail || e?.message || "No se pudo guardar");
    } finally {
      setWorking(false);
    }
  };

  const darBaja = async (rel) => {
    if (!window.confirm(`Dar de baja a "${rel.usuario_nombre}" de la unidad ${rel.unidad_codigo}?`)) return;
    try {
      await ResidentesAPI.update(rel.id, { fecha_fin: new Date().toISOString().slice(0,10) });
      toast.success("Residente dado de baja");
      fetchData();
    } catch (e) {
      toast.error(e?.message || "No se pudo actualizar");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Residentes</h2>
        <button onClick={() => setModal(true)} className="btn btn-primary">Nuevo</button>
      </div>

      <div className="flex gap-2">
        <input
          className="input w-64"
          placeholder="Busca por nombre/correo/unidad…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          onKeyDown={(e)=>e.key==="Enter" && fetchData()}
        />
        <button className="btn" onClick={fetchData}>Buscar</button>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Condominio</th>
              <th className="px-4 py-3 text-left">Unidad</th>
              <th className="px-4 py-3 text-left">Residente</th>
              <th className="px-4 py-3 text-left">Correo</th>
              <th className="px-4 py-3 text-left">Inicio</th>
              <th className="px-4 py-3 text-left w-40">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-gray-500">Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-gray-500">Sin resultados.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.condominio_nombre || "-"}</td>
                <td className="px-4 py-3">{r.unidad_codigo || r.unidad}</td>
                <td className="px-4 py-3">{r.usuario_nombre || "-"}</td>
                <td className="px-4 py-3">{r.usuario_correo || "-"}</td>
                <td className="px-4 py-3">{r.fecha_inicio || "-"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => darBaja(r)} className="btn btn-danger">Dar de baja</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setModal(false)} />
          <div className="relative z-10 w-full max-w-4xl rounded-xl bg-white border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nuevo residente</h3>
              <button onClick={()=>setModal(false)} className="rounded px-2 py-1 hover:bg-gray-100">✕</button>
            </div>
            <ResidenteForm onCancel={()=>setModal(false)} onSave={onSave} working={working} />
          </div>
        </div>
      )}
    </section>
  );
}
