// src/pages/Usuarios/UsuarioForm.jsx
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

export default function UsuarioForm({ defaultValues, onSubmit, submitting }) {
  const isEdit = Boolean(defaultValues?.id || defaultValues?.uuid);

  const initialValues = useMemo(
    () => ({
      usuario: "",
      correo: "",
      nombre_completo: "",
      telefono: "",
      password: "",
      activo: true,
      ...defaultValues,
    }),
    [defaultValues]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: initialValues });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const submit = (values) => {
    const payload = {
      ...values,
      usuario: values.usuario?.trim(),
      correo: values.correo?.trim(),
      nombre_completo: values.nombre_completo?.trim(),
      telefono: values.telefono?.trim(),
    };

    if (isEdit && !payload.password) {
      const { password, ...rest } = payload;
      onSubmit(rest);
      return;
    }
    onSubmit(payload);
  };

  // Estilo base para inputs
  const inputClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 " +
    "bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {/* Usuario */}
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
          Usuario
        </label>
        <input
          className={`${inputClass} ${errors.usuario ? "border-red-500 focus:ring-red-500" : ""}`}
          {...register("usuario", { required: "Requerido" })}
          autoFocus
        />
        {errors.usuario && (
          <p className="mt-1 text-sm text-red-500">{errors.usuario.message}</p>
        )}
      </div>

      {/* Correo */}
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
          Correo
        </label>
        <input
          type="email"
          className={`${inputClass} ${errors.correo ? "border-red-500 focus:ring-red-500" : ""}`}
          {...register("correo", {
            required: "Requerido",
            pattern: { value: /\S+@\S+\.\S+/, message: "Correo inválido" },
          })}
        />
        {errors.correo && (
          <p className="mt-1 text-sm text-red-500">{errors.correo.message}</p>
        )}
      </div>

      {/* Nombre completo */}
      <div>
        <div className="flex items-baseline justify-between">
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
            Nombre completo
          </label>
          <span className="text-xs text-gray-400">(opcional)</span>
        </div>
        <input
          className={inputClass}
          {...register("nombre_completo")}
          placeholder="Ej: Juan Pérez"
        />
      </div>

      {/* Teléfono */}
      <div>
        <div className="flex items-baseline justify-between">
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
            Teléfono
          </label>
          <span className="text-xs text-gray-400">(opcional)</span>
        </div>
        <input
          className={inputClass}
          {...register("telefono")}
          placeholder="Ej: +503 7000 0000"
        />
      </div>

      {/* Contraseña */}
      {!isEdit ? (
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            className={`${inputClass} ${errors.password ? "border-red-500 focus:ring-red-500" : ""}`}
            {...register("password", {
              required: "Requerida",
              minLength: { value: 4, message: "Mínimo 4" },
            })}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Nueva contraseña
            </label>
            <span className="text-xs text-gray-400">(opcional)</span>
          </div>
          <input
            type="password"
            className={inputClass}
            {...register("password")}
            placeholder="Déjalo vacío para mantener la actual"
          />
        </div>
      )}

      {/* Activo */}
      <div>
        <label className="inline-flex items-center gap-2">
          <input
            id="chk-activo"
            type="checkbox"
            className="accent-blue-600 w-4 h-4"
            {...register("activo")}
          />
          <span className="text-sm">Activo</span>
        </label>
      </div>

      {/* Botón */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg px-6 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Guardando…" : isEdit ? "Actualizar" : "Crear"}
        </button>
      </div>
    </form>
  );
}
