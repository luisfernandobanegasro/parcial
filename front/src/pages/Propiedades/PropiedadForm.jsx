// src/pages/Propiedades/PropiedadForm.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { CondominiosAPI } from "../../api/condominios.api";
import { UsuariosAPI } from "../../api/usuarios.api";
import { toast } from "react-toastify";

const Option = ({ children, ...rest }) => <option {...rest}>{children}</option>;

export default function PropiedadForm({ initial, onCancel, onSave, working }) {
  const [condos, setCondos] = useState([]);
  const [owners, setOwners] = useState([]);
  const [ownerQ, setOwnerQ] = useState("");
  const [loadingCondos, setLoadingCondos] = useState(true);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const searchRef = useRef(0);

  const [form, setForm] = useState({
    condominio: null,   // pk Condominio
    codigo: "",
    piso: "",
    area_m2: "",
    propietario: null,  // pk Usuario (opcional)
    activo: true,       // solo UI
  });

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingCondos(true);
      try {
        const data = await CondominiosAPI.list({ page_size: 1000 });
        const rows = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        if (!cancel) setCondos(rows);
      } catch (e) {
        if (!cancel) toast.error(e?.message || "No se pudieron cargar condominios");
      } finally {
        if (!cancel) setLoadingCondos(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
  if (!initial) return;
  setForm({
    condominio: initial.condominio ?? initial.condominio_id ?? initial.condominio?.id ?? null,
    codigo: initial.codigo ?? initial.nombre ?? "",
    piso: initial.piso ?? "",
    area_m2: initial.area_m2 ?? "",
    // toma uuid si está disponible en el row
    propietario:
      initial.propietario_uuid ??
      initial.propietario_id ??
      initial.propietario ??
      null,
    activo: typeof initial.activo === "boolean" ? initial.activo : true,
  });
}, [initial]);

  useEffect(() => {
    if (!ownerQ || ownerQ.trim().length < 2) { setOwners([]); return; }

    const ticket = ++searchRef.current;
    setLoadingOwners(true);

    const t = setTimeout(async () => {
      try {
        const data = await UsuariosAPI.list({
          q: ownerQ.trim(),
          role: "Copropietario",
          ordering: "nombre_completo",
          page_size: 20,
        });
        const rows = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        if (searchRef.current === ticket) setOwners(rows);
      } catch {
        if (searchRef.current === ticket) setOwners([]);
      } finally {
        if (searchRef.current === ticket) setLoadingOwners(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [ownerQ]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const condoOptions = useMemo(
    () => condos.map(c => ({ value: c.id, label: c.nombre || `Condominio ${c.id}` })),
    [condos]
  );

  const ownerOptions = useMemo(() => {
    const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const q = norm(ownerQ.trim());
    const filtered = owners.filter(o => {
      const name = norm(o.nombre_completo || "");
      const user = norm(o.usuario || "");
      const email = norm(o.correo || "");
      return q ? (name.includes(q) || user.includes(q) || email.includes(q)) : true;
    });
    filtered.sort((a, b) => (a.nombre_completo || "").localeCompare(b.nombre_completo || ""));
    return filtered.map(o => ({
      value: o.id,
      label: o.nombre_completo || o.usuario || o.correo || `Usuario ${o.id}`,
    }));
  }, [owners, ownerQ]);

  const submit = () => {
  if (!form.condominio) return toast.error("Selecciona un condominio");
  const codigo = (form.codigo || "").trim();
  if (!codigo) return toast.error("Ingresa el código/unidad");

  const payload = {
    condominio: Number(form.condominio),                     // ← PK numérica de Condominio
    codigo,
    piso: form.piso !== "" ? Number(form.piso) : null,
    area_m2: form.area_m2 !== "" ? Number(form.area_m2) : null,
    estado: form.activo ? "activo" : "inactivo",
  };

  // 👇 IMPORTANTE: el usuario (propietario) ES UUID → NO convertir a Number
  const ownerId = form.propietario ? String(form.propietario) : null;

  onSave?.(payload, ownerId);
};

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm mb-1">Condominio</label>
          <select
            name="condominio"
            value={form.condominio ?? ""}
            onChange={onChange}
            className="select"
            required
          >
            <Option value="">{loadingCondos ? "Cargando…" : "— Selecciona —"}</Option>
            {condoOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Código / Unidad</label>
          <input
            name="codigo"
            value={form.codigo}
            onChange={onChange}
            className="input"
            placeholder="p.ej. A-236"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Piso</label>
          <input
            name="piso"
            value={form.piso}
            onChange={onChange}
            className="input"
            placeholder="p.ej. 2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Área m²</label>
          <input
            name="area_m2"
            value={form.area_m2}
            onChange={onChange}
            className="input"
            placeholder="p.ej. 75"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm mb-1">Propietario</label>
          <div className="flex gap-2">
            <input
              value={ownerQ}
              onChange={(e) => setOwnerQ(e.target.value)}
              placeholder="Buscar Copropietario… (min. 2 letras)"
              className="input flex-1"
            />
            <select
              name="propietario"
              value={form.propietario ?? ""}
              onChange={onChange}
              className="select w-64"
            >
              <Option value="">{loadingOwners ? "Buscando…" : "— Ninguno —"}</Option>
              {ownerOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" name="activo" checked={!!form.activo} onChange={onChange} className="check" />
          <span className="text-sm">Activo</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} type="button" className="btn">Cancelar</button>
        <button onClick={submit} type="button" disabled={working} className="btn btn-primary">
          {working ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
