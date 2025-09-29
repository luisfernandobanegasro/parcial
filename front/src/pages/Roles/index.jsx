import { useEffect, useState } from "react";
import { RolesAPI } from "../../api/roles.api";
import { toast } from "react-toastify";
import RolePermsModal from "./RolePermsModal";
import PermissionsCrud from "./PermissionsCrud";

export default function RolesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [permsOpen, setPermsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await RolesAPI.list();
      setRows(data ?? []);
    } catch (e) {
      toast.error(e?.message || "Error al cargar roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!name.trim()) return;
    try {
      await RolesAPI.create(name.trim());
      toast.success("Rol creado");
      setName("");
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudo crear");
    }
  };

  const onRename = async (row) => {
    const newName = prompt("Nuevo nombre del rol:", row.name);
    if (!newName || newName.trim() === row.name) return;
    try {
      await RolesAPI.rename(row.id, newName.trim());
      toast.success("Rol actualizado");
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudo renombrar");
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`¿Eliminar rol "${row.name}"?`)) return;
    try {
      await RolesAPI.remove(row.id);
      toast.success("Rol eliminado");
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudo eliminar");
    }
  };

  const openPerms = (row) => {
    setCurrentRole(row);
    setPermsOpen(true);
  };

  return (
    <section className="space-y-6 min-w-0">
      <h2 className="text-2xl font-semibold">Roles (Grupos) & Permisos</h2>

      {/* Controles responsivos */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del nuevo rol"
          className="rounded-lg border px-3 py-2 w-64 max-w-full"
        />
        <button
          onClick={onCreate}
          className="rounded-lg px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          Crear
        </button>
      </div>

      {/* Tabla de roles: wrapper con scroll horizontal */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left w-20">ID</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-gray-500">Cargando…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-gray-500">Sin roles.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.id}</td>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openPerms(r)}
                          className="rounded-lg px-3 py-1 border hover:bg-gray-50"
                        >
                          Permisos
                        </button>
                        <button
                          onClick={() => onRename(r)}
                          className="rounded-lg px-3 py-1 border hover:bg-gray-50"
                        >
                          Renombrar
                        </button>
                        <button
                          onClick={() => onDelete(r)}
                          className="rounded-lg px-3 py-1 border border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD de permisos (en la misma pantalla) */}
      <PermissionsCrud />

      <RolePermsModal
        role={currentRole}
        open={permsOpen}
        onClose={() => setPermsOpen(false)}
      />
    </section>
  );
}
