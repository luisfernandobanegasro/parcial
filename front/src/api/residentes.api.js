// src/api/residentes.api.js
import { api } from "./api";

export const ResidentesAPI = {
  // lista residentes (realmente UsuarioUnidad)
  list: (params = {}) => api.get("/propiedades/usuarios-unidades/", params),

  // crea relación usuario ↔ unidad (alta residente)
  create: (data) => api.post("/propiedades/usuarios-unidades/", data),

  // actualiza relación (p.ej. dar de baja con fecha_fin)
  update: (id, data) => api.patch(`/propiedades/usuarios-unidades/${id}/`, data),

  // eliminar relación (opcional; yo prefiero fecha_fin)
  remove: (id) => api.del(`/propiedades/usuarios-unidades/${id}/`),
};
