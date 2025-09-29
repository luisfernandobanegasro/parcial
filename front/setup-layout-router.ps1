$ErrorActionPreference = "Stop"

function Backup-And-Write($path, $content) {
  $dir = Split-Path $path -Parent
  if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  if (Test-Path $path) { Copy-Item $path "$path.bak" -Force }
  $content | Set-Content -Path $path -Encoding UTF8
  Write-Host "✔ Escrito/actualizado: $path"
}

# 0) Verificaciones y deps
if (!(Test-Path "package.json")) { throw "Ejecuta este script en la carpeta FRONT (donde está package.json)." }

Write-Host "==> Asegurando react-router-dom..." -ForegroundColor Cyan
npm i react-router-dom

# 1) UI base (SidebarLink)
$SidebarLink = @"
import { NavLink } from "react-router-dom";

export default function SidebarLink({ to, icon, children, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          isActive ? "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"
        ].join(" ")
      }
    >
      {icon ? <span className="w-5 h-5">{icon}</span> : null}
      {!collapsed && <span className="truncate">{children}</span>}
    </NavLink>
  );
}
"@
Backup-And-Write "src\components\SidebarLink.jsx" $SidebarLink

# 2) Layout responsive (sidebar + topbar + dark mode)
$Layout = @"
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import SidebarLink from "../components/SidebarLink";

// Puedes reemplazar estos SVG por tus iconos favoritos
const IconMenu = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2"/></svg>;
const IconBuilding = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M7 21V9h10v12M7 9l5-6 5 6" stroke="currentColor" strokeWidth="2"/></svg>;
const IconUsers = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zM8 13c2.761 0 5 2.462 5 5.5V21H3v-2.5C3 15.462 5.239 13 8 13z" stroke="currentColor" strokeWidth="2"/></svg>;
const IconLogout = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2"/></svg>;
const IconSun = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M12 3v2m0 14v2M3 12H1m22 0h-2M5.64 5.64L4.22 4.22m15.56 15.56l-1.42-1.42M5.64 18.36L4.22 19.78m15.56-15.56l-1.42 1.42" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/></svg>;
const IconMoon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M20 15.5A8.38 8.38 0 0 1 12 21 8.5 8.5 0 0 1 12 4a8.38 8.38 0 0 1 8 6.5" stroke="currentColor" strokeWidth="2"/></svg>;

export default function Layout() {
  const [open, setOpen] = useState(false);      // drawer mobile
  const [collapsed, setCollapsed] = useState(false); // sidebar desktop

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.toggle("dark");
    localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
  };

  const logout = () => {
    localStorage.removeItem("tokens");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[auto,1fr] bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className={[
        "bg-white/80 dark:bg-gray-900/80 backdrop-blur border-r border-gray-200 dark:border-gray-800",
        "fixed inset-y-0 left-0 w-72 transform transition-all lg:static",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-20" : ""
      ].join(" ")}>
        <div className="h-16 flex items-center gap-2 px-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600" />
          {!collapsed && <span className="font-semibold">Condominio</span>}
        </div>
        <nav className="px-2 space-y-1">
          <SidebarLink to="/" icon={<IconBuilding />} collapsed={collapsed} onNavigate={()=>setOpen(false)}>Dashboard</SidebarLink>
          <SidebarLink to="/condominios" icon={<IconBuilding />} collapsed={collapsed} onNavigate={()=>setOpen(false)}>Condominios</SidebarLink>
          <SidebarLink to="/usuarios" icon={<IconUsers />} collapsed={collapsed} onNavigate={()=>setOpen(false)}>Usuarios</SidebarLink>
        </nav>
        <div className="absolute bottom-0 w-full p-3 flex items-center gap-2">
          <button className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" onClick={toggleTheme}>
            <span className="hidden dark:block"><IconSun /></span>
            <span className="dark:hidden"><IconMoon /></span>
            {!collapsed && <span>Tema</span>}
          </button>
          <button className="rounded-lg px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2" onClick={logout}>
            <IconLogout /> {!collapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="min-h-screen">
        {/* Topbar */}
        <header className="h-16 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur flex items-center gap-3 px-4">
          <button className="lg:hidden border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2" onClick={()=>setOpen(true)}>
            <IconMenu />
          </button>
          <button className="hidden lg:inline-flex border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2" onClick={()=>setCollapsed(!collapsed)}>
            <IconMenu /><span className="hidden xl:inline ml-2">Contraer</span>
          </button>
          <h1 className="text-lg font-semibold">Mi Dashboard</h1>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Backdrop mobile */}
      {open && <div onClick={()=>setOpen(false)} className="fixed inset-0 bg-black/30 lg:hidden" />}
    </div>
  );
}
"@
Backup-And-Write "src\layout\Layout.jsx" $Layout

