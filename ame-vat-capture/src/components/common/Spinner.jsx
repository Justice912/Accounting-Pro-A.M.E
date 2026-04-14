export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 text-ink-secondary">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-secondary border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
