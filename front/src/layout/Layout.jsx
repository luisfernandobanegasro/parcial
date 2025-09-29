import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import SidebarMenu from "../components/SidebarMenu";
import { clearCachedSession } from "../auth/session";

const IconMenu = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const IconLogout = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const IconSun = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3v2m0 14v2M3 12H1m22 0h-2M5.64 5.64 4.22 4.22m15.56 15.56-1.42-1.42M5.64 18.36 4.22 19.78m15.56-15.56-1.42 1.42" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const IconMoon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 15.5A8.38 8.38 0 0 1 12 21 8.5 8.5 0 0 1 12 4a8.38 8.38 0 0 1 8 6.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default function Layout() {
  const [open, setOpen] = useState(false);       // drawer móvil
  const [collapsed, setCollapsed] = useState(false); // colapso desktop
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "system");

  // tema
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effective = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
    if (effective === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : t === "light" ? "system" : "dark"));

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("tokens");
    clearCachedSession();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[auto,1fr] bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside
        className={[
          "bg-white/80 dark:bg-gray-900/80 backdrop-blur border-r border-gray-200 dark:border-gray-800",
          "fixed inset-y-0 left-0 w-72 transform transition-transform lg:static",
          "z-50 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-20" : "",
        ].join(" ")}
      >
        <div className="h-16 flex items-center gap-2 px-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600" aria-hidden="true" />
          {!collapsed && <span className="font-semibold">Condominio</span>}
        </div>

        <div className="flex-1 overflow-y-auto">
          <SidebarMenu collapsed={collapsed} onNavigate={() => setOpen(false)} />
        </div>

        <div className="p-3 flex items-center gap-2 border-t border-gray-200 dark:border-gray-800">
          <button
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
            onClick={toggleTheme}
            title="Cambiar tema"
          >
            {theme === "dark" ? <IconSun /> : theme === "light" ? <IconMoon /> : <IconSun />}
            {!collapsed && (
              <span>{theme === "dark" ? "Claro" : theme === "light" ? "Sistema" : "Oscuro"}</span>
            )}
          </button>

          <button
            className="rounded-lg px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            onClick={logout}
          >
            <IconLogout /> {!collapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Contenido */}
      {/* 👇 min-w-0 evita que el contenido “rompa” al reducir ancho/zoom */}
      <div className="min-h-screen min-w-0">
        <header className="h-16 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur flex items-center gap-3 px-4">
          <button
            className="lg:hidden border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <IconMenu />
          </button>

          <button
            className="hidden lg:inline-flex border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Contraer/expandir menú"
          >
            <IconMenu />
            <span className="hidden xl:inline ml-2">{collapsed ? "Expandir" : "Contraer"}</span>
          </button>

          <h1 className="text-lg font-semibold">Mi Dashboard</h1>
        </header>

        {/* overflow-x-hidden quita barras horizontales globales; cada tabla gestiona su propio scroll */}
        <main className="p-4 sm:p-6 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Backdrop móvil estable */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity duration-150",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onMouseDown={() => setOpen(false)}
      />
    </div>
  );
}
