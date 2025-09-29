// src/pages/Finanzas/RegistrarPago.jsx
import React, { useState } from "react";
import { FinanzasAPI } from "../../api/finanzas.api";
import { api } from "../../api/api";
import QrPayModal from "./QrPayModal";
import { toast } from "react-toastify";

export default function RegistrarPago() {
  const [unidadId, setUnidadId] = useState("");
  const [loading, setLoading] = useState(false);
  const [filas, setFilas] = useState([]);
  const [medio, setMedio] = useState("EFECTIVO");
  const [mensaje, setMensaje] = useState("");

  // estado para QR
  const [pagoCreado, setPagoCreado] = useState(null);
  const [intentoId, setIntentoId] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const fetchEstado = async (uid) => {
    if (!uid) return;
    setLoading(true);
    setMensaje("");
    try {
      const data = await api.get(`/finanzas/estados/unidad/${uid}/`, {
        estado: "PENDIENTE",
        page_size: 1000,
      });
      const items = data?.results || data || [];
      const rows = items
        .filter((r) => r.estado_calculado !== "PAGADO")
        .map((r) => ({
          cargo: r.cargo_id,
          concepto: r.concepto_id,
          periodo: r.periodo,
          monto: Number(r.monto),
          recargo: Number(r.recargo || 0),
          pagado: Number(r.pagado || 0),
          saldo:
            Number(
              r.saldo ||
                (Number(r.monto) + Number(r.recargo || 0) - Number(r.pagado || 0))
            ),
          selected: true,
          aPagar: Number(r.saldo || 0),
        }));
      setFilas(rows);
    } catch (e) {
      console.error(e);
      setMensaje(e?.message || "No se pudo obtener el estado (verifica token/API)");
      setFilas([]);
    } finally {
      setLoading(false);
    }
  };

  const totalSeleccionado = filas
    .filter((f) => f.selected)
    .reduce((acc, f) => acc + (Number(f.aPagar) || 0), 0);

  const downloadDocumento = async (documentoId) => {
    if (!documentoId) return;
    try {
      await api.openAuth(`/finanzas/documentos/${documentoId}/descargar/`, { inline: false });
    } catch (e) {
      console.error(e);
      toast.error("No se pudo descargar el comprobante");
    }
  };

  const handleQrApproved = async (docId) => {
    try {
      toast.success("Pago QR aprobado");
      await downloadDocumento(docId);
    } finally {
      setShowQR(false);
      setPagoCreado(null);
      setIntentoId(null);
      if (unidadId) fetchEstado(unidadId);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    const detalles = filas
      .filter((f) => f.selected && f.aPagar > 0)
      .map((f) => ({ cargo: f.cargo, monto_aplicado: f.aPagar }));

    if (!unidadId || detalles.length === 0) {
      setMensaje("Selecciona al menos un cargo con monto > 0");
      return;
    }

    try {
      setLoading(true);

      const pago = await FinanzasAPI.pagos.registrar({
        unidad_id: parseInt(unidadId, 10),
        medio,
        moneda: "BOB",
        detalles,
        generar_documento: true,
        tipo_documento: "RECIBO",
      });

      setMensaje(`Pago registrado. ID: ${pago.id}, Total: ${pago.monto}`);

      if (medio === "EFECTIVO") {
        toast.success("Pago en efectivo asentado");
        if (pago.documento) await downloadDocumento(pago.documento);
        if (unidadId) fetchEstado(unidadId);
        return;
      }

      if (medio === "TRANSFERENCIA") {
        toast.info("Transferencia registrada en PENDIENTE. Aséntala cuando verifiques el depósito.");
        if (unidadId) fetchEstado(unidadId);
        return;
      }

      if (medio === "QR") {
        try {
          const r = await api.post(`/finanzas/pagos/${pago.id}/iniciar_qr/`, {});
          setPagoCreado(pago);
          setIntentoId(r?.intento_id || null);
          setShowQR(true);
        } catch (err) {
          console.error(err);
          toast.error(err?.message || "No se pudo iniciar el QR");
        }
        return;
      }

      if (medio === "TARJETA" || medio === "BILLETERA") {
        toast.info("Pasarela no configurada aún.");
        return;
      }
    } catch (e2) {
      console.error(e2);
      setMensaje(e2?.message || "Error al registrar pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Registrar pago (manual)</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-sm">Unidad ID</label>
            <input
              className="border px-3 py-2 rounded w-40"
              value={unidadId}
              onChange={(e) => setUnidadId(e.target.value)}
              placeholder="Ej: 1"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchEstado(unidadId)}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={!unidadId || loading}
          >
            {loading ? "Cargando..." : "Cargar cargos"}
          </button>

          <div className="ml-auto">
            <label className="block text-sm">Medio</label>
            <select
              className="border px-3 py-2 rounded"
              value={medio}
              onChange={(e) => setMedio(e.target.value)}
            >
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="QR">QR</option>
              <option value="TARJETA">TARJETA</option>
              <option value="BILLETERA">BILLETERA</option>
            </select>
          </div>
        </div>

        {mensaje && <div className="p-2 bg-yellow-100 border rounded">{mensaje}</div>}

        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2">Sel</th>
                <th className="p-2">Cargo ID</th>
                <th className="p-2">Periodo</th>
                <th className="p-2">Monto</th>
                <th className="p-2">Recargo</th>
                <th className="p-2">Pagado</th>
                <th className="p-2">Saldo</th>
                <th className="p-2">A pagar</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, idx) => (
                <tr key={f.cargo} className="border-t">
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={f.selected}
                      onChange={(e) => {
                        const v = e.target.checked;
                        setFilas((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, selected: v } : x))
                        );
                      }}
                    />
                  </td>
                  <td className="p-2">{f.cargo}</td>
                  <td className="p-2">{f.periodo}</td>
                  <td className="p-2">{f.monto.toFixed(2)}</td>
                  <td className="p-2">{f.recargo.toFixed(2)}</td>
                  <td className="p-2">{f.pagado.toFixed(2)}</td>
                  <td className="p-2 font-semibold">{f.saldo.toFixed(2)}</td>
                  <td className="p-2">
                    <input
                      className="border px-2 py-1 rounded w-28 text-right"
                      type="number"
                      step="0.01"
                      min="0"
                      max={f.saldo}
                      value={f.aPagar}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value || 0);
                        setFilas((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, aPagar: v } : x))
                        );
                      }}
                    />
                  </td>
                </tr>
              ))}
              {filas.length === 0 && !loading && (
                <tr>
                  <td className="p-4 text-center" colSpan={8}>
                    Sin cargos
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t">
                <td colSpan={6} className="p-2 text-right font-semibold">
                  Total a pagar:
                </td>
                <td colSpan={2} className="p-2 font-bold">
                  {totalSeleccionado.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded bg-green-600 text-white disabled:opacity-50"
            disabled={loading || filas.filter((f) => f.selected && f.aPagar > 0).length === 0}
          >
            Registrar pago
          </button>
        </div>
      </form>

      {/* Modal de QR */}
      {showQR && pagoCreado && (
        <QrPayModal
          pago={pagoCreado}
          pagoId={pagoCreado?.id}
          intentoId={intentoId}
          onClose={() => {
            setShowQR(false);
            setPagoCreado(null);
            setIntentoId(null);
          }}
          onApproved={(docId) => handleQrApproved(docId)}
        />
      )}
    </div>
  );
}
