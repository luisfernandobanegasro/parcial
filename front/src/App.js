import React, { useEffect, useState } from "react";
/*import logo from './logo.svg';*/
import './App.css';
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import AppFooter from "./components/AppFooter";
import Login from "./pages/Login";
import { getMe, refreshToken } from "./api";

/*function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}*/
/*function App() {
  return (
    <div className="container mt-5">
      <h1 className="h3 mb-4 text-gray-800">SB Admin 2 funcionando 🚀</h1>
      <p className="text-muted">Si ves este estilo, ya se aplicó el CSS del tema.</p>
      
      <button className="btn btn-primary me-2">Botón Primario</button>
      <button className="btn btn-success me-2">Botón Éxito</button>
      <button className="btn btn-danger">Botón Peligro</button>
      <button className="btn btn-success me-2">Botón felicidad</button>
    </div>
  );
}*/
function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Al cargar, intenta usar tokens guardados
  useEffect(() => {
    async function init() {
      const access = localStorage.getItem("access");
      if (!access) { setChecking(false); return; }

      try {
        const me = await getMe(access);
        setUser(me);
      } catch {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) { setChecking(false); return; }
        try {
          const { access: newAccess } = await refreshToken(refresh);
          localStorage.setItem("access", newAccess);
          const me = await getMe(newAccess);
          setUser(me);
        } catch {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        } finally {
          setChecking(false);
        }
        return;
      }
      setChecking(false);
    }
    init();
  }, []);

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  }

  // Mientras verifica tokens
  if (checking) return null;

  // Si no hay sesión, muestra Login (tu layout no se toca)
  if (!user) return <Login onLogin={setUser} />;

  // Si hay sesión, tu dashboard tal cual:
  return (
    <div id="wrapper" className="d-flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <div id="content-wrapper" className="d-flex flex-column w-100">
        <div id="content">
          {/* Puedes pasar user y logout al Topbar si quieres mostrar el nombre y botón */}
          <Topbar user={user} onLogout={logout} />

          {/* Contenido principal */}
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="h3 mb-4 text-gray-800">Dashboard</h1>
              <button className="btn btn-outline-secondary" onClick={logout}>Cerrar sesión</button>
            </div>

            <div className="row">
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="card border-left-primary shadow h-100 py-2">
                  <div className="card-body">
                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                      Earnings (Monthly)
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">$40,000</div>
                  </div>
                </div>
              </div>
              {/* ...tus otras cards */}
            </div>
          </div>
        </div>

        <AppFooter />
      </div>
    </div>
  );
}

export default App;
