// src/api/api.js
import axios from "axios";

// Base URL (incluye protocolo + host + puerto del backend)
export const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

// --- token store simple ---
export const store = {
  get token() {
    return (
      localStorage.getItem("access") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("access") ||
      ""
    );
  },
  set token(v) {
    if (v) localStorage.setItem("access", v);
    else localStorage.removeItem("access");
  },
  get access() { return this.token; },
  set access(v) { this.token = v; },
};

// Axios con baseURL y auth automática
const ax = axios.create({ baseURL: API_BASE, withCredentials: false });

ax.interceptors.request.use((config) => {
  const t = store.token;
  // debug token short (no exfiltrate in prod)
  try { if (t) console.debug('API request with token:', (t||'').slice(0,10) + '...'); } catch(e) {}
  if (t) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${t}` };
  }
  return config;
});

// Interceptor de respuestas: en 401 limpiamos tokens y forzamos re-login/recarga
ax.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      const status = err?.response?.status;
      if (status === 401) {
        console.warn('API: 401 Unauthorized - clearing tokens and redirecting to /login');
        try { localStorage.removeItem('access'); localStorage.removeItem('token'); sessionStorage.removeItem('access'); } catch (e) {}
        // Intentar redirigir al login (ajusta si tu ruta es diferente)
        try { window.location.href = '/login'; } catch (e) { window.location.reload(); }
      }
    } catch (e) {}
    return Promise.reject(err);
  }
);

// Prefijo /api
function withApiPrefix(path) {
  if (!path) return path;
  if (path.startsWith("/api/")) return path;
  if (path.startsWith("/")) return `/api${path}`;
  return `/api/${path}`;
}

// CRUD helpers (retornan data)
async function get(path, params = {}) {
  const res = await ax.get(withApiPrefix(path), { params });
  return res.data;
}
async function post(path, body) {
  const res = await ax.post(withApiPrefix(path), body);
  return res.data;
}
async function patch(path, body) {
  const res = await ax.patch(withApiPrefix(path), body);
  return res.data;
}
async function del(path) {
  const res = await ax.delete(withApiPrefix(path));
  return res.data;
}

// --- Descargar/abrir archivos con AUTH ---
function parseFilenameFromCD(cd) {
  if (!cd) return null;
  // Content-Disposition: attachment; filename="recibo_10.pdf"
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(cd);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Descarga un recurso protegido (auth) y lo devuelve como Blob + filename detectado.
 */
async function getBlob(path) {
  const res = await ax.get(withApiPrefix(path), { responseType: "blob" });
  const type = res.headers?.["content-type"] || "application/octet-stream";
  const blob = new Blob([res.data], { type });
  const filename = parseFilenameFromCD(res.headers?.["content-disposition"]);
  return { blob, filename };
}

/**
 * Abre un recurso protegido en una pestaña nueva (útil para PDFs).
 * Si `inline` es false, fuerza descarga.
 */
async function openAuth(path, { inline = true, filename } = {}) {
  const { blob, filename: detected } = await getBlob(path);
  const url = window.URL.createObjectURL(blob);

  if (inline) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || detected || "archivo";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const api = { get, post, patch, del, getBlob, openAuth };

export function unwrapList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

// Auth helpers
export async function login(a, b) {
  let username, password;
  if (typeof a === "object" && a !== null) {
    ({ username, password } = a);
  } else {
    username = a; password = b;
  }
  const data = await post("auth/token/", { username, password });
  const access = data?.access;
  if (access) store.token = access;
  try {
    console.debug(
      "api.login: access saved?",
      !!access,
      "store.access:",
      store.access ? store.access.slice(0, 10) + "..." : null
    );
  } catch {}
  return data;
}

export function clearTokens() {
  try {
    store.token = "";
    localStorage.removeItem("token");
    sessionStorage.removeItem("access");
  } catch {}
}

export function getAccess() {
  return store.access;
}

export async function getMe() {
  return await get("me/");
}

export default { API_BASE, store, api, unwrapList, login, getMe, clearTokens };
