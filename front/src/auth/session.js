// src/auth/session.js

const KEY = "session_cache_v1";

/** Lee la caché de sesión desde localStorage. */
export function getCachedSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { loaded: false, user: null, roles: [] };
    const parsed = JSON.parse(raw);
    return { loaded: true, ...parsed };
  } catch {
    return { loaded: false, user: null, roles: [] };
  }
}

/** Guarda en caché { user, roles }. */
export function setCachedSession({ user, roles }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ user, roles }));
  } catch {
    // ignorar errores de cuota
  }
}

/** Limpia la caché de sesión (usar en Logout / antes de Login). */
export function clearCachedSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
