import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const { loginWithPassword, sendMagicLink } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('accountant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  async function handleAccountantLogin(event) {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Signing in...' });
    try {
      await loginWithPassword(email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Could not sign in' });
    }
  }

  async function handleMagicLink(event) {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Sending link...' });
    try {
      await sendMagicLink(email);
      setStatus({
        type: 'success',
        message: 'Check your email for a sign-in link.'
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Could not send link' });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-primary text-sm font-bold text-white">
            AME
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink-primary">VAT Capture</h1>
            <p className="text-xs text-ink-secondary">Sign in to continue</p>
          </div>
        </div>

        <div className="mb-4 flex rounded-lg border border-gray-200 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode('accountant')}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
              mode === 'accountant'
                ? 'bg-brand-primary text-white'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Accountant
          </button>
          <button
            type="button"
            onClick={() => setMode('client')}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
              mode === 'client'
                ? 'bg-brand-primary text-white'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Client
          </button>
        </div>

        {mode === 'accountant' ? (
          <form className="space-y-4" onSubmit={handleAccountantLogin}>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-secondary">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@amebusiness.co.za"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-secondary">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={status.type === 'loading'}>
              {status.type === 'loading' ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleMagicLink}>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-secondary">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@business.co.za"
              />
              <p className="mt-1 text-xs text-ink-secondary">
                We'll email you a one-tap sign-in link.
              </p>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={status.type === 'loading'}>
              {status.type === 'loading' ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}

        {status.type === 'error' && (
          <p className="mt-4 text-sm text-brand-danger">{status.message}</p>
        )}
        {status.type === 'success' && (
          <p className="mt-4 text-sm text-brand-success">{status.message}</p>
        )}
      </div>
    </div>
  );
}
