import { api } from "./api";

export const PropiedadesAPI = {
  list:   (params = {})            => api.get("/propiedades/unidades/", params),
  create: (body)                    => api.post("/propiedades/unidades/", body),
  update: (id, body)                => api.patch(`/propiedades/unidades/${id}/`, body),
  remove: (id)                      => api.del(`/propiedades/unidades/${id}/`),

  // acción custom del ViewSet para asignar/quitar propietario
  setOwner: (id, body)              => api.post(`/propiedades/unidades/${id}/set_owner/`, body),
    

};
