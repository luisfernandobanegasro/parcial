// src/api/finanzas.api.js
import { api } from "./api";

export const FinanzasAPI = {
  conceptos: {
    list:   (params = {}) => api.get("/finanzas/conceptos/", params),
    create: (body)        => api.post("/finanzas/conceptos/", body),
    update: (id, body)    => api.patch(`/finanzas/conceptos/${id}/`, body),
    remove: (id)          => api.del(`/finanzas/conceptos/${id}/`),
  },

  cargos: {
    list:   (params = {}) => api.get("/finanzas/cargos/", params),
    create: (body)        => api.post("/finanzas/cargos/", body),
    update: (id, body)    => api.patch(`/finanzas/cargos/${id}/`, body),
    remove: (id)          => api.del(`/finanzas/cargos/${id}/`),
  },

  pagos: {
    list:       (params = {}) => api.get("/finanzas/pagos/", params),
    create:     (body)        => api.post("/finanzas/pagos/", body),
    update:     (id, body)    => api.patch(`/finanzas/pagos/${id}/`, body),
    remove:     (id)          => api.del(`/finanzas/pagos/${id}/`),
    asentar:    (id)          => api.patch(`/finanzas/pagos/${id}/asentar/`, {}),
    anular:     (id)          => api.patch(`/finanzas/pagos/${id}/anular/`, {}),
    addDetalle: (body)        => api.post("/finanzas/pagos-detalle/", body),
    delDetalle: (id)          => api.del(`/finanzas/pagos-detalle/${id}/`),
    registrar:  (body)        => api.post("/finanzas/pagos/registrar/", body),

    // NUEVOS:
    iniciarQR:        (pagoId)   => api.post(`/finanzas/pagos/${pagoId}/iniciar_qr/`),
    pasarelaRedirect: (pagoId)   => api.post(`/finanzas/pagos/${pagoId}/pasarela_redirect/`),
    intentoEstado:    (intentoId)=> api.get(`/finanzas/pagos-intentos/${intentoId}/estado/`),
  },

  documentos: {
    list:   (params = {}) => api.get("/finanzas/documentos/", params),
    create: (body)        => api.post("/finanzas/documentos/", body),
  },

  archivos: {
    list:   (params = {}) => api.get("/finanzas/documentos-archivos/", params),
    create: (body)        => api.post("/finanzas/documentos-archivos/", body),
    remove: (id)          => api.del(`/finanzas/documentos-archivos/${id}/`),
  },

  intentos: {
    list:   (params = {}) => api.get("/finanzas/pagos-intentos/", params),
    create: (body)        => api.post("/finanzas/pagos-intentos/", body),
  },

  reembolsos: {
    list:   (params = {}) => api.get("/finanzas/reembolsos/", params),
    create: (body)        => api.post("/finanzas/reembolsos/", body),
  },

  estadoCuentaUnidad: (unidad_id, params = {}) =>
    api.get(`/finanzas/estados/unidad/${unidad_id}/`, params),
};
