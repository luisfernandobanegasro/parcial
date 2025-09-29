// src/pages/Usuarios/UserRolesModal.jsx
import { useCallback, useEffect, useState } from "react";
import { RolesAPI } from "../../api/roles.api";
import { toast } from "react-toastify";

export default function UserRolesModal({ usuario, open, onClose }) {
  const [allRoles, setAllRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  // Memoriza la función de carga para que useEffect pueda depender de ella sin warning.
  const load = useCallback(async () => {
    if (!usuario?.id) return;
    setLoading(true);
    try {
      const [roles, my] = await Promise.all([
        RolesAPI.list(),
        RolesAPI.listByUsuario(usuario.id),
      ]);
      setAllRoles(roles ?? []);
      setUserRoles(my ?? []);
    } catch (e) {
      toast.error(e?.message || "No se pudieron cargar roles");
    } finally {
      setLoading(false);
    }
  }, [usuario?.id]);

  // Carga cuando se abre el modal o cuando cambia el usuario seleccionado.
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // (Opcional) Si cambia el usuario, limpia estados para no ver “parpadeos” de datos anteriores.
  useEffect(() => {
    if (!open) return;
    setAllRoles([]);
    setUserRoles([]);
  }, [usuario?.id, open]);

  const isAssigned = (roleId) => userRoles.some((r) => r.id === roleId);

  const assign = async (role) => {
    setAssigning(true);
    try {
      await RolesAPI.addToUsuario(usuario.id, role.id);
      toast.success(`Asignado: ${role.name}`);
      setUserRoles((prev) => [...prev, role]);
    } catch (e) {
      toast.error(e?.message || "No se pudo asignar");
    } finally {
      setAssigning(false);
    }
  };

  const remove = async (role) => {
    setAssigning(true);
    try {
      await RolesAPI.removeFromUsuario(usuario.id, role.id);
      toast.success(`Quitado: ${role.name}`);
      setUserRoles((prev) => prev.filter((r) => r.id !== role.id));
    } catch (e) {
      toast.error(e?.message || "No se pudo quitar");
    } finally {
      setAssigning(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Roles de {usuario?.usuario}</h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Asignados */}
          <div>
            <h4 className="font-medium mb-3">Asignados</h4>
            <div className="space-y-2">
              {loading ? (
                <div className="text-gray-500">Cargando…</div>
              ) : userRoles.length === 0 ? (
                <div className="text-gray-500">Sin roles.</div>
              ) : (
                userRoles.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded border px-3 py-2">
                    <span>{r.name}</span>
                    <button
                      disabled={assigning}
                      onClick={() => remove(r)}
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
          <div>
            <h4 className="font-medium mb-3">Disponibles</h4>
            <div className="space-y-2">
              {loading ? (
                <div className="text-gray-500">Cargando…</div>
              ) : allRoles.length === 0 ? (
                <div className="text-gray-500">No hay roles creados.</div>
              ) : (
                allRoles.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded border px-3 py-2">
                    <span>{r.name}</span>
                    {isAssigned(r.id) ? (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Asignado</span>
                    ) : (
                      <button
                        disabled={assigning}
                        onClick={() => assign(r)}
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
  
  
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button onClick={onClose} className="rounded-lg px-4 py-2 border hover:bg-gray-50 dark:hover:bg-gray-800">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
