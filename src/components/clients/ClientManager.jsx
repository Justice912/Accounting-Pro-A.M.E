import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, X, Save, Search, Building2, User } from 'lucide-react';
import {
  getClientVatSettingsDraft,
  normalizeClientVatSettingsInput,
  VAT_CATEGORY_OPTIONS,
} from './clientVatSettingsViewModel.js';

const FIELD_DEFS = [
  { key: 'name', label: 'Client Name', required: true },
  { key: 'trading_name', label: 'Trading Name' },
  { key: 'type', label: 'Type', type: 'select', options: ['individual', 'company', 'trust', 'cc', 'partnership', 'npo'] },
  { key: 'registration_number', label: 'Registration / ID Number' },
  { key: 'vat_number', label: 'VAT Number' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'contact_person', label: 'Contact Person' },
  { key: 'address', label: 'Address', type: 'textarea' },
  { key: 'industry', label: 'Industry' },
  { key: 'financial_year_end', label: 'Financial Year End', type: 'select', options: ['January','February','March','April','May','June','July','August','September','October','November','December'] },
  { key: 'tax_history', label: 'Tax History', type: 'textarea' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const emptyClient = Object.fromEntries(FIELD_DEFS.map(f => [f.key, '']));

function createEmptyClientForm() {
  return {
    ...emptyClient,
    ...getClientVatSettingsDraft(),
    type: 'individual',
  };
}

export default function ClientManager({ onClose, initialMode = 'list' }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(initialMode === 'new' ? 'new' : null); // null = list view, 'new' = create, id = edit
  const [form, setForm] = useState(createEmptyClientForm());
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(async () => {
    if (!window.api?.listClients) return;
    const list = await window.api.listClients();
    setClients(list || []);
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q)
      || (c.trading_name || '').toLowerCase().includes(q)
      || (c.registration_number || '').toLowerCase().includes(q)
      || (c.email || '').toLowerCase().includes(q);
  });

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        ...normalizeClientVatSettingsInput(form),
      };
      if (editing === 'new') {
        await window.api.createClient(payload);
      } else {
        await window.api.updateClient(editing, payload);
      }
      setEditing(null);
      setForm(createEmptyClientForm());
      await loadClients();
    } catch (e) {
      console.error('Save client error:', e);
    }
    setSaving(false);
  };

  const handleEdit = (client) => {
    setEditing(client.id);
    const f = {};
    FIELD_DEFS.forEach(d => { f[d.key] = client[d.key] || ''; });
    setForm({
      ...createEmptyClientForm(),
      ...f,
      ...getClientVatSettingsDraft(client),
    });
  };

  const handleDelete = async (id) => {
    await window.api.deleteClient(id);
    await loadClients();
  };

  const handleNew = () => {
    setEditing('new');
    setForm(createEmptyClientForm());
  };

  // Edit / Create form
  if (editing) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-xl sticky top-0">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              {editing === 'new' ? 'New Client' : 'Edit Client'}
            </h2>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIELD_DEFS.map(field => (
              <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={form[field.key]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  >
                    <option value="">-- Select --</option>
                    {field.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={form[field.key]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-400 focus:outline-none resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={form[field.key]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  />
                )}
              </div>
            ))}

            <div className="sm:col-span-2 mt-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-800">VAT Settings</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Practitioner-maintained VAT assumptions used by compliance review and period summaries.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-white px-3 py-3">
                  <input
                    type="checkbox"
                    checked={!!form.vat_registered}
                    onChange={e => setForm(prev => ({ ...prev, vat_registered: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-700">VAT registered</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Use this to reflect whether the client is currently registered as a VAT vendor.
                    </span>
                  </span>
                </label>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    VAT category
                  </label>
                  <select
                    value={form.vat_category}
                    onChange={e => setForm(prev => ({ ...prev, vat_category: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  >
                    <option value="">-- Select category --</option>
                    {VAT_CATEGORY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Filing category helps frame the client&apos;s normal VAT submission cadence.
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-white px-3 py-3">
                  <input
                    type="checkbox"
                    checked={!!form.has_mixed_supplies}
                    onChange={e => setForm(prev => ({ ...prev, has_mixed_supplies: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-700">Has mixed supplies</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Enable this when the client makes both taxable and exempt supplies for apportionment reviews.
                    </span>
                  </span>
                </label>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Apportionment ratio
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.apportionment_ratio}
                    onChange={e => setForm(prev => ({ ...prev, apportionment_ratio: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Capture the taxable-use percentage applied when mixed supplies affect input VAT recovery.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Penalty interest rate
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.penalty_interest_rate}
                    onChange={e => setForm(prev => ({ ...prev, penalty_interest_rate: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Store the annual percentage rate used for late-payment penalty and interest estimates.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-xl sticky bottom-0">
            <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name?.trim()}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Client Management
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> New Client
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="flex-1 bg-transparent text-sm text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{clients.length === 0 ? 'No clients yet. Create your first client.' : 'No matching clients.'}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-800 truncate">{c.name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{c.type || 'individual'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {c.registration_number && <span className="text-xs text-slate-400">Reg: {c.registration_number}</span>}
                      {c.email && <span className="text-xs text-slate-400">{c.email}</span>}
                      {c.phone && <span className="text-xs text-slate-400">{c.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-slate-50 rounded-b-xl text-xs text-slate-400 text-center">
          {clients.length} client{clients.length !== 1 ? 's' : ''} total
        </div>
      </div>
    </div>
  );
}
