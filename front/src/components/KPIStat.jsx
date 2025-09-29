// src/components/KPIStat.jsx
export default function KPIStat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold">{value ?? "—"}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
