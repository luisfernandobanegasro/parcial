// src/pages/Finanzas/QrPayModal.jsx
import { useEffect, useRef, useState } from "react";
import { api } from "../../api/api";
import { toast } from "react-toastify";

export default function QrPayModal({ pago, pagoId, intentoId, onClose, onApproved }) {
  const [qrUrl, setQrUrl] = useState("");
  const [loadingQR, setLoadingQR] = useState(true);
  const [estado, setEstado] = useState("PENDIENTE");
  const urlRef = useRef("");
  const [submitting, setSubmitting] = useState(false);

  // Cargar PNG del QR
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingQR(true);
      try {
  if (!pagoId || !intentoId) return;
  // Traer PNG protegido (con token) desde el recurso de PagoIntento
  const { blob } = await api.getBlob(`/finanzas/pagointentos/${intentoId}/qr.png/`);
        const objUrl = URL.createObjectURL(blob);
        urlRef.current = objUrl;
        if (!cancelled) setQrUrl(objUrl);
      } catch (e) {
        console.error(e);
        if (!cancelled) toast.error("No se pudo generar el QR");
      } finally {
        if (!cancelled) setLoadingQR(false);
      }
    })();

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = "";
      }
    };
  }, [pagoId, intentoId]);

  // Polling del estado del intento (cada 2s)
  useEffect(() => {
    if (!intentoId) return;
    const t = setInterval(async () => {
      try {
  const r = await api.get(`/finanzas/pagointentos/${intentoId}/estado/`);
        const estInt = r?.estado_intento || r?.estado || null;
        const estPago = r?.estado_pago || null;
        if (estInt) setEstado(estInt);
        if (estPago === "APROBADO") {
          clearInterval(t);
          // Aprobado por otro flujo (p. ej. webhook). No sabemos documento; cerramos y refrescamos.
          toast.success("Pago QR aprobado.");
          if (onApproved) onApproved(null);
        }
      } catch (e) {
        // si no existe aún la ruta/permiso no spammeamos error
        console.debug("poll estado intento:", e?.response?.status || e?.message);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [intentoId, onApproved]);

  // Botón de simulación (FAKE): aprueba el intento y el pago en backend
  async function aprobarAhora() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const r = await api.post(`/finanzas/pagos/${pagoId}/validar_qr/`, { intento_id: intentoId });
      const docId = r?.documento_id || r?.documento || (r?.data && r.data.documento_id) || null;
      toast.success("Pago aprobado (simulado).");
      if (docId) {
        // Intentar descargar comprobante automáticamente
        try {
          await api.openAuth(`/finanzas/documentos/${docId}/descargar/`, { inline: false });
        } catch (e) {
          console.debug("No se pudo descargar comprobante automáticamente", e);
        }
      }
      if (onApproved) onApproved(docId);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo aprobar (fake) el pago");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white dark:bg-gray-900 border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Paga con QR</h4>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="text-sm text-gray-600">
          Pago <b>#{pagoId}</b> — Total: <b>{Number(pago?.monto || 0).toFixed(2)} {pago?.documento?.moneda || "BOB"}</b>
        </div>

        <div className="min-h-[220px] flex items-center justify-center border rounded">
          {loadingQR ? (
            <div className="py-12 text-gray-500">Generando QR…</div>
          ) : qrUrl ? (
            <img
              src={qrUrl}
              alt="QR de pago"
              className="w-[220px] h-[220px] object-contain"
            />
          ) : (
            <div className="py-12 text-red-500">No se pudo generar el QR</div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            Estado: <b>{estado || "PENDIENTE"}</b>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={onClose} disabled={submitting}>Cerrar</button>
            <button className="btn btn-primary" onClick={aprobarAhora} disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
                  </svg>
                  Aprobando…
                </span>
              ) : (
                "Simular pago (aprobar)"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
