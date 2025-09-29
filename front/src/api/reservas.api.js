// src/api/reservas.api.js
import { api } from "./api";

const listAreas = (params = {}) => api.get("/reservas/areas/", params);
const createArea = (payload) => api.post("/reservas/areas/", payload);
const updateArea = (id, payload) => api.patch(`/reservas/areas/${id}/`, payload);
const deleteArea = (id) => api.del(`/reservas/areas/${id}/`);
const disponibilidad = (areaId, params) => api.get(`/reservas/areas/${areaId}/disponibilidad/`, params);

const listReservas = (params = {}) => api.get("/reservas/reservas/", params);
const createReserva = (payload) => api.post("/reservas/reservas/", payload);
const updateReserva = (id, payload) => api.patch(`/reservas/reservas/${id}/`, payload);
const deleteReserva = (id) => api.del(`/reservas/reservas/${id}/`);

const confirmar = (id) => api.patch(`/reservas/reservas/${id}/confirmar/`, {});
const rechazar = (id) => api.patch(`/reservas/reservas/${id}/rechazar/`, {});
const cancelar = (id) => api.patch(`/reservas/reservas/${id}/cancelar/`, {});

export const ReservasAPI = {
  areas: { list: listAreas, create: createArea, update: updateArea, remove: deleteArea, disponibilidad },
  reservas: { list: listReservas, create: createReserva, update: updateReserva, remove: deleteReserva, confirmar, rechazar, cancelar },
};
export default ReservasAPI;
