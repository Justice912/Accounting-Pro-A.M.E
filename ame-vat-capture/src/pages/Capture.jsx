import { useAuth } from '../contexts/AuthContext.jsx';

export default function Capture() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-primary p-6 text-white">
      <div className="card max-w-sm bg-white p-8 text-center text-ink-primary">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">Phase 3</p>
        <h1 className="mt-2 text-2xl font-semibold">Receipt Capture</h1>
        <p className="mt-3 text-sm text-ink-secondary">
          Camera viewfinder, single capture button, offline-queue upload to Firebase Storage. Coming next.
        </p>
        {user && (
          <p className="mt-4 text-xs text-ink-secondary">Signed in as {user.email || user.uid}</p>
        )}
        <button type="button" onClick={logout} className="btn-outline mt-4 w-full">
          Sign out
        </button>
      </div>
    </div>
  );
}
