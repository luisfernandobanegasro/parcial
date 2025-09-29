import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../layout/Layout";

import Dashboard from "../pages/Dashboard";
import CondominiosPage from "../pages/Condominios/CondominiosPage";
import UsuariosPage from "../pages/Usuarios/UsuariosPage";
import RolesPage from "../pages/Roles";
import Login from "../pages/Login";
import PropiedadesPage from "../pages/Propiedades/PropiedadesPage";


import { ROLES } from "../auth/rbac";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* pública */}
        <Route path="/login" element={<Login />} />

        {/* layout protegido para cualquiera autenticado */}
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
          

          {/* Usuarios: Admin o Personal (ejemplo de solapado) */}
          <Route
            path="usuarios"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />

          {/* Roles: solo Admin */}
          <Route
            path="roles"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="propiedades"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <PropiedadesPage />
              </ProtectedRoute>
            }
          />

          {/* Ejemplos adicionales:
          <Route
            path="reservas"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.COPRO]}>
                <ReservasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="seguridad"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SEGURIDAD]}>
                <SeguridadPage />
              </ProtectedRoute>
            }
          />
          */}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
