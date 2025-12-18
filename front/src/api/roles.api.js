// src/api/roles.api.js
import { api } from "./api";

// ------- ROLES (tu CRUD actual) -------
const list   = async () => (await api.get("/roles/"))?.results || [];
const create = async (name) => api.post("/roles/", { name });
const rename = async (id, name) => api.patch(`/roles/${id}/`, { name });
const remove = async (id) => api.del(`/roles/${id}/`);

// ------- PERMISOS (catálogo global) -------
const listPermissions  = async () => (await api.get("/roles/permisos/")) || [];
const syncPermissions  = async () => api.post("/roles/permisos/sync/", {});
const createPermission = async ({ name, codename, app_label, model }) =>
  api.post("/roles/permisos/", { name, codename, app_label, model });
const deletePermission = async (permId) =>
  api.del(`/roles/permisos/${permId}/`);

// ------- PERMISOS ↔ GRUPO -------
// Nota: el backend aceptará tanto un id de auth_group como un id de tu tabla roles.
// Si recibe un id de roles, resolve automáticamente al Group homónimo (creándolo si no existe)
const listGroupPermissions = async (groupOrRoleId) =>
  (await api.get(`/roles/${groupOrRoleId}/permisos/`)) || [];

const addPermissionToGroup = async (groupOrRoleId, permId) =>
  api.post(`/roles/${groupOrRoleId}/permisos/${permId}/`, {});

const removePermissionFromGroup = async (groupOrRoleId, permId) =>
  api.del(`/roles/${groupOrRoleId}/permisos/${permId}/`);

// ------- ROLES ↔ USUARIOS (lo que ya tenías) -------
const listByUsuario = async (userId) => {
  try { return (await api.get(`/roles/usuarios/${userId}/roles/`)) || []; } catch {}
  try { return (await api.get(`/usuarios/${userId}/roles/`)) || []; } catch {}
  return (await api.get("/roles/", { usuario: userId })) || [];
};
const addToUsuario = async (userId, roleId) => {
  try { return await api.post(`/roles/usuarios/${userId}/roles/`, { role_id: roleId }); } catch {}
  try { return await api.post(`/usuarios/${userId}/roles/`, { role_id: roleId }); } catch {}
  try { return await api.post(`/roles/${roleId}/usuarios/`, { user_id: userId }); } catch {}
  return await api.post(`/usuarios/${userId}/roles/${roleId}/`, {});
};
const removeFromUsuario = async (userId, roleId) => {
  try { return await api.del(`/roles/usuarios/${userId}/roles/${roleId}/`); } catch {}
  try { return await api.del(`/usuarios/${userId}/roles/${roleId}/`); } catch {}
  return await api.del(`/roles/${roleId}/usuarios/`, { user_id: userId });
};

export const RolesAPI = {
  // roles
  list, create, rename, remove,
  // permisos catálogo
  listPermissions, syncPermissions, createPermission, deletePermission,
  // permisos por grupo (o por tu rol resolviendo al Group)
  listGroupPermissions, addPermissionToGroup, removePermissionFromGroup,
  // roles por usuario
  listByUsuario, addToUsuario, removeFromUsuario,
};
export default RolesAPI;
