import { useMemo, useState } from 'react';
import { useClients } from '../hooks/useClients.js';
import {
  createClient,
  updateClient,
  deactivateClient,
  reactivateClient
} from '../services/clientService.js';
import ClientForm from '../components/clients/ClientForm.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { formatPhoneForDisplay } from '../utils/validation.js';

export default function Clients() {
  const { clients, loading, error } = useClients();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (!showInactive && c.isActive === false) return false;
      if (!term) return true;
      return (
        (c.businessName || '').toLowerCase().includes(term) ||
        (c.tradingName || '').toLowerCase().includes(term) ||
        (c.vatNumber || '').includes(term) ||
        (c.contactPerson || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term)
      );
    });
  }, [clients, search, showInactive]);

  function openCreate() {
    setEditing(null);
    setSaveError(null);
    setFormOpen(true);
  }

  function openEdit(client) {
    setEditing(client);
    setSaveError(null);
    setFormOpen(true);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    setSaveError(null);
    try {
      if (editing && editing.id) {
        await updateClient(editing.id, values);
      } else {
        await createClient(values);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      console.error('[Clients] save failed', err);
      setSaveError(err.message || 'Failed to save client');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(client) {
    try {
      if (client.isActive === false) {
        await reactivateClient(client.id);
      } else {
        const ok = window.confirm(
          `Deactivate ${client.businessName}? They will no longer receive capture links.`
        );
        if (!ok) return;
        await deactivateClient(client.id);
      }
    } catch (err) {
      console.error('[Clients] toggle active failed', err);
      window.alert(err.message || 'Failed to update client');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Clients</h1>
          <p className="text-sm text-ink-secondary">
            Manage the businesses whose VAT you track. {clients.length} total
            {clients.length > 0 && `, ${clients.filter((c) => c.isActive !== false).length} active`}.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Add client
        </button>
      </header>

      <div className="card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="input md:max-w-md"
            placeholder="Search by name, VAT number, contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="inline-flex items-center gap-2 text-sm text-ink-primary">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-secondary"
            />
            Show inactive
          </label>
        </div>
      </div>

      {error && (
        <div className="card border-brand-danger/40 bg-brand-danger/5 p-4 text-sm text-brand-danger">
          Failed to load clients: {error.message}
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6">
            <Spinner label="Loading clients…" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState hasClients={clients.length > 0} onAdd={openCreate} />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-surface-base">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">VAT number</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">VAT cat.</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((client) => (
                <tr key={client.id} className="hover:bg-surface-base">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink-primary">{client.businessName}</div>
                    {client.tradingName && (
                      <div className="text-xs text-ink-secondary">t/a {client.tradingName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{client.vatNumber}</td>
                  <td className="px-4 py-3">
                    <div className="text-ink-primary">{client.contactPerson}</div>
                    <div className="text-xs text-ink-secondary">
                      {client.email}
                      {client.phone && ` · ${formatPhoneForDisplay(client.phone)}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">{client.vatCategory || '—'}</td>
                  <td className="px-4 py-3">
                    {client.isActive === false ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-secondary">
                        Inactive
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-brand-success/10 px-2 py-0.5 text-xs font-medium text-brand-success">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-xs font-semibold text-brand-secondary hover:underline"
                      onClick={() => openEdit(client)}
                    >
                      Edit
                    </button>
                    <span className="mx-2 text-gray-300">|</span>
                    <button
                      className="text-xs font-semibold text-ink-secondary hover:text-brand-danger hover:underline"
                      onClick={() => handleToggleActive(client)}
                    >
                      {client.isActive === false ? 'Reactivate' : 'Deactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {saveError && (
        <div className="card border-brand-danger/40 bg-brand-danger/5 p-4 text-sm text-brand-danger">
          {saveError}
        </div>
      )}

      <ClientForm
        open={formOpen}
        initialValues={editing || undefined}
        onSubmit={handleSubmit}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        submitting={submitting}
      />
    </div>
  );
}

function EmptyState({ hasClients, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="text-4xl">📇</div>
      <h3 className="text-base font-semibold text-ink-primary">
        {hasClients ? 'No clients match your filters' : 'No clients yet'}
      </h3>
      <p className="max-w-sm text-sm text-ink-secondary">
        {hasClients
          ? 'Try clearing the search or toggling "Show inactive".'
          : 'Add your first client to start capturing receipts and building VAT schedules.'}
      </p>
      {!hasClients && (
        <button className="btn-primary mt-2" onClick={onAdd}>
          + Add your first client
        </button>
      )}
    </div>
  );
}
