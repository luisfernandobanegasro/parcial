// src/pages/Usuarios/UsuariosPage.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import UsuarioForm from "./UsuarioForm";
import UserRolesModal from "./UserRolesModal";
import { UsuariosAPI } from "../../api/usuarios.api";
import { useStatsBusOptional } from "../../context/StatsContext";

export default function UsuariosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);           // modal crear/editar
  const [editing, setEditing] = useState(null);      // registro en edición
  const [submitting, setSubmitting] = useState(false);

  const [rolesUser, setRolesUser] = useState(null);  // usuario para modal de roles

  const { bump } = useStatsBusOptional();

  const load = async () => {
    setLoading(true);
    try {
      const data = await UsuariosAPI.list({ page_size: 100 });
      setRows(data?.results ?? data ?? []);
    } catch (e) {
      toast.error(e?.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = () => { setEditing(null); setOpen(true); };
  const onEdit   = (row) => { setEditing(row); setOpen(true); };

  const onDelete = async (row) => {
    if (!window.confirm(`¿Eliminar a ${row.usuario}?`)) return;
    try {
      await UsuariosAPI.remove(row.id || row.uuid);
      toast.success("Eliminado");
      bump();
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudo eliminar");
    }
  };

  // bloquea scroll cuando el modal de crear/editar está abierto
  useEffect(() => {
    if (open) {
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => { document.documentElement.style.overflow = prev; };
    }
  }, [open]);

  const handleSubmit = async (values) => {
    setSubmitting(true);

    // payload que espera tu backend (Create/Update serializers)
    const payload = {
      usuario: (values.usuario || "").trim(),
      correo: (values.correo || "").trim(),
      nombre_completo: (values.nombre_completo || "").trim(),
      telefono: (values.telefono || "").trim(),
      activo: !!values.activo,
      ...(editing ? {} : { password: values.password || "" }),
    };

    try {
      if (editing) {
        const id = editing.id || editing.uuid;
        await UsuariosAPI.update(id, payload);
        toast.success("Usuario actualizado");
      } else {
        await UsuariosAPI.create(payload);
        toast.success("Usuario creado");
      }
      setOpen(false);
      setEditing(null);
      bump();      // refresca KPIs
      load();      // recarga tabla
    } catch (e) {
      // Muestra mensajes de validación de DRF por campo
      const data = e?.payload || e;
      if (data && typeof data === "object") {
        const msgs = [];
        for (const [field, arr] of Object.entries(data)) {
          if (Array.isArray(arr)) msgs.push(`${field}: ${arr.join(", ")}`);
        }
        if (msgs.length) msgs.forEach(m => toast.error(m));
        else toast.error(e?.message || "Error al guardar");
      } else {
        toast.error(e?.message || "Error al guardar");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Usuarios</h2>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
          </svg>
          Nuevo
        </button>
      </div>

      {/* Tabla desktop */}
      <div className="hidden sm:block rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Correo</th>
              <th className="px-4 py-3 text-left">Activo</th>
              <th className="px-4 py-3 text-left w-40">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Cargando…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin registros.</td></tr>
            )}
            {!loading && rows.map((r) => (
              <tr key={r.id || r.uuid}>
                <td className="px-4 py-3">{r.usuario}</td>
                <td className="px-4 py-3">{r.correo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${r.activo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                    {r.activo ? "Sí" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Roles */}
                    <button
                      onClick={() => setRolesUser(r)}
                      className="rounded-lg px-2 py-1 border border-violet-300 text-violet-700 hover:bg-violet-50"
                      title="Roles"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7l3-7z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => onEdit(r)}
                      className="rounded-lg px-2 py-1 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M4 21h4l11-11-4-4L4 17v4z" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => onDelete(r)}
                      className="rounded-lg px-2 py-1 border border-red-300 text-red-600 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6v14m8-14v14M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards móvil */}
      <div className="grid sm:hidden gap-3">
        {loading && <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-gray-500">Cargando…</div>}
        {!loading && rows.length === 0 && <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-gray-500">Sin registros.</div>}
        {!loading && rows.map((r) => (
          <div key={r.id || r.uuid} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{r.usuario}</h3>
              <span className={`px-2 py-1 rounded text-xs ${r.activo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                {r.activo ? "Sí" : "No"}
              </span>
            </div>
            <p className="text-sm text-gray-500">{r.correo}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setRolesUser(r)}
                className="rounded-lg px-3 py-2 border border-violet-300 text-violet-700 hover:bg-violet-50"
              >
                Roles
              </button>
              <button
                onClick={() => onEdit(r)}
                className="rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(r)}
                className="rounded-lg px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear/Editar */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setOpen(false); setEditing(null); }} />
          <div
            className="relative z-10 w-full max-w-md sm:max-w-lg rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <h3 className="text-lg font-semibold">
                {editing ? "Editar usuario" : "Nuevo usuario"}
              </h3>
              <button
                onClick={() => { setOpen(false); setEditing(null); }}
                className="rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="px-6 pb-6">
              <UsuarioForm
                defaultValues={editing || { activo: true }}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Roles */}
      <UserRolesModal
        usuario={rolesUser}
        open={Boolean(rolesUser)}
        onClose={() => setRolesUser(null)}
      />
    </section>
  );
}
