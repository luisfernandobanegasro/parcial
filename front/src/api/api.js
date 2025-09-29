// src/api/api.js

/** =======================
 * Base URL (CRA / Vite) con fallbacks + auto-/api
 * ======================= */
const VITE = (typeof import.meta !== "undefined" && import.meta.env) || {};
let BASE =
  VITE.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_API_URL ||
  "";

if (!BASE) {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  BASE = (host === "localhost" || host === "127.0.0.1")
    ? "http://localhost:8000"
    : "";
}

BASE = BASE.replace(/\/$/, "");
if (!/\/api$/i.test(BASE)) BASE = `${BASE}/api`;

/** =======================
 * Endpoints relativos a BASE
 * ======================= */
const endpoints = {
  token:   "/auth/token/",
  refresh: "/auth/refresh/",
  me:      "/users/me/",
};

/** =======================
 * Tokens
 * ======================= */
const store = {
  get access()  { return localStorage.getItem("access"); },
  get refresh() { return localStorage.getItem("refresh"); },
  setTokens({ access, refresh }) {
    if (access)  localStorage.setItem("access", access);
    if (refresh) localStorage.setItem("refresh", refresh);
  },
  clear() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  },
};

function authHeaders(auth = true) {
  const h = { "Content-Type": "application/json" };
  if (auth && store.access) h.Authorization = `Bearer ${store.access}`;
  return h;
}

/** Helpers de query */
function buildQuery(params) {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.append(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/** =======================
 * Core HTTP (fetch) con refresh automático
 * ======================= */
async function http(path, { method = "GET", body, auth = true, params, headers } = {}) {
  const url = `${BASE}${path}${buildQuery(params)}`;
  let h = { ...authHeaders(auth), ...(headers || {}) };

  let res = await fetch(url, {
    method,
    headers: h,
    body: ["POST", "PUT", "PATCH"].includes(method) ? JSON.stringify(body ?? {}) : undefined,
    mode: "cors",
  });

  // Refresh si 401 y tenemos refresh
  if (res.status === 401 && auth && store.refresh) {
    const r = await fetch(`${BASE}${endpoints.refresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: store.refresh }),
      mode: "cors",
    });
    if (r.ok) {
      const { access } = await r.json();
      store.setTokens({ access, refresh: store.refresh });

      h = { ...authHeaders(auth), ...(headers || {}) };
      res = await fetch(url, {
        method,
        headers: h,
        body: ["POST", "PUT", "PATCH"].includes(method) ? JSON.stringify(body ?? {}) : undefined,
        mode: "cors",
      });
    } else {
      store.clear();
      throw new Error("Sesión expirada. Inicia sesión nuevamente.");
    }
  }

  if (!res.ok) throw await toError(res);
  return parse(res);
}

async function toError(res) {
  let msg = `HTTP ${res.status}`;
  let payload = null;
  try {
    payload = await res.clone().json();
    msg =
      payload?.detail ||
      payload?.message ||
      payload?.error ||
      (Array.isArray(payload?.non_field_errors) ? payload.non_field_errors[0] : msg) ||
      JSON.stringify(payload);
  } catch {
    try { msg = await res.clone().text(); } catch {}
  }
  const err = new Error(msg);
  err.status = res.status;
  err.response = { data: payload, status: res.status };
  return err;
}

async function parse(res) {
  if (res.status === 204) return null;
  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

/** =======================
 * Auth helpers
 * ======================= */
export async function login(arg1, arg2) {
  const payload =
    typeof arg1 === "object" && arg1 !== null
      ? { username: arg1.username, password: arg1.password }
      : { username: arg1, password: arg2 };

  if (!payload.username || !payload.password) {
    throw new Error("Usuario y contraseña son requeridos");
  }

  const data = await http(endpoints.token, { method: "POST", body: payload, auth: false });
  store.setTokens(data);
  return data;
}

export async function getMe() {
  return http(endpoints.me);
}

export function clearTokens() {
  store.clear();
}

/** =======================
 * Cliente CRUD genérico
 *  - Soporta api.get(path, { params })
 *  - O api.get(path, { q:..., page:... }) (lo trata como params igual)
 * ======================= */
export const api = {
  get: (path, opts = {}) =>
    http(path, { method: "GET", params: opts.params ?? opts }),

  post: (path, body, opts = {}) =>
    http(path, { method: "POST", body, ...(opts || {}) }),

  put: (path, body, opts = {}) =>
    http(path, { method: "PUT", body, ...(opts || {}) }),

  patch: (path, body, opts = {}) =>
    http(path, { method: "PATCH", body, ...(opts || {}) }),

  del: (path, opts = {}) =>
    http(path, { method: "DELETE", params: opts.params ?? opts }),
};

export { endpoints, store, BASE };