# 3) ProtectedRoute (usa tokens.access en localStorage)
$ProtectedRoute = @"
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const tokens = JSON.parse(localStorage.getItem("tokens") || "null");
  const isAuthenticated = Boolean(tokens?.access);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
"@
Backup-And-Write "src\router\ProtectedRoute.jsx" $ProtectedRoute
# 4) AppRouter (rutas + Layout + páginas demo)
$AppRouter = @'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../layout/Layout";
import Dashboard from "../pages/Dashboard";
import CondominiosPage from "../pages/Condominios/CondominiosPage";
import UsuariosPage from "../pages/Usuarios/UsuariosPage";
import Login from "../pages/Login"; // Usa tu login real. Si no existe, el script crea un placeholder.

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="condominios" element={<CondominiosPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
'@
Backup-And-Write "src\router\AppRouter.jsx" $AppRouter

# 5) Páginas mínimas (si no existen, crea placeholders)
if (!(Test-Path "src\pages\Dashboard.jsx")) {
  $Dashboard = @'
export default function Dashboard() {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-sm text-gray-500">Condominios</p>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-sm text-gray-500">Usuarios</p>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-sm text-gray-500">Pagos</p>
          <p className="text-3xl font-bold">—</p>
        </div>
      </div>
    </section>
  );
}
'@
  Backup-And-Write "src\pages\Dashboard.jsx" $Dashboard
}

if (!(Test-Path "src\pages\Condominios\CondominiosPage.jsx")) {
  $CondoPage = @'
export default function CondominiosPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Condominios</h2>
        <button className="rounded-lg px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">Nuevo</button>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <p className="text-gray-500">Conecta aquí tu tabla real (React Query + API).</p>
      </div>
    </section>
  );
}
'@
  Backup-And-Write "src\pages\Condominios\CondominiosPage.jsx" $CondoPage
}

if (!(Test-Path "src\pages\Usuarios\UsuariosPage.jsx")) {
  $UsersPage = @'
export default function UsuariosPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Usuarios</h2>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <p className="text-gray-500">Listado de usuarios (pendiente de API).</p>
      </div>
    </section>
  );
}
'@
  Backup-And-Write "src\pages\Usuarios\UsuariosPage.jsx" $UsersPage
}

# 6) Login placeholder si no existe (para probar rápido)
if (!(Test-Path "src\pages\Login.jsx")) {
  $Login = @'
import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const doLogin = async (e) => {
    e.preventDefault();
    // Placeholder: guarda un access token falso.
    // Sustituye por tu llamada real a /api/auth/token/
    localStorage.setItem("tokens", JSON.stringify({ access: "demo", refresh: "demo" }));
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={doLogin} className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        <div>
          <label className="text-sm text-gray-600 dark:text-gray-300">Usuario</label>
          <input className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900"
            value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600 dark:text-gray-300">Contraseña</label>
          <input type="password" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900"
            value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button className="w-full rounded-lg px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">Entrar</button>
      </form>
    </div>
  );
}
'@
  Backup-And-Write "src\pages\Login.jsx" $Login
}

# 7) Asegurar import del router en index.{js,jsx,tsx}
$entries = @("src\index.js","src\index.jsx","src\index.tsx") | Where-Object { Test-Path $_ }
if ($entries.Count -eq 0) {
  Write-Host "⚠ No se encontró src/index.(js|jsx|tsx). Ajusta manualmente para montar <AppRouter />." -ForegroundColor Yellow
} else {
  foreach ($e in $entries) {
    $content = @'
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/tw.css";
import AppRouter from "./router/AppRouter";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><AppRouter /></React.StrictMode>);
'@
    Backup-And-Write $e $content
  }
}

Write-Host "`n✅ Layout responsive + Router listos. Ejecuta: npm start" -ForegroundColor Green
