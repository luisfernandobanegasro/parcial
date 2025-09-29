import { api } from "./api";

export const CondominiosAPI = {
  list: (params = {}) => api.get("/propiedades/condominios/", params),
  create: (body) => api.post("/propiedades/condominios/", body),
  retrieve: (id) => api.get(`/propiedades/condominios/${id}/`),
  update: (id, body) => api.put(`/propiedades/condominios/${id}/`, body),
  patch: (id, body) => api.patch(`/propiedades/condominios/${id}/`, body),
  remove: (id) => api.del(`/propiedades/condominios/${id}/`),
};
