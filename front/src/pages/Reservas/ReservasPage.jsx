// src/pages/Reservas/ReservasPage.jsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { ReservasAPI } from "../../api/reservas.api";
import useSession from "../../auth/useSession";
import { ROLES } from "../../auth/rbac";

export default function ReservasPage() {
  const { me, hasAnyRole } = useSession();
  const canSeeAreas = !!(me?.is_staff || me?.is_superuser || (hasAnyRole && hasAnyRole([ROLES.ADMIN])));
  const [tab, setTab] = useState("res"); // "res" | "areas"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reservas</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-3 py-2 ${tab === "res" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-600"}`}
          onClick={() => setTab("res")}
        >
          Mis reservas
        </button>
        {canSeeAreas && (
          <button
            className={`px-3 py-2 ${tab === "areas" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-600"}`}
            onClick={() => setTab("areas")}
          >
            Áreas
          </button>
        )}
      </div>

      {tab === "res" ? <ReservasTab /> : <AreasTab />}
    </div>
  );
}

/* =========================
 *  TAB: RESERVAS (form + lista)
 * ========================= */
function ReservasTab() {
  const [areas, setAreas] = useState([]);
  const [areaId, setAreaId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    area: "",
    fecha: dayjs().format("YYYY-MM-DD"),
    inicio: "10:00",
    fin: "12:00",
    motivo: "",
    asistentes: 0,
  });

  const params = useMemo(() => {
    const p = { vigente: "yes", page_size: 200 };
    if (areaId) p.area = areaId;
    return p;
  }, [areaId]);

  async function fetchAreas() {
    try {
      const data = await ReservasAPI.areas.list({ page_size: 200 });
      setAreas(data?.results || data || []);
    } catch {
      toast.error("No se pudieron cargar áreas.");
    }
  }

  async function fetchReservas() {
    setLoading(true);
    try {
      const data = await ReservasAPI.reservas.list(params);
      setRows(data?.results || data || []);
    } catch {
      toast.error("No se pudieron cargar reservas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAreas(); }, []);
  useEffect(() => { fetchReservas(); }, [params]);

async function crearReserva(e) {
  e.preventDefault();
  if (!form.area) return toast.error("Selecciona un área.");

  // Construimos dayjs sin plugins y comparamos por milisegundos
  const start = dayjs(`${form.fecha}T${form.inicio}`);
  const end   = dayjs(`${form.fecha}T${form.fin}`);

  if (!start.isValid() || !end.isValid()) {
    return toast.error("Fecha/hora inválidas.");
  }
  if (end.valueOf() <= start.valueOf()) {
    return toast.error("Fin debe ser mayor al inicio.");
  }

  try {
    await ReservasAPI.reservas.create({
      area: Number(form.area),
      inicio: start.toISOString(),
      fin: end.toISOString(),
      motivo: form.motivo || "",
      asistentes: Number(form.asistentes || 0),
    });
    toast.success("Reserva registrada.");
    setForm(f => ({ ...f, motivo: "", asistentes: 0 }));
    fetchReservas();
  } catch (e) {
    console.error(e);
    toast.error("No se pudo crear la reserva (¿solapamiento o fuera de horario?).");
  }
}


  async function onCancelar(id) {
    try {
      await ReservasAPI.reservas.cancelar(id);
      fetchReservas();
    } catch {
      toast.error("No se pudo cancelar la reserva.");
    }
  }

  function EstadoBadge({ s }) {
    const map = {
      PENDIENTE: "bg-yellow-100 text-yellow-800",
      CONFIRMADA: "bg-green-100 text-green-800",
      CANCELADA: "bg-gray-200 text-gray-700",
      RECHAZADA: "bg-red-100 text-red-800",
    };
    return <span className={`px-2 py-0.5 rounded text-xs ${map[s] || "bg-gray-100"}`}>{s}</span>;
  }

  return (
    <>
      {/* Formulario */}
      <div className="rounded border bg-white p-3">
        <form onSubmit={crearReserva} className="grid md:grid-cols-5 gap-3 items-end">
          <div className="col-span-2">
            <label className="block text-sm">Área</label>
            <select
              className="select w-full"
              value={form.area}
              onChange={e => {
                const v = e.target.value;
                setForm(f => ({ ...f, area: v }));
                setAreaId(v);
              }}
            >
              <option value="">— Selecciona —</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm">Fecha</label>
            <input type="date" className="input w-full" value={form.fecha} onChange={e=>setForm(f=>({...f, fecha:e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm">Inicio</label>
            <input type="time" className="input w-full" value={form.inicio} onChange={e=>setForm(f=>({...f, inicio:e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm">Fin</label>
            <input type="time" className="input w-full" value={form.fin} onChange={e=>setForm(f=>({...f, fin:e.target.value}))}/>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm">Motivo (opcional)</label>
            <input className="input w-full" value={form.motivo} onChange={e=>setForm(f=>({...f, motivo:e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm">Asistentes</label>
            <input type="number" min="0" className="input w-full" value={form.asistentes} onChange={e=>setForm(f=>({...f, asistentes:e.target.value}))}/>
          </div>
          <div className="md:col-span-5 flex justify-end">
            <button className="btn btn-primary" disabled={!form.area}>Reservar</button>
          </div>
        </form>
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-2">
        <label>Filtrar por área:</label>
        <select className="select" value={areaId} onChange={e=>setAreaId(e.target.value)}>
          <option value="">Todas</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>

      {/* Listado */}
      <div className="grid gap-3">
        {loading ? (
          <div className="p-4">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="p-4">Sin reservas.</div>
        ) : rows.map(r => (
          <div key={r.id} className="rounded border bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{r.area_nombre}</h4>
                  <EstadoBadge s={r.estado}/>
                </div>
                <div className="text-xs text-gray-500">
                  {r.inicio?.replace("T"," ").slice(0,16)} → {r.fin?.replace("T"," ").slice(0,16)}
                </div>
                {r.motivo && <div className="text-sm mt-1">{r.motivo}</div>}
              </div>
              {(r.estado === "PENDIENTE" || r.estado === "CONFIRMADA") && (
                <button className="btn" onClick={() => onCancelar(r.id)}>Cancelar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* =========================
 *  TAB: ÁREAS (CRUD admin con UI amigable)
 * ========================= */
function AreasTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    id: null,
    nombre: "",
    capacidad: 0,
    requiere_pago: false,
    costo_base: "0.00",
    condominio_id: "",
    // Política gestionada por la UI:
    p_apertura: "08:00",
    p_cierre: "22:00",
    p_duracion_min: 60,
    p_max_anticipacion_dias: 30,
    p_max_por_dia: 1,
    p_requiere_aprobacion: false,
    p_permitir_solape: false,
  });
  const editing = form.id !== null;

  // ---- helpers JSON<->UI ----
  function policyFromJson(json) {
    const p = json || {};
    return {
      p_apertura: p.horario?.apertura || "08:00",
      p_cierre: p.horario?.cierre || "22:00",
      p_duracion_min: p.duracion_min || 60,
      p_max_anticipacion_dias: p.max_anticipacion_dias ?? 30,
      p_max_por_dia: p.max_por_dia ?? 1,
      p_requiere_aprobacion: !!p.requiere_aprobacion,
      p_permitir_solape: !!p.permitir_solape,
    };
  }
  function policyToJson(state) {
    return {
      horario: { apertura: state.p_apertura, cierre: state.p_cierre },
      duracion_min: Number(state.p_duracion_min) || 60,
      max_anticipacion_dias: Number(state.p_max_anticipacion_dias) || 30,
      max_por_dia: Number(state.p_max_por_dia) || 1,
      requiere_aprobacion: !!state.p_requiere_aprobacion,
      permitir_solape: !!state.p_permitir_solape,
    };
  }

  async function fetchAreas() {
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
  useEffect(() => { fetchAreas(); }, []);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        nombre: form.nombre,
        capacidad: Number(form.capacidad || 0),
        requiere_pago: !!form.requiere_pago,
        costo_base: form.costo_base || "0.00",
        politica: policyToJson(form),
        condominio_id: form.condominio_id ? Number(form.condominio_id) : null,
      };
      if (editing) {
        await ReservasAPI.areas.update(form.id, payload);
        toast.success("Área actualizada");
      } else {
        await ReservasAPI.areas.create(payload);
        toast.success("Área creada");
      }
      setForm(f => ({
        id: null, nombre: "", capacidad: 0, requiere_pago: false, costo_base: "0.00", condominio_id: "",
        ...policyFromJson(null),
      }));
      fetchAreas();
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar el área.");
    }
  }

  async function onDelete(id) {
    if (!window.confirm("¿Eliminar área?")) return;
    try {
      await ReservasAPI.areas.remove(id);
      toast.success("Área eliminada");
      fetchAreas();
    } catch {
      toast.error("No se pudo eliminar el área.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Formulario */}
      <form onSubmit={onSubmit} className="border rounded p-3 bg-white space-y-2">
        <h4 className="font-semibold">{editing ? "Editar área" : "Nueva área"}</h4>

        <div className="grid md:grid-cols-3 gap-2">
          <div>
            <label className="text-sm">Nombre</label>
            <input className="input" value={form.nombre} onChange={e=>setForm(f=>({...f, nombre:e.target.value}))}/>
          </div>
          <div>
            <label className="text-sm">Capacidad</label>
            <input type="number" min={0} className="input" value={form.capacidad} onChange={e=>setForm(f=>({...f, capacidad:e.target.value}))}/>
          </div>
          <div>
            <label className="text-sm">Condominio ID (opcional)</label>
            <input className="input" value={form.condominio_id} onChange={e=>setForm(f=>({...f, condominio_id:e.target.value}))}/>
          </div>

          <div className="flex items-center gap-2">
            <input id="chk" type="checkbox" checked={form.requiere_pago} onChange={e=>setForm(f=>({...f, requiere_pago:e.target.checked}))}/>
            <label htmlFor="chk">Requiere pago</label>
          </div>
          <div>
            <label className="text-sm">Costo base</label>
            <input className="input" value={form.costo_base} onChange={e=>setForm(f=>({...f, costo_base:e.target.value}))}/>
          </div>
        </div>

        {/* Política (UI amigable) */}
        <div className="mt-3 grid md:grid-cols-3 gap-2">
          <div>
            <label className="text-sm">Apertura (HH:mm)</label>
            <input type="time" className="input" value={form.p_apertura} onChange={e=>setForm(f=>({...f, p_apertura:e.target.value}))}/>
          </div>
          <div>
            <label className="text-sm">Cierre (HH:mm)</label>
            <input type="time" className="input" value={form.p_cierre} onChange={e=>setForm(f=>({...f, p_cierre:e.target.value}))}/>
          </div>
          <div>
            <label className="text-sm">Duración por bloque (min)</label>
            <input type="number" min={15} step={15} className="input" value={form.p_duracion_min} onChange={e=>setForm(f=>({...f, p_duracion_min:e.target.value}))}/>
          </div>
          <div>
            <label className="text-sm">Máx. anticipación (días)</label>
            <input type="number" min={0} className="input" value={form.p_max_anticipacion_dias} onChange={e=>setForm(f=>({...f, p_max_anticipacion_dias:e.target.value}))}/>
          </div>
          <div>
            <label className="text-sm">Máx. reservas por día</label>
            <input type="number" min={1} className="input" value={form.p_max_por_dia} onChange={e=>setForm(f=>({...f, p_max_por_dia:e.target.value}))}/>
          </div>
          <div className="flex items-center gap-2">
            <input id="chk2" type="checkbox" checked={form.p_requiere_aprobacion} onChange={e=>setForm(f=>({...f, p_requiere_aprobacion:e.target.checked}))}/>
            <label htmlFor="chk2">Requiere aprobación</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="chk3" type="checkbox" checked={form.p_permitir_solape} onChange={e=>setForm(f=>({...f, p_permitir_solape:e.target.checked}))}/>
            <label htmlFor="chk3">Permitir solapes</label>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-2">
          {editing && (
            <button
              type="button"
              className="btn"
              onClick={()=>setForm(f=>({
                id:null, nombre:"", capacidad:0, requiere_pago:false, costo_base:"0.00", condominio_id:"",
                ...policyFromJson(null),
              }))}
            >
              Cancelar
            </button>
          )}
          <button className="btn btn-primary" type="submit">
            {editing ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>

      {/* Tabla */}
      <div className="border rounded bg-white">
        <div className="p-2 font-semibold border-b">Áreas registradas</div>
        {loading ? (
          <div className="p-3">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="p-3">Sin áreas creadas.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Cap.</th>
                <th className="text-left p-2">Pago</th>
                <th className="text-left p-2">Costo</th>
                <th className="text-left p-2">Horario</th>
                <th className="text-left p-2">Bloque</th>
                <th className="text-left p-2">Límites</th>
                <th className="text-left p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const pol = r.politica || {};
                const horario = pol.horario ? `${pol.horario.apertura || "—"}–${pol.horario.cierre || "—"}` : "—";
                const bloque = pol.duracion_min ? `${pol.duracion_min} min` : "—";
                const limites = `Ant.: ${pol.max_anticipacion_dias ?? "—"}d • xDía: ${pol.max_por_dia ?? "—"} • Aprob.: ${pol.requiere_aprobacion ? "Sí" : "No"} • Solape: ${pol.permitir_solape ? "Sí" : "No"}`;
                return (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">{r.nombre}</td>
                    <td className="p-2">{r.capacidad}</td>
                    <td className="p-2">{r.requiere_pago ? "Sí" : "No"}</td>
                    <td className="p-2">{r.costo_base}</td>
                    <td className="p-2">{horario}</td>
                    <td className="p-2">{bloque}</td>
                    <td className="p-2">{limites}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        className="btn"
                        onClick={() =>
                          setForm({
                            id: r.id,
                            nombre: r.nombre,
                            capacidad: r.capacidad,
                            requiere_pago: r.requiere_pago,
                            costo_base: r.costo_base,
                            condominio_id: r.condominio_id || "",
                            ...policyFromJson(r.politica),
                          })
                        }
                      >
                        Editar
                      </button>
                      <button className="btn" onClick={() => onDelete(r.id)}>Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
