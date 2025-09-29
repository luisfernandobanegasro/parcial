// src/pages/Comunicacion/AvisoCard.jsx
import dayjs from "dayjs";

export default function AvisoCard({ item, onMarkRead }) {
  const unreadDot = !item.leido ? <span className="inline-block w-2 h-2 rounded-full bg-blue-600 ml-2" /> : null;

  return (
    <div className={`card p-4 space-y-2 ${!item.leido ? "ring-1 ring-blue-300" : ""}`}>
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${!item.leido ? "text-blue-700" : ""}`}>
          {item.titulo}
          {unreadDot}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`badge ${item.categoria}`}>{item.categoria}</span>
          {!item.leido && (
            <button className="btn-xs" onClick={onMarkRead}>Marcar leído</button>
          )}
        </div>
      </div>
      <div className="text-sm opacity-80">
        Vigente desde {item.vigente_desde ? dayjs(item.vigente_desde).format("YYYY-MM-DD HH:mm") : "-"}
        {item.vigente_hasta && <> · hasta {dayjs(item.vigente_hasta).format("YYYY-MM-DD HH:mm")}</>}
      </div>
      <p className="whitespace-pre-line">{item.cuerpo}</p>
      {!!(item.adjuntos?.length) && (
        <div className="text-sm">
          <div className="font-medium mb-1">Adjuntos</div>
          <ul className="list-disc pl-5">
            {item.adjuntos.map(a=>(
              <li key={a.id}>
                <a className="link" href={a.url} target="_blank" rel="noreferrer">{a.url}</a>
                <span className="opacity-70"> ({a.mime})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
