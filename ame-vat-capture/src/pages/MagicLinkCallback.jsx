import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/common/Spinner.jsx';

export default function MagicLinkCallback() {
  const { completeMagicLinkSignIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await completeMagicLinkSignIn(window.location.href);
        if (cancelled) return;
        const next = params.get('next') || '/capture';
        navigate(next, { replace: true });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Sign-in failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [completeMagicLinkSignIn, navigate, params]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      {error ? (
        <div className="card max-w-md p-6 text-center">
          <h1 className="text-lg font-semibold text-brand-danger">Could not sign you in</h1>
          <p className="mt-2 text-sm text-ink-secondary">{error}</p>
          <button type="button" onClick={() => navigate('/login')} className="btn-primary mt-4">
            Back to sign in
          </button>
        </div>
      ) : (
        <Spinner label="Completing sign in..." />
      )}
    </div>
  );
}
