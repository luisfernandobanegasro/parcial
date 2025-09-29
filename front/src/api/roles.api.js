// src/api/roles.api.js
import { api } from "./api";

export const RolesAPI = {
  // ROLES
  list:            () => api.get(`/roles/`),
  create:          (name) => api.post(`/roles/`, { name }),
  rename:          (id, name) => api.put(`/roles/${id}/`, { name }),
  remove:          (id) => api.del(`/roles/${id}/`),

  // ROLES POR USUARIO
  listByUsuario:   (usuarioId) => api.get(`/roles/usuarios/${usuarioId}/roles/`),
  addToUsuario:    (usuarioId, rolId) => api.post(`/roles/usuarios/${usuarioId}/roles/`, { rol_id: rolId }),
  removeFromUsuario:(usuarioId, rolId) => api.del(`/roles/usuarios/${usuarioId}/roles/${rolId}/`),

  // PERMISOS (catálogo + CRUD)
  listPermissions: (params = {}) => api.get(`/roles/permisos/`, params),
  syncPermissions: () => api.post(`/roles/permisos/sync/`),
  createPermission:(payload) => api.post(`/roles/permisos/crud/`, payload),
  updatePermission:(id, payload) => api.put(`/roles/permisos/crud/${id}/`, payload),
  deletePermission:(id) => api.del(`/roles/permisos/crud/${id}/`),

  // PERMISOS DE UN GRUPO
  listGroupPermissions:   (groupId) => api.get(`/roles/${groupId}/permisos/`),
  addPermissionToGroup:   (groupId, permissionId) => api.post(`/roles/${groupId}/permisos/`, { permission_id: permissionId }),
  removePermissionFromGroup:(groupId, permissionId) => api.del(`/roles/${groupId}/permisos/${permissionId}/`),
};
