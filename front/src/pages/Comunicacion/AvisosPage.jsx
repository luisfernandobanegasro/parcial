// src/pages/Comunicacion/AvisosPage.jsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { ComunicacionAPI } from "../../api/comunicacion.api";
import { api } from "../../api/api";

export default function AvisosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [filtro, setFiltro] = useState({
    estado: "vigente",
    prioridad: "",
    condominio: "",
    unidad: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    cuerpo: "",
    prioridad: "INFO",
    alcance: "TODOS",
    condominio_id: "",
    unidad_id: "",
    vence_at: null,
  });

  const params = useMemo(() => {
    const p = {};
    if (filtro.estado) p.estado = filtro.estado;
    if (filtro.prioridad) p.prioridad = filtro.prioridad;
    if (filtro.condominio) p.condominio = filtro.condominio;
    if (filtro.unidad) p.unidad = filtro.unidad;
    p.page_size = 200;
    return p;
  }, [filtro]);

  async function fetchData() {
    setLoading(true);
    setErr("");
    try {
      const data = await ComunicacionAPI.avisos.list(params);
      const list = data?.results || data || [];
      setRows(list);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar avisos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [params]);

  async function onSubmit(ev) {
    ev && ev.preventDefault && ev.preventDefault();
    if (!form.titulo) return toast.error("Falta el título");
    if (!form.cuerpo) return toast.error("Falta el cuerpo");
    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo,
        cuerpo: form.cuerpo,
        prioridad: form.prioridad,
        alcance: form.alcance,
        condominio_id: form.alcance !== "TODOS" ? (form.condominio_id || null) : null,
        unidad_id: form.alcance === "UNIDAD" ? (form.unidad_id || null) : null,
        vence_at: form.vence_at ? dayjs(form.vence_at).toISOString() : null,
      };
      await ComunicacionAPI.avisos.create(payload);
      toast.success("Aviso publicado");
      setShowForm(false);
      setForm({ titulo: "", cuerpo: "", prioridad: "INFO", alcance: "TODOS", condominio_id: "", unidad_id: "", vence_at: null });
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo publicar el aviso (¿permisos?)");
    } finally {
      setSaving(false);
    }
  }

  async function marcarVisto(id) {
    try {
      await ComunicacionAPI.lecturas.marcarVisto(id);
      setRows(rows => rows.map(r => r.id === id ? { ...r, leido: true } : r));
    } catch {}
  }

  function prioridadBadge(p) {
    const map = {
      INFO: "bg-blue-100 text-blue-800",
      ALERTA: "bg-yellow-100 text-yellow-800",
      URGENTE: "bg-red-100 text-red-800",
    };
    return <span className={`px-2 py-0.5 rounded text-xs ${map[p]||"bg-gray-100 text-gray-700"}`}>{p}</span>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Comunicaciones</h3>
        <button className="btn" onClick={()=>setShowForm(s=>!s)}>{showForm ? "Cerrar" : "Nuevo aviso"}</button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="rounded border p-4 space-y-3 bg-white">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Título</label>
              <input className="input" value={form.titulo} onChange={(e)=>setForm(f=>({...f, titulo:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm">Prioridad</label>
              <select className="select" value={form.prioridad} onChange={(e)=>setForm(f=>({...f, prioridad:e.target.value}))}>
                <option value="INFO">Informativo</option>
                <option value="ALERTA">Alerta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm">Cuerpo</label>
            <textarea className="input" rows={4} value={form.cuerpo} onChange={(e)=>setForm(f=>({...f, cuerpo:e.target.value}))}/>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm">Alcance</label>
              <select className="select" value={form.alcance} onChange={(e)=>setForm(f=>({...f, alcance:e.target.value}))}>
                <option value="TODOS">Todos</option>
                <option value="CONDOMINIO">Condominio</option>
                <option value="UNIDAD">Unidad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Condominio (opcional)</label>
              <input className="input" placeholder="ID condominio" value={form.condominio_id||""}
                     onChange={(e)=>setForm(f=>({...f, condominio_id:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm">Unidad (opcional)</label>
              <input className="input" placeholder="ID unidad" value={form.unidad_id||""}
                     onChange={(e)=>setForm(f=>({...f, unidad_id:e.target.value}))}/>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm">Vence</label>
              <DatePicker selected={form.vence_at} onChange={(d)=>setForm(f=>({...f, vence_at:d}))} className="input" showTimeSelect />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={()=>setShowForm(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Publicando…" : "Publicar"}</button>
          </div>
        </form>
      )}

      {/* Filtros rápidos */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Estado</label>
          <select className="select" value={filtro.estado} onChange={(e)=>setFiltro(f=>({...f, estado:e.target.value}))}>
            <option value="vigente">Vigentes</option>
            <option value="todos">Todos</option>
            <option value="expirados">Expirados/Archivados</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Prioridad</label>
          <select className="select" value={filtro.prioridad} onChange={(e)=>setFiltro(f=>({...f, prioridad:e.target.value}))}>
            <option value="">Todas</option>
            <option value="INFO">Informativo</option>
            <option value="ALERTA">Alerta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
      </div>

      {err && <div className="p-2 bg-yellow-100 border rounded">{err}</div>}

      <div className="grid gap-3">
        {loading ? (
          <div className="p-4">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="p-4">Sin avisos.</div>
        ) : rows.map(a => (
          <div key={a.id} className="rounded border bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{a.titulo}</h4>
                  {prioridadBadge(a.prioridad)}
                  {!a.vigente && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">No vigente</span>}
                </div>
                <div className="text-xs text-gray-500">
                  Publicado: {a.publicado_at?.replace("T"," ").slice(0,16)} {a.autor_nombre ? `— ${a.autor_nombre}` : ""}
                  {a.vence_at && <> · Vence: {a.vence_at.replace("T"," ").slice(0,16)}</>}
                </div>
              </div>
              <div className="flex gap-2">
                {!a.leido && <button className="btn" onClick={()=>marcarVisto(a.id)}>Marcar leído</button>}
                {a.is_activo && <button className="btn" onClick={async()=>{
                  try { await ComunicacionAPI.avisos.archivar(a.id); fetchData(); } catch {}
                }}>Archivar</button>}
              </div>
            </div>

            <div className="mt-2 whitespace-pre-wrap text-sm">{a.cuerpo}</div>

            {Array.isArray(a.archivos) && a.archivos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {a.archivos.map(ar => (
                  <button key={ar.id} className="btn"
                          onClick={()=> api.openAuth(ar.archivo, { inline: true })}>
                    📎 {ar.nombre || "archivo"}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
