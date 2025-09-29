import { createContext, useCallback, useContext, useState, useEffect } from "react";

const StatsContext = createContext(null);

export function StatsProvider({ children }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    // Log para confirmar que el provider está montado
    // eslint-disable-next-line no-console
    console.log("[StatsProvider] mounted, version =", version);
  }, [version]);

  return (
    <StatsContext.Provider value={{ version, bump }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStatsBus() {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error("useStatsBus must be used within <StatsProvider>");
  return ctx; // { version, bump }
}

// Hook opcional: no lanza error si aún no hay provider (renderiza con defaults)
export function useStatsBusOptional() {
  return useContext(StatsContext) ?? { version: 0, bump: () => {} };
}
