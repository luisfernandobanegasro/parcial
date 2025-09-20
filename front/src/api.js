const API_URL = "http://127.0.0.1:8000";

export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Credenciales inválidas");
  }
  return res.json(); // { access, refresh }
}

export async function getMe(accessToken) {
  const res = await fetch(`${API_URL}/api/me/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Token inválido o expirado");
  return res.json();
}

export async function refreshToken(refresh) {
  const res = await fetch(`${API_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error("No se pudo refrescar el token");
  return res.json(); // { access }
}
