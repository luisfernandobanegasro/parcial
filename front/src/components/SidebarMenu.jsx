// src/components/SidebarMenu.jsx
import useSession from "../auth/useSession";
import SidebarLink from "./Sidebar";
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

  return (
    <nav className="p-3 space-y-3">
      {/* General */}
      <div className="space-y-1">
        <SidebarLink to="/dashboard" icon={<Home size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
          Dashboard
        </SidebarLink>

        <SidebarLink to="/usuarios" icon={<Users size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
          Usuarios
        </SidebarLink>

        {/* Roles (aquí estará también el CRUD de permisos) */}
        {canAdmin && (
          <SidebarLink to="/roles" icon={<Shield size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
            Roles
          </SidebarLink>
        )}
      </div>

      {/* Administración del condominio */}
      <div className="space-y-1">
        <SidebarLink to="/condominios" icon={<Building2 size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
          Condominios
        </SidebarLink>
        <SidebarLink to="/propiedades" icon={<IdCard size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
          Propiedades
        </SidebarLink>
        <SidebarLink to="/residentes" icon={<Users size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
          Residentes
        </SidebarLink>
      </div>

      {/* Operación */}
      <div className="space-y-1">
        <SidebarLink to="/finanzas" icon={<Wallet size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
          Finanzas
        </SidebarLink>
        <SidebarLink to="/comunicacion" icon={<MessageSquare size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
          Comunicación
        </SidebarLink>
        <SidebarLink to="/reservas" icon={<CalendarClock size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
          Reservas
        </SidebarLink>
        <SidebarLink to="/seguridad" icon={<Shield size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
          Seguridad
        </SidebarLink>
        <SidebarLink to="/mantenimiento" icon={<Wrench size={18} />} collapsed={collapsed} onNavigate={onNavigate}>
          Mantenimiento
        </SidebarLink>
      </div>
    </nav>
  );
}
