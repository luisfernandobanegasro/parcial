// src/pages/Roles/PermissionsCrud.jsx
import { useEffect, useState, useMemo } from "react";
import { RolesAPI } from "../../api/roles.api";
import { toast } from "react-toastify";

export default function PermissionsCrud() {
  // catálogo crudo desde backend
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  // filtros/creación
  const [q, setQ] = useState("");          // búsqueda general
  const [name, setName] = useState("");    // crear: nombre legible
  const [codename, setCodename] = useState(""); // crear: codename (p.ej. "can_do_x")
  const [app, setApp] = useState("");      // crear: app_label (p.ej. "myapp")
  const [model, setModel] = useState("");  // crear: model (p.ej. "usuario")

  // ===== helpers =====
  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await RolesAPI.listPermissions(); // sin filtros => todo el catálogo
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e?.message || "No se pudieron listar permisos");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Filtro en cliente SOLO si hay algo en q (para no dejar lista vacía por defecto)
  const visible = useMemo(() => {
    if (!q.trim()) return rows;
    const qq = q.toLowerCase();
    return rows.filter((p) =>
      (p.name || "").toLowerCase().includes(qq) ||
      (p.codename || "").toLowerCase().includes(qq) ||
      (p.app_label || "").toLowerCase().includes(qq) ||
      (p.model || "").toLowerCase().includes(qq)
    );
  }, [rows, q]);

  // ===== acciones =====
  const onSync = async () => {
    setWorking(true);
    try {
      await RolesAPI.syncPermissions();
      await fetchAll();
      toast.success("Catálogo de permisos reconstruido");
    } catch (e) {
      toast.error(e?.message || "No se pudo reconstruir el catálogo");
    } finally {
      setWorking(false);
    }
  };

  const onReload = async () => {
    await fetchAll();
  };

  const onCreate = async () => {
    if (!name.trim() || !codename.trim() || !app.trim() || !model.trim()) {
      toast.info("Completa nombre, codename, app y model.");
      return;
    }
    setWorking(true);
    try {
      await RolesAPI.createPermission({
        name: name.trim(),
        codename: codename.trim(),
        app_label: app.trim(),
        model: model.trim(),
      });
      setName("");
      setCodename("");
      setApp("");
      setModel("");
      await fetchAll();
      toast.success("Permiso creado");
    } catch (e) {
      toast.error(e?.message || "No se pudo crear el permiso");
    } finally {
      setWorking(false);
    }
  };

  const onDelete = async (perm) => {
    if (!window.confirm(`¿Eliminar permiso "${perm.name}"?`)) return;
    setWorking(true);
    try {
      await RolesAPI.deletePermission(perm.id);
      setRows((prev) => prev.filter((p) => p.id !== perm.id));
      toast.success("Permiso eliminado");
    } catch (e) {
      toast.error(e?.message || "No se pudo eliminar");
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="space-y-3 mt-10">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Permisos (CRUD)</h3>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (nombre, codename, app, modelo)…"
            className="border rounded px-3 py-1 text-sm"
          />
          <button
            onClick={onReload}
            className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
            disabled={loading}
          >
            Recargar
          </button>
          <button
            onClick={onSync}
            className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
            disabled={working}
            title="Reconstruir catálogo desde los modelos"
          >
            Reconstruir catálogo
          </button>
        </div>
      </div>

      {/* Form crear permiso */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="border rounded px-3 py-2"
        />
        <input
          value={codename}
          onChange={(e) => setCodename(e.target.value)}
          placeholder="Codename (p.ej. add_modelo)"
          className="border rounded px-3 py-2"
        />
        <input
          value={app}
          onChange={(e) => setApp(e.target.value)}
          placeholder="App label (p.ej. myapp)"
          className="border rounded px-3 py-2"
        />
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Modelo (p.ej. usuario)"
          className="border rounded px-3 py-2"
        />
        <button
          onClick={onCreate}
          disabled={working}
          className="rounded-lg px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          Crear
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border">
        <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-4 py-3 text-left w-16">ID</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Codename</th>
                <th className="px-4 py-3 text-left w-[180px]">App</th>
                <th className="px-4 py-3 text-left w-[180px]">Modelo</th>
                <th className="px-4 py-3 text-left w-[140px]">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {loading ? (
                <tr>
                    <td colSpan={6} className="px-4 py-6 text-gray-500">
                    Cargando…
                    </td>
                </tr>
                ) : visible.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-4 py-6 text-gray-500">
                    Sin resultados.
                    </td>
                </tr>
                ) : (
                visible.map((p) => (
                    <tr key={p.id}>
                    <td className="px-4 py-3">{p.id}</td>
                    <td className="px-4 py-3 max-w-[320px] truncate">{p.name}</td>
                    <td className="px-4 py-3 max-w-[240px] truncate">{p.codename}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{p.app_label}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{p.model}</td>
                    <td className="px-4 py-3">
                        <button
                        onClick={() => onDelete(p)}
                        disabled={working}
                        className="rounded-lg px-3 py-1 border border-red-300 text-red-600 hover:bg-red-50"
                        >
                        Eliminar
                        </button>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
        </div>

    </section>
  );
}
