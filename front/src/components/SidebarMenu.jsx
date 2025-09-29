// src/components/SidebarMenu.jsx
import { useEffect, useState } from "react";
import useSession from "../auth/useSession";
import SidebarLink from "./Sidebar"; // asumiendo que este es tu componente de link
import { ComunicacionAPI } from "../api/comunicacion.api";
import {
  Home,
  Users,
  Building2,
  IdCard,
  Wallet,
  MessageSquare,
  CalendarClock,
  Shield,
  Wrench,
} from "lucide-react";

export default function SidebarMenu({ collapsed, onNavigate }) {
  const { isSuper, hasAnyRole } = useSession();
  const canAdmin = isSuper || hasAnyRole(["Administrador"]);
  const [unread, setUnread] = useState(0);

  const refreshUnread = async () => {
    try {
      const { data } = await ComunicacionAPI.unreadCount();
      setUnread(data?.count ?? 0);
    } catch {
      // noop
    }
  };

  useEffect(() => {
    refreshUnread();
    const interval = setInterval(refreshUnread, 60_000); // cada 60s

    const onVis = () => {
      if (document.visibilityState === "visible") refreshUnread();
    };
    const onEvt = () => refreshUnread(); // event-bus desde FeedPage

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("unread:refresh", onEvt);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("unread:refresh", onEvt);
    };
  }, []);

  const MisAvisosLabel = () => (
    <span className="flex items-center gap-2">
      <span>Comunicaciones</span>
      {unread > 0 && !collapsed && (
        <span className="inline-flex min-w-5 h-5 px-1 justify-center items-center text-xs rounded-full bg-blue-600 text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </span>
  );

  return (
    <nav className="p-3 space-y-3">
      {/* General */}
      <div className="space-y-1">
        <SidebarLink
          to="/dashboard"
          icon={<Home size={18} />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        >
          Dashboard
        </SidebarLink>

        {canAdmin && (
          <SidebarLink
            to="/usuarios"
            icon={<Users size={18} />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          >
            Usuarios
          </SidebarLink>
        )}

        {canAdmin && (
          <SidebarLink
            to="/roles"
            icon={<Shield size={18} />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          >
            Roles
          </SidebarLink>
        )}
      </div>

      {/* Administración del condominio */}
      <div className="space-y-1">
        <SidebarLink
          to="/condominios"
          icon={<Building2 size={18} />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        >
          Condominios
        </SidebarLink>
        <SidebarLink
          to="/propiedades"
          icon={<IdCard size={18} />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        >
          Propiedades
        </SidebarLink>
        <SidebarLink
          to="/residentes"
          icon={<Users size={18} />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        >
          Residentes
        </SidebarLink>
      </div>

      {/* Operación */}
      <div className="space-y-1">
        <SidebarLink
          to="/finanzas"
          icon={<Wallet size={18} />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        >
          Finanzas
        </SidebarLink>

        <SidebarLink
          to="/comunicacion"
          icon={<MessageSquare size={18} />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        >
          <MisAvisosLabel />
        </SidebarLink>

        <SidebarLink
          to="/reservas"
          icon={<CalendarClock size={18} />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        >
          Reservas
        </SidebarLink>

        <SidebarLink
          to="/seguridad"
          icon={<Shield size={18} />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        >
          Seguridad
        </SidebarLink>

        <SidebarLink
          to="/mantenimiento"
          icon={<Wrench size={18} />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        >
          Mantenimiento
        </SidebarLink>
      </div>
    </nav>
  );
}
