// src/pages/Reservas/ReservasPage.jsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { ReservasAPI } from "../../api/reservas.api";
import useSession from "../../auth/useSession";
import { ROLES } from "../../auth/rbac";

export default function ReservasPage() {
  const { me, hasAnyRole } = useSession();
  // Usamos la lógica nueva de permisos que te gustó
  const canManage = !!(me?.is_staff || me?.is_superuser || (hasAnyRole && hasAnyRole([ROLES.ADMIN])));
  const [tab, setTab] = useState("res"); // "res" | "areas"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gestión de Reservas y Áreas</h3>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-3 py-2 ${tab === "res" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-600"}`}
          onClick={() => setTab("res")}
        >
          Mis reservas
        </button>
        {canManage && (
          <button
            className={`px-3 py-2 ${tab === "areas" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-600"}`}
            onClick={() => setTab("areas")}
          >
            Configuración de Áreas
          </button>
        )}
      </div>

      {/* Renderizado: Nueva ReservasTab + Antigua AreasTab */}
      {tab === "res" ? <ReservasTab canManage={canManage} /> : <AreasTab />}
    </div>
  );
}

/* =========================
 * TAB: RESERVAS (NUEVO - con Gestión de estados)
 * ========================= */
function ReservasTab({ canManage }) {
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
      toast.error("No se pudieron cargar las áreas.");
    }
  }

  async function fetchReservas() {
    setLoading(true);
    try {
      const data = await ReservasAPI.reservas.list(params);
      setRows(data?.results || data || []);
    } catch {
      toast.error("No se pudieron cargar las reservas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAreas(); }, []);
  useEffect(() => { fetchReservas(); }, [params]);

  // --- Acciones de Gestión (Aprobar/Rechazar) ---
  async function onConfirmar(id) {
    try {
      await ReservasAPI.reservas.confirmar(id);
      toast.success("Reserva confirmada correctamente.");
      fetchReservas();
    } catch {
      toast.error("Error al confirmar. Verifique permisos de Staff.");
    }
  }

  async function onRechazar(id) {
    try {
      await ReservasAPI.reservas.rechazar(id);
      toast.success("Reserva rechazada.");
      fetchReservas();
    } catch {
      toast.error("Error al rechazar.");
    }
  }

  async function onCancelar(id) {
    try {
      await ReservasAPI.reservas.cancelar(id);
      toast.info("Reserva cancelada.");
      fetchReservas();
    } catch {
      toast.error("No se pudo cancelar la reserva.");
    }
  }

  async function crearReserva(e) {
    e.preventDefault();
    if (!form.area) return toast.error("Selecciona un área.");

    const start = dayjs(`${form.fecha}T${form.inicio}`);
    const end = dayjs(`${form.fecha}T${form.fin}`);

    if (!start.isValid() || !end.isValid()) return toast.error("Fecha/hora inválidas.");
    if (end.valueOf() <= start.valueOf()) return toast.error("La hora de fin debe ser posterior al inicio.");

    try {
      await ReservasAPI.reservas.create({
        area: Number(form.area),
        inicio: start.toISOString(),
        fin: end.toISOString(),
        motivo: form.motivo || "",
        asistentes: Number(form.asistentes || 0),
      });
      toast.success("¡Reserva registrada con éxito!");
      setForm(f => ({ ...f, motivo: "", asistentes: 0 }));
      fetchReservas();
    } catch (e) {
      toast.error("Error: ¿Solapamiento o área fuera de horario?");
    }
  }

  function EstadoBadge({ s }) {
    const map = {
      PENDIENTE: "bg-yellow-100 text-yellow-800",
      CONFIRMADA: "bg-green-100 text-green-800",
      CANCELADA: "bg-gray-200 text-gray-700",
      RECHAZADA: "bg-red-100 text-red-800",
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s] || "bg-gray-100"}`}>{s}</span>;
  }

  return (
    <>
      {/* Formulario de Nueva Reserva */}
      <div className="rounded border bg-white p-4 shadow-sm">
        <h4 className="font-semibold mb-3">Solicitar Nueva Reserva</h4>
        <form onSubmit={crearReserva} className="grid md:grid-cols-5 gap-3 items-end">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Área Común</label>
            <select
              className="select w-full mt-1 border-gray-300 rounded-md"
              value={form.area}
              onChange={e => {
                const v = e.target.value;
                setForm(f => ({ ...f, area: v }));
                setAreaId(v);
              }}
            >
              <option value="">— Selecciona —</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Fecha</label>
            <input type="date" className="input w-full mt-1" value={form.fecha} onChange={e=>setForm(f=>({...f, fecha:e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm font-medium">Inicio</label>
            <input type="time" className="input w-full mt-1" value={form.inicio} onChange={e=>setForm(f=>({...f, inicio:e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm font-medium">Fin</label>
            <input type="time" className="input w-full mt-1" value={form.fin} onChange={e=>setForm(f=>({...f, fin:e.target.value}))}/>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium">Motivo</label>
            <input className="input w-full mt-1" placeholder="Ej: Cumpleaños..." value={form.motivo} onChange={e=>setForm(f=>({...f, motivo:e.target.value}))}/>
          </div>
          <div>
            <label className="block text-sm font-medium">Asistentes</label>
            <input type="number" className="input w-full mt-1" value={form.asistentes} onChange={e=>setForm(f=>({...f, asistentes:e.target.value}))}/>
          </div>
          <div className="md:col-span-1">
            <button className="btn btn-primary w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={!form.area}>
              Reservar
            </button>
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2 py-2">
        <label className="text-sm font-medium">Filtrar por área:</label>
        <select className="select border rounded p-1" value={areaId} onChange={e=>setAreaId(e.target.value)}>
          <option value="">Todas las áreas</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>

      {/* Listado de Reservas con Acciones de Admin */}
      <div className="grid gap-3">
        {loading ? (
          <div className="p-4 text-center">Cargando datos...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">No hay reservas vigentes.</div>
        ) : rows.map(r => (
          <div key={r.id} className="rounded border bg-white p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-blue-900">{r.area_nombre}</h4>
                  <EstadoBadge s={r.estado}/>
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Horario:</span> {r.inicio?.replace("T"," ").slice(0,16)} a {r.fin?.replace("T"," ").slice(0,16)}
                </div>
                <div className="text-xs text-gray-500 italic">Solicitado por: {r.solicitante_username || "Usuario"}</div>
                {r.motivo && <div className="text-sm mt-2 text-gray-700 border-l-2 border-gray-200 pl-2">{r.motivo}</div>}
              </div>

              {/* Botones de acción dinámicos */}
              <div className="flex flex-col md:flex-row gap-2">
                {canManage && r.estado === "PENDIENTE" && (
                  <>
                    <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700" onClick={() => onConfirmar(r.id)}>
                      Aprobar
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700" onClick={() => onRechazar(r.id)}>
                      Rechazar
                    </button>
                  </>
                )}
                {(r.estado === "PENDIENTE" || r.estado === "CONFIRMADA") && (
                  <button className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-100" onClick={() => onCancelar(r.id)}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* =========================
 * TAB: ÁREAS (ANTIGUO - Restaurado completo)
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
    // Política completa (restaurada)
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
      {/* Formulario (VERSIÓN ORIGINAL COMPLETA) */}
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

        {/* Política (Restaurado para mostrar todos los campos) */}
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

      {/* Tabla Original */}
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