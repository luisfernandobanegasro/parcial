// src/pages/Finanzas/CargosPage.jsx
import { useEffect, useMemo, useState } from "react";
import { FinanzasAPI } from "../../api/finanzas.api";
import { unwrapList, api } from "../../api/api";
import { CondominiosAPI } from "../../api/condominios.api";
import { PropiedadesAPI } from "../../api/propiedades.api";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import dayjs from "dayjs";
import "react-datepicker/dist/react-datepicker.css";
import QrPayModal from "./QrPayModal";

function normalizeConceptos(list = []) {
  return (list || []).map(c => ({
    id: String(c.id ?? c),
    nombre: c.nombre ?? c.descripcion ?? c.codigo ?? String(c.id ?? c),
    codigo: c.codigo ?? null,
  }));
}
function normalizeCondominios(list = []) {
  return (list || []).map(c => ({
    id: String(c.id ?? c),
    nombre: c.nombre ?? `Condominio ${c.id ?? c}`,
  }));
}
function normalizeUnidades(list = []) {
  return (list || []).map(u => ({
    id: String(u.id ?? u),
    codigo: u.codigo ?? u.nombre ?? `Unidad ${u.id ?? u}`,
    condominio: u.condominio ?? u.condominio_id ?? null,
  }));
}

export default function CargosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [condominios, setCondominios] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [conceptos, setConceptos] = useState([]);

  const [filtro, setFiltro] = useState({ condominio: "", unidad: "", concepto: "" });

  const [seleccion, setSeleccion] = useState({});
  const [showModal, setShowModal] = useState(false);

  // estado del modal QR
  const [showQR, setShowQR] = useState(false);
  const [qrPago, setQrPago] = useState(null);
  const [qrIntentoId, setQrIntentoId] = useState(null);

  const totalSeleccionado = useMemo(
    () => Object.values(seleccion).reduce((acc, it) => acc + (Number(it.aPagar) || 0), 0),
    [seleccion]
  );

  async function loadCatalogs() {
    try {
      const [cnd, uni, cpt] = await Promise.all([
        CondominiosAPI.list({ page_size: 500 }),
        PropiedadesAPI.list({ page_size: 500 }),
        FinanzasAPI.conceptos.list({ page_size: 500 }),
      ]);
      setCondominios(normalizeCondominios(unwrapList(cnd)));
      setUnidades(normalizeUnidades(unwrapList(uni)));
      setConceptos(normalizeConceptos(unwrapList(cpt)));
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron cargar catálogos (verifica login/API)");
    }
  }

  const fetchData = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await FinanzasAPI.cargos.list({
        condominio: filtro.condominio || undefined,
        unidad: filtro.unidad || undefined,
        concepto: filtro.concepto || undefined,
        ordering: "id",
        page_size: 500,
      });
      const list = data?.results || data || [];
      setRows(list);
      setSeleccion(prev => {
        const next = {};
        list.forEach(r => { if (prev[r.id]) next[r.id] = prev[r.id]; });
        return next;
      });
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar cargos (verifica token/API)");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadCatalogs();
        if (!cancelled) await fetchData();
      } catch (e) { console.error(e); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { fetchData(); }, [filtro.condominio, filtro.unidad, filtro.concepto]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    concepto: "", condominio: "", unidad: "", monto: "", vencimiento: null, aplicarTodas: false
  });
  const [saving, setSaving] = useState(false);
  const onFormChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function onSubmitForm(ev) {
    ev && ev.preventDefault && ev.preventDefault();
    if (!form.concepto) return toast.error("Selecciona un concepto");
    if (!form.monto || Number.isNaN(Number(form.monto))) return toast.error("Ingresa un monto válido");
    if (!form.vencimiento) return toast.error("Selecciona fecha de vencimiento");

    if (!form.aplicarTodas && !form.unidad) {
      return toast.error("Selecciona una unidad (o marca 'Aplicar a todas').");
    }

    setSaving(true);
    try {
      const periodo = dayjs(form.vencimiento).startOf("month").format("YYYY-MM-DD");
      const payloadBase = {
        concepto: Number(form.concepto),
        monto: Number(form.monto).toFixed(2),
        vencimiento: dayjs(form.vencimiento).format("YYYY-MM-DD"),
        periodo,
      };

      // Comprobar duplicados antes de crear
  if (form.aplicarTodas) {
        let targets = unidades || [];
        if (form.condominio) {
          targets = targets.filter(u => String(u.condominio) === String(form.condominio));
        }
        if (!targets.length) return toast.error("No hay unidades para aplicar");

        // Traer cargos existentes para ese condominio y concepto (si hay condominio)
        const existingResp = await FinanzasAPI.cargos.list({
          condominio: form.condominio || undefined,
          concepto: Number(form.concepto),
          page_size: 500,
        });
        const existing = unwrapList(existingResp) || [];
        const unidadesConCargo = new Set(
          existing.filter(e => e.periodo && String(e.periodo).startsWith(periodo)).map(e => String(e.unidad ?? e.unidad_id))
        );

        const pendientes = targets.filter(u => !unidadesConCargo.has(String(u.id)));
        const ya = targets.length - pendientes.length;
        if (!pendientes.length) {
          toast.info(`No se creó nada: ${ya} unidad(es) ya tienen cargo para ${periodo}`);
          console.info("Cargos omitidos, no pendientes:", { periodo, concepto: form.concepto, condominio: form.condominio, total: targets.length });
          return;
        }

        console.info("Creando cargos para pendientes:", pendientes.map(p=>p.id));
        toast.info(`Creando ${pendientes.length} cargos...`);
        await Promise.all(
          pendientes.map(u => {
            const p = { ...payloadBase, unidad: Number(u.id) };
            console.debug("Crear cargo payload:", p);
            return FinanzasAPI.cargos.create(p);
          })
        );
        toast.success(`Creados ${pendientes.length} cargos. Se omitieron ${ya} que ya existían.`);
        await fetchData();

      } else {
        // crear para una unidad: comprobar si ya existe
        if (!form.unidad) return toast.error("Selecciona una unidad");
        const existingResp = await FinanzasAPI.cargos.list({ unidad: Number(form.unidad), concepto: Number(form.concepto), page_size: 500 });
        const existing = unwrapList(existingResp) || [];
        if (existing.some(e => e.periodo && String(e.periodo).startsWith(periodo))) {
          toast.error("Ya existe un cargo para esa unidad/concepto/periodo.");
          console.info("Creación anulada porque ya existe:", { unidad: form.unidad, concepto: form.concepto, periodo });
          return;
        }
        const singlePayload = { ...payloadBase, unidad: Number(form.unidad) };
        console.debug("Crear cargo single payload:", singlePayload);
        toast.info("Creando cargo...");
        await FinanzasAPI.cargos.create(singlePayload);
        toast.success("Cargo creado");
        await fetchData();
      }

      toast.success("Cargo(s) creado(s)");
      setForm({ concepto: "", condominio: "", unidad: "", monto: "", vencimiento: null, aplicarTodas: false });
      setShowForm(false);
      await fetchData();
    } catch (e) {
      console.error("Error crear cargo:", e);
      const server = e?.response?.data;
      if (server) {
        if (typeof server === "string") toast.error(server);
        else if (Array.isArray(server)) toast.error(server.join("; "));
        else if (server.detail) toast.error(String(server.detail));
        else {
          const msgs = Object.entries(server).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
          toast.error(msgs.join(" — "));
        }
      } else {
        toast.error(e?.message || "Error al crear cargo");
      }
    } finally {
      setSaving(false);
    }
  }

  const conceptosMap = Object.fromEntries((conceptos || []).map(c => [String(c.id), c.nombre || c.codigo || c.id]));
  const condominiosMap = Object.fromEntries((condominios || []).map(c => [String(c.id), c.nombre || c.id]));
  const unidadesMap = Object.fromEntries((unidades || []).map(u => [String(u.id), u.codigo || u.nombre || u.id]));

  function displayConceptoRow(r) {
    if (!r && r !== 0) return "-";
    if (r.concepto_nombre) return r.concepto_nombre;
    const c = r.concepto ?? r.concepto_id ?? null;
    if (!c && c !== 0) return "-";
    if (typeof c === "object") return c.nombre || c.descripcion || c.codigo || String(c.id || "-");
    return conceptosMap[String(c)] || String(c);
  }
  function displayUnidad(r) {
    const val = r.unidad ?? r.unidad_id ?? null;
    if (r.unidad_codigo) return r.unidad_codigo;
    if (r.unidad_nombre) return r.unidad_nombre;
    if (!val && val !== 0) return "-";
    if (typeof val === "object") return val.codigo || val.nombre || String(val.id || "-");
    return unidadesMap[String(val)] || String(val);
  }
  function displayCondominio(r) {
    const c = r.condominio ?? r.condominio_id ?? null;
    if (r.condominio_nombre) return r.condominio_nombre;
    if (c) {
      if (typeof c === "object") return c.nombre || String(c.id);
      return condominiosMap[String(c)] || String(c);
    }
    const unidadVal = r.unidad ?? r.unidad_id ?? null;
    if (unidadVal) {
      let uObj = (typeof unidadVal === "object")
        ? unidadVal
        : (unidades || []).find(x => String(x.id) === String(unidadVal));
      if (uObj) {
        if (uObj.condominio && typeof uObj.condominio === "object") return uObj.condominio.nombre || String(uObj.condominio.id);
        if (uObj.condominio) return condominiosMap[String(uObj.condominio)] || String(uObj.condominio);
      }
    }
    return "-";
  }

  const toggleSelect = (r, checked) => {
    setSeleccion(prev => {
      const next = { ...prev };
      if (checked) next[r.id] = { row: r, aPagar: Number(r.monto || 0) };
      else delete next[r.id];
      return next;
    });
  };
  const pagarUno = (r) => {
    setSeleccion({ [r.id]: { row: r, aPagar: Number(r.monto || 0) } });
    setShowModal(true);
  };
  const abrirModalPago = () => {
    if (!Object.keys(seleccion).length) return toast.info("Selecciona al menos un cargo");
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cargos</h3>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setShowForm(s => !s)}>
            {showForm ? "Cerrar" : "Nuevo cargo"}
          </button>
        </div>
      </div>

      {/* ---- FORM CREAR CARGO ---- */}
      {showForm && (
        <form onSubmit={onSubmitForm} className="rounded border p-4 space-y-3 bg-white">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm">Concepto</label>
              <select className="select" value={form.concepto} onChange={(e)=>onFormChange('concepto', e.target.value)}>
                <option value="">— Selecciona —</option>
                {conceptos.map(c => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nombre || c.codigo || String(c.id)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Condominio</label>
              <select className="select" value={form.condominio} onChange={(e)=>onFormChange('condominio', e.target.value)}>
                <option value="">— Selecciona —</option>
                {condominios.map(c => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nombre || String(c.id)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Unidad</label>
              <select className="select" value={form.unidad} onChange={(e)=>onFormChange('unidad', e.target.value)}>
                <option value="">— Selecciona —</option>
                {unidades
                  .filter(u => !form.condominio || String(u.condominio) === String(form.condominio))
                  .map(u => (
                    <option key={u.id} value={String(u.id)}>
                      {u.codigo || String(u.id)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm">Monto</label>
              <input className="input" type="number" step="0.01"
                     value={form.monto} onChange={(e)=>onFormChange('monto', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm">Vencimiento</label>
              <DatePicker selected={form.vencimiento}
                          onChange={(d)=>onFormChange('vencimiento', d)}
                          className="input" dateFormat="yyyy-MM-dd" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="check"
                       checked={!!form.aplicarTodas}
                       onChange={(e)=>onFormChange('aplicarTodas', e.target.checked)} />
                <span className="text-sm">Aplicar a todas las unidades</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn"
                    onClick={()=>{
                      setShowForm(false);
                      setForm({ concepto: "", condominio: "", unidad: "", monto: "", vencimiento: null, aplicarTodas: false });
                    }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Crear cargo(s)"}
            </button>
          </div>
        </form>
      )}

      {/* ---- FILTROS ---- */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-sm">Concepto</label>
          <select className="select" value={filtro.concepto}
                  onChange={(e)=>setFiltro(f=>({...f, concepto: e.target.value}))}>
            <option value="">— Selecciona —</option>
            {conceptos.map(c => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre || c.codigo || String(c.id)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Condominio</label>
          <select className="select" value={filtro.condominio}
                  onChange={(e)=>setFiltro(f=>({...f, condominio: e.target.value}))}>
            <option value="">— Selecciona —</option>
            {condominios.map(c => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre || String(c.id)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Unidad</label>
          <select className="select" value={filtro.unidad}
                  onChange={(e)=>setFiltro(f=>({...f, unidad: e.target.value}))}>
            <option value="">— Selecciona —</option>
            {unidades
              .filter(u => !filtro.condominio || String(u.condominio) === String(filtro.condominio))
              .map(u => (
                <option key={u.id} value={String(u.id)}>
                  {u.codigo || String(u.id)}
                </option>
              ))}
          </select>
        </div>

        <div className="ml-auto flex items-end gap-2">
          <button className="btn btn-primary" onClick={abrirModalPago}
                  disabled={!Object.keys(seleccion).length}>
            Registrar pago ({totalSeleccionado.toFixed(2)})
          </button>
        </div>
      </div>

      {err && <div className="p-2 bg-yellow-100 border rounded">{err}</div>}

      {/* ---- TABLA ---- */}
      <div className="rounded border overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2"></th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Concepto</th>
              <th className="px-3 py-2 text-left">Condominio</th>
              <th className="px-3 py-2 text-left">Unidad</th>
              <th className="px-3 py-2 text-left">Monto</th>
              <th className="px-3 py-2 text-left">Vence</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={9} className="px-3 py-6">Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-6">Sin cargos.</td></tr>
            ) : rows.map(r => {
              const checked = !!seleccion[r.id];
              return (
                <tr key={r.id}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e)=>toggleSelect(r, e.target.checked)}
                      disabled={r.estado === "PAGADO"}
                    />
                  </td>
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{displayConceptoRow(r)}</td>
                  <td className="px-3 py-2">{displayCondominio(r)}</td>
                  <td className="px-3 py-2">{displayUnidad(r)}</td>
                  <td className="px-3 py-2">{Number(r.monto).toFixed(2)}</td>
                  <td className="px-3 py-2">{r.vencimiento}</td>
                  <td className="px-3 py-2">{r.estado}</td>
                  <td className="px-3 py-2">
                    <button className="btn" onClick={()=>pagarUno(r)} disabled={r.estado==="PAGADO"}>
                      Pagar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---- MODAL CONFIRMAR PAGO ---- */}
      {showModal && (
        <RegistrarPagoModal
          seleccion={seleccion}
          onClose={()=>setShowModal(false)}
          onChange={(cargoId, aPagar)=> setSeleccion(prev=> ({...prev, [cargoId]: { ...prev[cargoId], aPagar }}))}
          onSubmit={async ({ medio }) => {
            try {
              const agrupadasPorUnidad = new Map();
              Object.values(seleccion).forEach(({ row, aPagar }) => {
                const unidadVal = row.unidad;
                const unidadId = (unidadVal && typeof unidadVal === "object") ? unidadVal.id : unidadVal;
                const key = String(unidadId);
                if (!agrupadasPorUnidad.has(key)) agrupadasPorUnidad.set(key, []);
                agrupadasPorUnidad.get(key).push({ cargo: row.id, monto_aplicado: Number(aPagar) });
              });

              if (medio === "QR" && agrupadasPorUnidad.size !== 1) {
                toast.info("Para QR, registra por unidad (selecciona cargos de una sola unidad).");
                return;
              }

              const comprobantes = [];
              const pagosCreados = [];

              for (const [unidad_id, detalles] of agrupadasPorUnidad.entries()) {
                const pago = await FinanzasAPI.pagos.registrar({
                  unidad_id: Number(unidad_id),
                  medio,
                  moneda: "BOB",
                  detalles,
                  generar_documento: true,
                  tipo_documento: "RECIBO",
                });
                pagosCreados.push(pago);
                if (pago?.documento) comprobantes.push(pago.documento);
              }

              if (medio === "EFECTIVO") {
                toast.success("Pago(s) en efectivo asentado(s).");
                for (const idDoc of comprobantes) {
                  await api.openAuth(`/finanzas/documentos/${idDoc}/descargar/`, { inline: false });
                }
                setShowModal(false);
                setSeleccion({});
                fetchData();
                return;
              }

              if (medio === "TRANSFERENCIA") {
                toast.info("Transferencia(s) registradas en PENDIENTE. Aséntalas al verificar el depósito.");
                setShowModal(false);
                setSeleccion({});
                fetchData();
                return;
              }

              if (medio === "QR") {
                const pago = pagosCreados[0];
                try {
                  const r = await api.post(`/finanzas/pagos/${pago.id}/iniciar_qr/`, {});
                  const intentoId = r?.intento_id ?? r?.id ?? null;
                  if (!intentoId) {
                    toast.error("No llegó intento_id desde el servidor.");
                  } else {
                    setQrPago(pago);
                    setQrIntentoId(intentoId);
                    setShowQR(true);
                  }
                } catch (err) {
                  console.error(err);
                  toast.error(err?.message || "No se pudo iniciar el QR");
                }
                setShowModal(false);
                setSeleccion({});
                return;
              }

              toast.info("Pasarela (tarjeta/billetera) aún no está configurada.");
              setShowModal(false);
              setSeleccion({});
              fetchData();
            } catch (e) {
              console.error(e);
              toast.error(e?.message || "No se pudo registrar el pago");
            }
          }}

          displayUnidad={displayUnidad}
          displayConcepto={displayConceptoRow}
          displayCondominio={displayCondominio}
        />
      )}

      {/* ---- MODAL QR ---- */}
      {showQR && qrPago && (
        <QrPayModal
          pago={qrPago}
          pagoId={qrPago?.id}
          intentoId={qrIntentoId}
          onClose={() => {
            setShowQR(false);
            setQrPago(null);
            setQrIntentoId(null);
          }}
          onApproved={async (documentoId) => {
            try {
              if (documentoId) {
                await api.openAuth(`/finanzas/documentos/${documentoId}/descargar/`, { inline: false });
              }
              toast.success("Pago QR aprobado");
            } catch (e) {
              console.error(e);
              toast.error("Aprobado, pero no se pudo descargar el comprobante");
            } finally {
              setShowQR(false);
              setQrPago(null);
              setQrIntentoId(null);
              fetchData();
            }
          }}
        />
      )}
    </div>
  );
}

function RegistrarPagoModal({ seleccion, onClose, onChange, onSubmit, displayUnidad, displayConcepto, displayCondominio }) {
  const [medio, setMedio] = useState("EFECTIVO");
  const [submittingLocal, setSubmittingLocal] = useState(false);
  const items = Object.values(seleccion);
  const total = items.reduce((acc, it) => acc + (Number(it.aPagar) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-xl bg-white dark:bg-gray-900 border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Registrar pago</h4>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm">Medio</label>
            <select className="select" value={medio} onChange={(e)=>setMedio(e.target.value)}>
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="QR">QR</option>
              <option value="TARJETA">TARJETA</option>
              <option value="BILLETERA">BILLETERA</option>
            </select>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold">{total.toFixed(2)} BOB</div>
          </div>
        </div>

        <div className="rounded border overflow-x-auto">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Cargo</th>
                <th className="px-3 py-2 text-left">Unidad</th>
                <th className="px-3 py-2 text-left">Concepto</th>
                <th className="px-3 py-2 text-left">Condominio</th>
                <th className="px-3 py-2 text-left">Monto</th>
                <th className="px-3 py-2 text-left">A pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(({row, aPagar})=>(
                <tr key={row.id}>
                  <td className="px-3 py-2">{row.id}</td>
                  <td className="px-3 py-2">{displayUnidad(row)}</td>
                  <td className="px-3 py-2">{displayConcepto(row)}</td>
                  <td className="px-3 py-2">{displayCondominio(row)}</td>
                  <td className="px-3 py-2">{Number(row.monto).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <input
                      className="input w-28 text-right"
                      type="number"
                      step="0.01"
                      min="0"
                      max={Number(row.monto) || 0}
                      value={aPagar}
                      onChange={(e)=>onChange(row.id, Number(e.target.value||0))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose} disabled={submittingLocal}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              if (submittingLocal) return;
              setSubmittingLocal(true);
              try {
                await onSubmit({ medio });
              } catch (e) {
                console.error(e);
              } finally {
                setSubmittingLocal(false);
              }
            }}
            disabled={total<=0 || submittingLocal}
          >
            {submittingLocal ? (
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
                </svg>
                Procesando…
              </span>
            ) : (
              "Confirmar pago"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
