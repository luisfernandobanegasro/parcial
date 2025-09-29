import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, getMe, clearTokens } from "../api/api";

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const login = async (username, password) => {
    await apiLogin(username, password);
    const me = await getMe();
    setUser(me);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setUser(me);
      } catch (e) {
        // sin token o inválido; ignorar
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  return (
    <AuthCtx.Provider value={{ user, booting, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
