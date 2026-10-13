export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
