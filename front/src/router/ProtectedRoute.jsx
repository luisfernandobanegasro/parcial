// src/router/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import useSession from "../auth/useSession";
import { store } from "../api/api";

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const { loading, hasAnyRole } = useSession();

  // Sin token → login
  if (!store.access) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Cuando ya tenemos roles, valida. Si no cumple, redirige sin bloquear.
  if (!loading && Array.isArray(roles) && roles.length > 0 && !hasAnyRole(roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fluido: renderiza siempre; si luego sabemos que no tiene rol, se redirige.
  return children;
}
