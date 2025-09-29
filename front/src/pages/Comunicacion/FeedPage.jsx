// src/pages/Comunicacion/FeedPage.jsx
import { useEffect, useState } from "react";
import { ComunicacionAPI } from "../../api/comunicacion.api";
import AvisoCard from "./AvisoCard";

export default function FeedPage() {
  const [items, setItems] = useState([]);
  const [loading,setLoading] = useState(false);

  const unwrap = (res) => {
    const data = res?.data ?? res;
    return Array.isArray(data) ? data : (data?.results ?? []);
  };

  const load = async ()=>{
    setLoading(true);
    try{
      const res = await ComunicacionAPI.feed({ ordering: "-vigente_desde" });
      setItems(unwrap(res));
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  const marcarLeido = async (id)=>{
    await ComunicacionAPI.marcarLeido(id);
    await load();
    // refresco inmediato del badge de sidebar
    window.dispatchEvent(new CustomEvent("unread:refresh"));
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Comunicados para mí</h2>
        <button className="btn" onClick={load}>Actualizar</button>
      </div>
      {loading && <div>Cargando…</div>}
      {!loading && items.length===0 && <div>No hay avisos.</div>}
      <div className="grid gap-3">
        {items.map(it => (
          <AvisoCard key={it.id} item={it} onMarkRead={()=>marcarLeido(it.id)} />
        ))}
      </div>
    </div>
  );
}
