import { useEffect, useMemo, useState } from "react";
import { RolesAPI } from "../../api/roles.api";
import { toast } from "react-toastify";

export default function RolePermsModal({ role, open, onClose }) {
  const [allPerms, setAllPerms] = useState([]);
  const [granted, setGranted]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [working, setWorking]   = useState(false);
  const [q, setQ]               = useState("");

  useEffect(() => {
    if (!open || !role?.id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [catalog, mine] = await Promise.all([
          RolesAPI.listPermissions(),
          RolesAPI.listGroupPermissions(role.id),
        ]);
        if (!cancelled) {
          setAllPerms(catalog || []);
          setGranted(mine || []);
        }
      } catch (e) {
        toast.error(e?.message || "No se pudieron cargar permisos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, role?.id]);

  const grantedIds = useMemo(() => new Set(granted.map(p => p.id)), [granted]);

  const filteredAll = useMemo(() => {
    if (!q.trim()) return allPerms;
    const qq = q.toLowerCase();
    return allPerms.filter(p =>
      (p.name || "").toLowerCase().includes(qq) ||
      (p.codename || "").toLowerCase().includes(qq) ||
      (p.app_label || "").toLowerCase().includes(qq) ||
      (p.model || "").toLowerCase().includes(qq)
    );
  }, [allPerms, q]);

  const onGrant = async (perm) => {
    setWorking(true);
    try {
      await RolesAPI.addPermissionToGroup(role.id, perm.id);
      setGranted(prev => [...prev, perm]);
      toast.success(`Asignado: ${perm.codename}`);
    } catch (e) {
      toast.error(e?.message || "No se pudo asignar");
    } finally {
      setWorking(false);
    }
  };

  const onRevoke = async (perm) => {
    setWorking(true);
    try {
      await RolesAPI.removePermissionFromGroup(role.id, perm.id);
      setGranted(prev => prev.filter(p => p.id !== perm.id));
      toast.success(`Quitado: ${perm.codename}`);
    } catch (e) {
      toast.error(e?.message || "No se pudo quitar");
    } finally {
      setWorking(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* modal fluido */}
      <div className="relative z-10 w-[95vw] max-w-screen-xl rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Permisos del rol: {role?.name}</h3>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await RolesAPI.syncPermissions();
                  const [catalog, mine] = await Promise.all([
                    RolesAPI.listPermissions(),
                    RolesAPI.listGroupPermissions(role.id),
                  ]);
                  setAllPerms(catalog || []);
                  setGranted(mine || []);
                  toast.success("Catálogo de permisos actualizado");
                } catch (e) {
                  toast.error(e?.message || "No se pudo sincronizar");
                }
              }}
              className="text-sm border rounded px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Reconstruir catálogo de permisos"
            >
              Recargar catálogo
            </button>

            <button
              onClick={onClose}
              className="rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 grid md:grid-cols-2 gap-6 min-w-0">
          {/* Asignados */}
          <div className="min-w-0">
            <h4 className="font-medium mb-3">Asignados</h4>
            <div className="border rounded-lg divide-y max-h-[60vh] overflow-auto">
              {loading ? (
                <div className="p-3 text-gray-500">Cargando…</div>
              ) : granted.length === 0 ? (
                <div className="p-3 text-gray-500">Sin permisos.</div>
              ) : (
                granted.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {p.app_label}.{p.model} • {p.codename}
                      </div>
                    </div>
                    <button
                      disabled={working}
                      onClick={() => onRevoke(p)}
                      className="text-red-600 border border-red-300 rounded px-2 py-1 hover:bg-red-50 disabled:opacity-60"
                    >
                      Quitar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Disponibles */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h4 className="font-medium">Disponibles</h4>
              <input
                className="border rounded px-3 py-1 text-sm w-64 max-w-full"
                placeholder="Buscar (nombre, codename, app, modelo)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="border rounded-lg divide-y max-h-[60vh] overflow-auto">
              {loading ? (
                <div className="p-3 text-gray-500">Cargando…</div>
              ) : filteredAll.length === 0 ? (
                <div className="p-3 text-gray-500">No hay coincidencias.</div>
              ) : (
                filteredAll.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {p.app_label}.{p.model} • {p.codename}
                      </div>
                    </div>
                    {grantedIds.has(p.id) ? (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                        Asignado
                      </span>
                    ) : (
                      <button
                        disabled={working}
                        onClick={() => onGrant(p)}
                        className="text-blue-600 border border-blue-300 rounded px-2 py-1 hover:bg-blue-50 disabled:opacity-60"
                      >
                        Asignar
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 border hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
