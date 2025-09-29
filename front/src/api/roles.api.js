// src/api/roles.api.js
import { api, unwrapList } from "./api";

export const RolesAPI = {
  async list(params = {}) {
    const data = await api.get("/roles/", params);
    return unwrapList(data);                // <-- SIEMPRE array
  },

  async create(name) {
    return api.post("/roles/", { name });
  },

  async rename(id, newName) {
    return api.patch(`/roles/${id}/`, { name: newName });
  },

  async remove(id) {
    return api.delete(`/roles/${id}/`);
  },

  // ---- Permisos catálogo ----
  async listPermissions(params = {}) {
    const data = await api.get("/roles/permisos/", params);
    return unwrapList(data);                // <-- array
  },

  async createPermission(payload) {
    return api.post("/roles/permisos/", payload);
  },

  async deletePermission(id) {
    return api.delete(`/roles/permisos/${id}/`);
  },

  async syncPermissions() {
    // si tu backend expone POST /roles/permisos/sync/; si es distinto, ajusta aquí
    return api.post("/roles/permisos/sync/", {});
  },

  // ---- Permisos por rol (grupo) ----
  async listGroupPermissions(groupId, params = {}) {
    const data = await api.get(`/roles/${groupId}/permisos/`, params);
    return unwrapList(data);                // <-- array
  },

  async addPermissionToGroup(groupId, permId) {
    return api.post(`/roles/${groupId}/permisos/`, { permission_id: permId });
  },

  async removePermissionFromGroup(groupId, permId) {
    return api.delete(`/roles/${groupId}/permisos/${permId}/`);
  },
};
