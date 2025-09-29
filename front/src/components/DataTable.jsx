import { useMemo, useState } from "react";
import clsx from "clsx";

export default function DataTable({ rows, columns, loading, onSearch, actions }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return rows;
    const ql = q.toLowerCase();
    return rows.filter(r =>
      Object.values(r).some(v => String(v ?? "").toLowerCase().includes(ql))
    );
  }, [rows, q]);

  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQ(val);
    setPage(1);
    onSearch?.(val);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <input
          className="form-control"
          style={{maxWidth: 320}}
          placeholder="Buscar…"
          value={q}
          onChange={handleSearch}
        />
        {actions}
      </div>

      <div className="card shadow">
        <div className="card-body table-responsive">
          {loading ? "Cargando..." : (
            <table className="table align-middle">
              <thead>
                <tr>
                  {columns.map(c => <th key={c.key || c.header}>{c.header}</th>)}
                  <th style={{width:120}}></th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => (
                  <tr key={r.id || r.uuid || i}>
                    {columns.map(c => (
                      <td key={c.key || c.header}>
                        {typeof c.render === "function" ? c.render(r) : r[c.key]}
                      </td>
                    ))}
                    <td className="text-end">
                      {typeof r._actions === "function" ? r._actions(r) : null}
                    </td>
                  </tr>
                ))}
                {!pageRows.length && (
                  <tr><td colSpan={columns.length+1} className="text-center text-muted">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <small className="text-muted">
          {filtered.length} resultados — Página {page} de {totalPages}
        </small>
        <div className="btn-group">
          <button className="btn btn-outline-secondary btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
          {Array.from({length: totalPages}).map((_,i)=>(
            <button key={i} className={clsx("btn btn-sm", page===i+1 ? "btn-primary" : "btn-outline-secondary")} onClick={()=>setPage(i+1)}>{i+1}</button>
          ))}
          <button className="btn btn-outline-secondary btn-sm" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Siguiente</button>
        </div>
      </div>
    </>
  );
}
