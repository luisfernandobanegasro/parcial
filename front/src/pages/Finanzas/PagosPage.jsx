// src/pages/Finanzas/PagosPage.jsx
import { useEffect, useMemo, useState } from "react";
import { FinanzasAPI } from "../../api/finanzas.api";
import { CondominiosAPI } from "../../api/condominios.api";
import { PropiedadesAPI } from "../../api/propiedades.api";
import { unwrapList, api } from "../../api/api";
import QrPayModal from "./QrPayModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import { toast } from "react-toastify";

export default function PagosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  // track pending action per pago id (value is action name: 'anular'|'abrir'|'descargar')
  const [pendingActions, setPendingActions] = useState({});

  // QR modal state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrPago, setQrPago] = useState(null);
  const [qrIntentoId, setQrIntentoId] = useState(null);

  const [condominios, setCondominios] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [filtro, setFiltro] = useState({
    condominio: "",
    unidad: "",
    estado: "",
    medio: "",
    desde: null,
    hasta: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const [cnd, uni] = await Promise.all([
          CondominiosAPI.list({ page_size: 500 }),
          PropiedadesAPI.list({ page_size: 500 }),
        ]);
        setCondominios(unwrapList(cnd));
        setUnidades(unwrapList(uni));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        ordering: "-fecha",
        page_size: 500,
      };
      if (filtro.condominio) params.condominio = filtro.condominio;
      if (filtro.unidad) params.unidad = filtro.unidad;
      if (filtro.estado) params.estado = filtro.estado;
      if (filtro.medio) params.medio = filtro.medio;
      if (filtro.desde) params.desde = dayjs(filtro.desde).format("YYYY-MM-DD");
      if (filtro.hasta) params.hasta = dayjs(filtro.hasta).format("YYYY-MM-DD");

      const data = await FinanzasAPI.pagos.list(params);
      setRows(data?.results || data || []);
    } catch (e) {
      toast.error(e?.message || "No se pudieron cargar pagos");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchData();
  }, [
    filtro.condominio,
    filtro.unidad,
    filtro.estado,
    filtro.medio,
    filtro.desde,
    filtro.hasta,
  ]);

  const total = useMemo(
    () => (rows || []).reduce((a, r) => a + Number(r.monto || 0), 0),
    [rows]
  );

  const onAnular = async (r) => {
    if (!window.confirm(`¿Anular el pago #${r.id}?`)) return;
  setPendingActions(p => ({ ...p, [r.id]: 'anular' }));
    try {
      await FinanzasAPI.pagos.anular(r.id);
      toast.success("Pago anulado");
      fetchData();
    } catch (e) {
      toast.error(e?.message || "No se pudo anular");
    } finally {
      setPendingActions(p => { const np = { ...p }; delete np[r.id]; return np; });
    }
  };

  const onDescargar = async (r) => {
    if (!r.documento)
      return toast.info("Este pago no tiene documento asociado");
  setPendingActions(p => ({ ...p, [r.id]: 'descargar' }));
    try {
      // FORZAR DESCARGA (no abrir pestaña)
      await api.openAuth(
        `/finanzas/documentos/${r.documento}/descargar/`,
        { inline: false }
      );
    } catch (e) {
      console.error(e);
      toast.error("No se pudo descargar el comprobante");
    } finally {
      setPendingActions(p => { const np = { ...p }; delete np[r.id]; return np; });
    }
  };

  const abrirQr = async (pago) => {
  setPendingActions(p => ({ ...p, [pago.id]: 'abrir' }));
    try {
      const r = await api.post(`/finanzas/pagos/${pago.id}/iniciar_qr/`, {});
      const intentoId = r?.intento_id ?? r?.data?.intento_id ?? r?.id ?? null;
      if (!intentoId) return toast.error("No llegó intento_id.");
      setQrPago(pago);
      setQrIntentoId(intentoId);
      setQrOpen(true);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "No se pudo iniciar el QR");
    } finally {
      setPendingActions(p => { const np = { ...p }; delete np[pago.id]; return np; });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-6 gap-2">
        <div>
          <label className="block text-sm">Condominio</label>
          <select
            className="select"
            value={filtro.condominio}
            onChange={(e) =>
              setFiltro((f) => ({ ...f, condominio: e.target.value }))
            }
          >
            <option value="">— Todos —</option>
            {condominios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre || c.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Unidad</label>
          <select
            className="select"
            value={filtro.unidad}
            onChange={(e) =>
              setFiltro((f) => ({ ...f, unidad: e.target.value }))
            }
          >
            <option value="">— Todas —</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.codigo || u.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Estado</label>
          <select
            className="select"
            value={filtro.estado}
            onChange={(e) =>
              setFiltro((f) => ({ ...f, estado: e.target.value }))
            }
          >
            <option value="">— Todos —</option>
            <option value="APROBADO">APROBADO</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="ANULADO">ANULADO</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Medio</label>
          <select
            className="select"
            value={filtro.medio}
            onChange={(e) =>
              setFiltro((f) => ({ ...f, medio: e.target.value }))
            }
          >
            <option value="">— Todos —</option>
            <option value="EFECTIVO">EFECTIVO</option>
            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
            <option value="QR">QR</option>
            <option value="TARJETA">TARJETA</option>
            <option value="BILLETERA">BILLETERA</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Desde</label>
          <DatePicker
            selected={filtro.desde}
            onChange={(d) => setFiltro((f) => ({ ...f, desde: d }))}
            className="input"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div>
          <label className="block text-sm">Hasta</label>
          <DatePicker
            selected={filtro.hasta}
            onChange={(d) => setFiltro((f) => ({ ...f, hasta: d }))}
            className="input"
            dateFormat="yyyy-MM-dd"
          />
        </div>
      </div>

      <div className="rounded border overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Unidad</th>
              <th className="px-3 py-2 text-left">Medio</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Monto</th>
              <th className="px-3 py-2 text-left">Comprobante</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-6">
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6">
                  Sin pagos.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{r.fecha ? dayjs(r.fecha).format("DD/MM/YYYY HH:mm") : "-"}</td>
                  <td className="px-3 py-2">{r.unidad || (r.primer_detalle && r.primer_detalle.cargo && r.primer_detalle.cargo.unidad) || r.unidad_id || "-"}</td>
                  <td className="px-3 py-2">{r.medio}</td>
                  <td className="px-3 py-2">{r.estado}</td>
                  <td className="px-3 py-2">
                    {Number(r.monto || 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {r.documento && (
                          <button className="btn" onClick={() => onDescargar(r)} disabled={pendingActions[r.id] && pendingActions[r.id] !== 'descargar'}>
                            {pendingActions[r.id] === 'descargar' ? (
                              <span className="inline-flex items-center gap-2">
                                <svg className="w-4 h-4 animate-spin text-current" viewBox="0 0 24 24" fill="none" aria-hidden>
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
                                </svg>
                                Descargando…
                              </span>
                            ) : (
                              "Descargar"
                            )}
                          </button>
                        )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                        {r.estado !== "ANULADO" && (
                          <button
                            className="btn btn-danger"
                            onClick={() => onAnular(r)}
                            disabled={pendingActions[r.id] && pendingActions[r.id] !== 'anular'}
                          >
                            {pendingActions[r.id] === 'anular' ? (
                              <span className="inline-flex items-center gap-2">
                                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
                                </svg>
                                Anulando…
                              </span>
                            ) : (
                              "Anular"
                            )}
                          </button>
                        )}

                        {r.medio === "QR" && r.estado !== "APROBADO" && (
                          <button className="btn" onClick={() => abrirQr(r)} disabled={pendingActions[r.id] && pendingActions[r.id] !== 'abrir'}>
                            {pendingActions[r.id] === 'abrir' ? (
                              <span className="inline-flex items-center gap-2">
                                <svg className="w-4 h-4 animate-spin text-current" viewBox="0 0 24 24" fill="none" aria-hidden>
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
                                </svg>
                                Generando…
                              </span>
                            ) : (
                              "Abrir QR"
                            )}
                          </button>
                        )}
                        
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td className="px-3 py-2" colSpan={5}>
                <strong>Total</strong>
              </td>
              <td className="px-3 py-2">
                <strong>{total.toFixed(2)}</strong>
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      {/* Modal QR */}
      {qrOpen && qrPago && (
        <QrPayModal
          pago={qrPago}
          pagoId={qrPago?.id}
          intentoId={qrIntentoId}
          onClose={() => {
            setQrOpen(false);
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
              setQrOpen(false);
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
