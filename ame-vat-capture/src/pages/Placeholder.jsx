export default function Placeholder({ title, phase, description }) {
  return (
    <div className="card p-8">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">{phase}</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink-primary">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm text-ink-secondary">{description}</p>
    </div>
  );
}
