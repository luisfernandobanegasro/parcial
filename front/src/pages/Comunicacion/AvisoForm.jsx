import { useState, useEffect } from "react";

const empty = {
  titulo: "", cuerpo: "",
  categoria: "NORMATIVA",
  condominio: null,
  vigente_desde: new Date().toISOString(),
  vigente_hasta: null,
  estado: "BORRADOR",
  adjuntos: [], destinatarios: [{ alcance: "TODOS", usuario: null, unidad: null }],
};

export default function AvisoForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || empty);
  useEffect(()=>{ if (initial) setForm(initial); },[initial]);

  const U = (k,v)=>setForm(f=>({...f,[k]:v}));
  const addAdj=()=>U("adjuntos",[...form.adjuntos,{url:"",mime:"application/pdf"}]);
  const addDest=()=>U("destinatarios",[...form.destinatarios,{alcance:"TODOS",usuario:null,unidad:null}]);

  return (
    <div className="p-3 space-y-3">
      <div>
        <label className="label">Título</label>
        <input className="input" value={form.titulo} onChange={e=>U("titulo",e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Categoría</label>
          <select className="input" value={form.categoria} onChange={e=>U("categoria",e.target.value)}>
            <option>NORMATIVA</option><option>MANTENIMIENTO</option><option>EVENTO</option><option>SEGURIDAD</option>
          </select>
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="input" value={form.estado} onChange={e=>U("estado",e.target.value)}>
            <option>BORRADOR</option><option>PUBLICADO</option><option>INACTIVO</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Cuerpo</label>
        <textarea className="input" rows={5} value={form.cuerpo} onChange={e=>U("cuerpo",e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Vigente desde</label>
          <input type="datetime-local" className="input"
            value={form.vigente_desde?.slice(0,16)}
            onChange={e=>U("vigente_desde", new Date(e.target.value).toISOString())}/>
        </div>
        <div>
          <label className="label">Vigente hasta (opcional)</label>
          <input type="datetime-local" className="input"
            value={form.vigente_hasta ? form.vigente_hasta.slice(0,16) : ""}
            onChange={e=>U("vigente_hasta", e.target.value? new Date(e.target.value).toISOString(): null)}/>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="label">Adjuntos (URL)</span>
          <button type="button" className="btn" onClick={addAdj}>+ Agregar</button>
        </div>
        {form.adjuntos.map((a,i)=>(
          <div key={i} className="grid grid-cols-3 gap-2 my-1">
            <input className="input col-span-2" placeholder="https://..." value={a.url}
              onChange={e=>{ const arr=[...form.adjuntos]; arr[i]={...arr[i],url:e.target.value}; U("adjuntos",arr); }}/>
            <input className="input" placeholder="mime" value={a.mime}
              onChange={e=>{ const arr=[...form.adjuntos]; arr[i]={...arr[i],mime:e.target.value}; U("adjuntos",arr); }}/>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="label">Destinatarios</span>
          <button type="button" className="btn" onClick={addDest}>+ Agregar</button>
        </div>
        {form.destinatarios.map((d,i)=>(
          <div key={i} className="grid grid-cols-3 gap-2 my-1">
            <select className="input" value={d.alcance}
              onChange={e=>{ const arr=[...form.destinatarios]; arr[i]={...arr[i],alcance:e.target.value}; U("destinatarios",arr); }}>
              <option value="TODOS">TODOS</option>
              <option value="USUARIO">USUARIO</option>
              <option value="UNIDAD">UNIDAD</option>
              <option value="ROL" disabled>ROL (próx.)</option>
            </select>
            <input className="input" placeholder="usuario_id si USUARIO" value={d.usuario||""}
              onChange={e=>{ const arr=[...form.destinatarios]; arr[i]={...arr[i],usuario:e.target.value||null}; U("destinatarios",arr); }}/>
            <input className="input" placeholder="unidad_id si UNIDAD" value={d.unidad||""}
              onChange={e=>{ const arr=[...form.destinatarios]; arr[i]={...arr[i],unidad:e.target.value||null}; U("destinatarios",arr); }}/>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="btn-primary" onClick={()=>onSubmit(form)}>Guardar</button>
        <button className="btn" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
