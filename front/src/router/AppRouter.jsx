import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../layout/Layout";

import Dashboard from "../pages/Dashboard";
import CondominiosPage from "../pages/Condominios/CondominiosPage";
import UsuariosPage from "../pages/Usuarios/UsuariosPage";
import RolesPage from "../pages/Roles";
import Login from "../pages/Login";
import PropiedadesPage from "../pages/Propiedades/PropiedadesPage";
import ResidentesPage from "../pages/Residentes/ResidentesPage";
import FinanzasHome from "../pages/Finanzas";

// Comunicación
import AvisosPage from "../pages/Comunicacion/AvisosPage";
import FeedPage from "../pages/Comunicacion/FeedPage";

// Reservas (todo en esta página con tabs)
import ReservasPage from "../pages/Reservas/ReservasPage";

import { ROLES } from "../auth/rbac";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* pública */}
        <Route path="/login" element={<Login />} />

        {/* layout protegido */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Generales */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="condominios" element={<CondominiosPage />} />
          <Route path="residentes" element={<ResidentesPage />} />
          <Route path="finanzas" element={<FinanzasHome />} />
          <Route
            path="propiedades"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <PropiedadesPage />
              </ProtectedRoute>
            }
          />

          {/* Usuarios: solo Admin */}
          <Route
            path="usuarios"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <RolesPage />
              </ProtectedRoute>
            }
          />

          {/* Comunicación */}
          <Route
            path="comunicacion"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <AvisosPage />
              </ProtectedRoute>
            }
          />
          <Route path="comunicacion/feed" element={<FeedPage />} />

          {/* Reservas: solo Admin (adentro hay tabs Mis reservas | Áreas) */}
          <Route
            path="reservas"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <ReservasPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
