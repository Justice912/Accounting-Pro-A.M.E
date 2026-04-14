import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/clients', label: 'Clients' },
  { to: '/receipts', label: 'Receipts' },
  { to: '/vat', label: 'VAT Schedules' },
  { to: '/reconciliation', label: 'Reconciliation' }
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-surface-base">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary text-sm font-bold text-white">
              AME
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-primary">VAT Capture</p>
              <p className="text-xs text-ink-secondary">AME Business</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-ink-secondary hover:bg-gray-100 hover:text-ink-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 px-4 py-3 text-xs text-ink-secondary">
          Phase 1 scaffold
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div>
            <h1 className="text-base font-semibold text-ink-primary">Accountant Dashboard</h1>
            <p className="text-xs text-ink-secondary">Multi-client receipt review and VAT automation</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-secondary">{user?.email ?? 'Signed in'}</span>
            <button type="button" onClick={handleLogout} className="btn-outline">
              Log out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
