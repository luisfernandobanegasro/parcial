import React, { useState } from "react";
import { login, getMe } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access, refresh } = await login(username, password);
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      const me = await getMe(access);
      onLogin(me);
    } catch (err) {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow p-4" style={{ maxWidth: 380, width: "100%" }}>
        <h4 className="mb-3 text-center">Iniciar sesión</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <input className="form-control" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </form>
      </div>
    </div>
  );
}
