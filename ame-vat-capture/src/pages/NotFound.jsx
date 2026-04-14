import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-secondary">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink-primary">Page not found</h1>
      <Link to="/dashboard" className="btn-primary mt-4">
        Go to dashboard
      </Link>
    </div>
  );
}
