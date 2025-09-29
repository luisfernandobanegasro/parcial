import { AuthProvider } from "./context/AuthContext";
import { StatsProvider } from "./context/StatsContext";
import AppRouter from "./router/AppRouter";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/sb-admin-2.css";
import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <StatsProvider>
        <AppRouter />
        <ToastContainer position="top-right" />
      </StatsProvider>
    </AuthProvider>
  );
}
