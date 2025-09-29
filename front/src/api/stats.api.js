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

// Cache simple en memoria para evitar múltiples requests simultáneos
let _pagosCountCache = { value: null, ts: 0 };
const PAGOS_COUNT_TTL = 5000; // ms

export async function getPagosCount() {
  const now = Date.now();
  if (_pagosCountCache.value !== null && now - _pagosCountCache.ts < PAGOS_COUNT_TTL) {
    return _pagosCountCache.value;
  }
  const data = await api.get(E.pagos, { page: 1 });
  const count = data?.count ?? (Array.isArray(data) ? data.length : 0);
  _pagosCountCache = { value: count, ts: now };
  return count;
}
