// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { login, getMe } from "../api/api";
import { RolesAPI } from "../api/roles.api";
import { useStatsBusOptional } from "../context/StatsContext";
import { clearCachedSession, setCachedSession } from "../auth/session";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bump } = useStatsBusOptional();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, _global: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Ingresa tu usuario.";
    if (!form.password.trim()) e.password = "Ingresa tu contraseña.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      // Limpiar cualquier rastro de una sesión anterior
      clearCachedSession();

      // 1) Login → guarda tokens en localStorage (api.js ya lo hace)
      await login({ username: form.username, password: form.password });

      // 2) Precalentar caché de sesión para evitar rebotes
      let me = null;
      let roleList = [];
      try {
        me = await getMe(); // { auth: { groups:[...] } ...}
        const groupsFromMe = Array.isArray(me?.auth?.groups) ? me.auth.groups : null;
        if (groupsFromMe) {
          roleList = groupsFromMe.map((name, idx) => ({ id: idx + 1, name }));
        } else {
          roleList = (await RolesAPI.listByUsuario(me.id)) || [];
        }
        setCachedSession({ user: me, roles: roleList });
      } catch {
        // si falla, no bloquea: el hook useSession lo intentará
      }

      // 3) Notificar al Dashboard para que refresque KPIs si estuviera montado
      bump();

      // 4) Redirigir: a la ruta protegida de origen o al dashboard
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });

      toast.success("¡Bienvenido!");
    } catch (err) {
      const msg =
        err?.message ||
        err?.payload?.detail ||
        err?.payload?.error ||
        "No se pudo iniciar sesión";
      setErrors((prev) => ({ ...prev, _global: msg }));
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90">
      <div className="w-full max-w-md bg-neutral-900 text-white rounded-xl shadow-xl border border-neutral-800 p-6 relative">
        <h1 className="text-xl font-semibold mb-4">Iniciar sesión</h1>

        {errors._global && (
          <div className="mb-4 text-sm rounded-md border border-red-500/30 bg-red-500/10 text-red-200 px-3 py-2">
            {errors._global}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Usuario</label>
            <input
              name="username"
              type="text"
              autoComplete="username"
              className={`w-full rounded-lg px-3 py-2 bg-white text-black outline-none focus:ring-2 ${
                errors.username ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
              value={form.username}
              onChange={onChange}
              disabled={submitting}
              autoFocus
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-300">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">Contraseña</label>
            <div className="relative">
              <input
                name="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                className={`w-full rounded-lg px-3 py-2 pr-10 bg-white text-black outline-none focus:ring-2 ${
                  errors.password ? "focus:ring-red-500" : "focus:ring-blue-500"
                }`}
                value={form.password}
                onChange={onChange}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex={-1}
              >
                {showPwd ? (
                  // ojo tachado
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-10-7-10-7a19.8 19.8 0 014.5-5.5m3-2A10.05 10.05 0 0112 5c7 0 10 7 10 7a19.8 19.8 0 01-4.5 5.5m-3 2L3 3" />
                  </svg>
                ) : (
                  // ojo
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-300">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-lg px-4 py-2 bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center gap-2 ${
              submitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {submitting && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" />
              </svg>
            )}
            {submitting ? "Ingresando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
