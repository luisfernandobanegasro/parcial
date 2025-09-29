import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow-sm">
      <span className="navbar-brand mb-0 h6">Mi Topbar de CONDOMINIO :)</span>

      <ul className="navbar-nav ms-auto">
        <li className="nav-item dropdown">
          <a className="nav-link dropdown-toggle" href="#!" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            {user?.usuario || "Usuario"}
          </a>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><span className="dropdown-item-text text-muted small">{user?.correo}</span></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item" onClick={logout}>Cerrar sesión</button></li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
