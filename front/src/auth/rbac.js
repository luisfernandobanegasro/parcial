// Nombres de roles (evita typos)
export const ROLES = {
  ADMIN: "Administrador",
  PERSONAL: "Personal",
  COPRO: "Copropietario",
  SEGURIDAD: "PersonalSeguridad",
  MANTENIMIENTO: "Mantenimiento",
};

/**
 * Permisos "allow" por item pueden ser:
 *  - null            -> cualquier autenticado
 *  - []              -> equivalente a null (autenticado)
 *  - ["A","B"]       -> ANY: basta uno de esos roles
 *  - { any:[...], all:[...] } -> combinaciones avanzadas
 */
export function canAccess(allow, userRoleNames) {
  // Sin restricción: cualquier autenticado
  if (!allow || (Array.isArray(allow) && allow.length === 0)) return true;

  const has = (r) => userRoleNames.includes(r);

  if (Array.isArray(allow)) {
    // ANY-of
    return allow.some(has);
  }

  if (typeof allow === "object") {
    const anyOk = Array.isArray(allow.any) ? allow.any.some(has) : true;
    const allOk = Array.isArray(allow.all) ? allow.all.every(has) : true;
    return anyOk && allOk;
  }

  // Por si pasan un string suelto
  if (typeof allow === "string") return has(allow);

  return false;
}
