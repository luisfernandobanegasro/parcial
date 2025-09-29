// src/api/stats.api.js
import { api } from "./api";

// Endpoints *relativos* (NUNCA antepongas BASE aquí)
const E = {
  condominios: "/propiedades/condominios/",
  usuarios: "/usuarios/",
  pagos: "/finanzas/pagos/",
};

// Cada función hace un GET simple y devuelve count seguro
export async function getCondominiosCount() {
  // Ojo: el 2do argumento de api.get SON LOS PARAMS, no { params: ... }
  const data = await api.get(E.condominios, { page: 1 });
  return data?.count ?? (Array.isArray(data) ? data.length : 0);
}

export async function getUsuariosCount() {
  const data = await api.get(E.usuarios, { page: 1 });
  return data?.count ?? (Array.isArray(data) ? data.length : 0);
}

export async function getPagosCount() {
  const data = await api.get(E.pagos, { page: 1 });
  return data?.count ?? (Array.isArray(data) ? data.length : 0);
}
