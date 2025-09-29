// src/auth/useSession.js
import { useEffect, useMemo, useState } from "react";
import { getMe, store } from "../api/api";
import { RolesAPI } from "../api/roles.api";
import { getCachedSession, setCachedSession, clearCachedSession } from "./session";

export default function useSession() {
  const cache = getCachedSession();

  const [loading, setLoading] = useState(!cache.loaded);
  const [user, setUser] = useState(cache.user || null);
  const [roles, setRoles] = useState(cache.roles || []); // [{id,name}, ...]

  useEffect(() => {
    let cancelled = false;

    // Sin token → marcar listo (no bloquear nada).
    if (!store.access) {
      setLoading(false);
      return () => { cancelled = true; };
    }

    // Si hay cache, no vuelvas a pedir.
    if (cache.loaded) {
      setLoading(false);
      return () => { cancelled = true; };
    }

    (async () => {
      try {
        const me = await getMe(); // { ..., auth:{ is_superuser,is_staff,groups:[...] } }
        const groupNamesFromMe = me?.auth?.groups || null;

        let roleList = [];
        if (Array.isArray(groupNamesFromMe)) {
          // Normaliza a [{id,name}]
          roleList = groupNamesFromMe.map((name, idx) => ({ id: idx + 1, name }));
        } else {
          // Respaldo: endpoint de roles por usuario
          roleList = (await RolesAPI.listByUsuario(me.id)) || [];
        }

        if (!cancelled) {
          setUser(me);
          setRoles(roleList);
          setCachedSession({ user: me, roles: roleList });
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleNames = useMemo(() => (roles || []).map(r => r.name), [roles]);
  const isSuper = !!(user?.auth?.is_superuser || user?.auth?.is_staff);

  const hasRole = (name) => (isSuper ? true : roleNames.includes(name));
  const hasAnyRole = (arr = []) => {
    if (!Array.isArray(arr) || arr.length === 0) return true;
    if (isSuper) return true;
    return arr.some((r) => roleNames.includes(r));
  };
  const hasAllRoles = (arr = []) => {
    if (!Array.isArray(arr) || arr.length === 0) return true;
    if (isSuper) return true;
    return arr.every((r) => roleNames.includes(r));
  };

  return { loading, user, roles, roleNames, isSuper, hasRole, hasAnyRole, hasAllRoles, clearCachedSession };
}
