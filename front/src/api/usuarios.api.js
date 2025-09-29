import { api } from "./api";

export const UsuariosAPI = {
  // 👇 api.get espera el objeto plano de params; nada de { params: {...} }
  list: (params = {}) => api.get("/usuarios/", { page_size: 20, ...params }),
  create: (data) => api.post("/usuarios/", data),
  update: (id, data) => api.patch(`/usuarios/${id}/`, data),
  remove: (id) => api.del(`/usuarios/${id}/`),
};
