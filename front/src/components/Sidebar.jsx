// src/components/Sidebar.jsx
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
          isActive
            ? "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-300"
            : "text-gray-700 dark:text-gray-200",
        ].join(" ")
      }
    >
      {icon ? <span className="w-5 h-5">{icon}</span> : null}
      {!collapsed && <span className="truncate">{children}</span>}
    </NavLink>
  );
}
