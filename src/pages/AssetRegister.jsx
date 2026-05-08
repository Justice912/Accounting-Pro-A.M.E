import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Download,
  FileDown,
  X,
  Edit2,
  ArrowDown,
  Package,
  Calendar,
  Calculator,
  TrendingDown,
  FileText,
  Filter,
} from 'lucide-react';
import { exportTablePdf } from '../utils/pdfReports.js';
import {
  TAX_SECTIONS,
  ASSET_CATEGORIES,
  DEPRECIATION_METHODS,
  COMPANY_TAX_RATE,
  netBookValue,
  accumulatedDepreciation,
  monthlyDepreciation,
  taxBase,
  taxAllowanceForYear,
  taxAllowanceToDate,
  deferredTax,
  temporaryDifference,
  disposalGainLoss,
  taxRecoupment,
  movementSchedule,
  registerSnapshot,
  depreciationInPeriod,
  fmtZAR,
} from '../utils/assetCalculations.js';

// Small helpers --------------------------------------------------------------

const todayIso = () => new Date().toISOString().slice(0, 10);
const yearStartIso = () => `${new Date().getFullYear()}-01-01`;
const yearEndIso = () => `${new Date().getFullYear()}-12-31`;

const newAssetTemplate = (companyId) => ({
  id: `AST${Date.now()}${Math.floor(Math.random() * 1000)}`,
  companyId,
  code: '',
  name: '',
  description: '',
  category: ASSET_CATEGORIES[0],
  location: '',
  serialNumber: '',
  acquisitionDate: todayIso(),
  costExclVat: 0,
  vatAmount: 0,
  costInclVat: 0,
  supplierName: '',
  invoiceRef: '',
  depreciationMethod: 'straight-line',
  usefulLifeMonths: 60,
  residualValue: 0,
  depreciationStartDate: '', // optional, defaults to acquisitionDate
  taxSection: 's11e_general_5yr',
  glAssetAccount: '',
  glAccumDepAccount: '',
  glDepExpenseAccount: 'Depreciation',
  status: 'active',
  disposalDate: null,
  disposalProceeds: null,
  disposalNotes: '',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const SUB_TABS = [
  { id: 'assets', label: 'Assets', icon: Package },
  { id: 'depreciation', label: 'Depreciation', icon: Calendar },
  { id: 'tax', label: 'Tax W&T', icon: Calculator },
  { id: 'deferred', label: 'Deferred Tax', icon: TrendingDown },
  { id: 'reports', label: 'Reports', icon: FileText },
];

// ----------------------------------------------------------------------------
// Top-level page
// ----------------------------------------------------------------------------

export default function AssetRegister({ assets = [], saveAssets, suppliers = [], accounts = [], company }) {
  const [activeTab, setActiveTab] = useState('assets');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [disposing, setDisposing] = useState(null);

  const companyAssets = useMemo(
    () => (company?.id ? assets.filter((a) => a.companyId === company.id) : assets),
    [assets, company?.id],
  );

  const handleSave = (asset) => {
    const others = assets.filter((a) => a.id !== asset.id);
    const next = { ...asset, updatedAt: new Date().toISOString() };
    saveAssets([...others, next]);
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) return;
    saveAssets(assets.filter((a) => a.id !== id));
  };

  const handleDispose = (asset, { date, proceeds, notes }) => {
    const next = {
      ...asset,
      status: 'disposed',
      disposalDate: date,
      disposalProceeds: Number(proceeds) || 0,
      disposalNotes: notes || '',
      updatedAt: new Date().toISOString(),
    };
    saveAssets(assets.map((a) => (a.id === asset.id ? next : a)));
    setDisposing(null);
  };

  const handleReinstate = (asset) => {
    if (!window.confirm('Re-instate this asset (undo the disposal)?')) return;
    const next = {
      ...asset,
      status: 'active',
      disposalDate: null,
      disposalProceeds: null,
      disposalNotes: '',
      updatedAt: new Date().toISOString(),
    };
    saveAssets(assets.map((a) => (a.id === asset.id ? next : a)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Asset Register</h2>
          <p className="text-sm text-slate-500">
            {company?.name || 'No company selected'}
            {' · '}
            <span className="font-medium text-slate-700">{companyAssets.length}</span>{' '}
            assets · Tax rate <span className="font-medium text-slate-700">{(COMPANY_TAX_RATE * 100).toFixed(0)}%</span>
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New asset
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white border border-slate-200 rounded-lg p-1 inline-flex flex-wrap gap-1">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {activeTab === 'assets' && (
        <AssetsTab
          assets={companyAssets}
          onEdit={(a) => {
            setEditing(a);
            setShowForm(true);
          }}
          onDispose={(a) => setDisposing(a)}
          onDelete={handleDelete}
          onReinstate={handleReinstate}
        />
      )}
      {activeTab === 'depreciation' && <DepreciationTab assets={companyAssets} />}
      {activeTab === 'tax' && <TaxScheduleTab assets={companyAssets} />}
      {activeTab === 'deferred' && <DeferredTaxTab assets={companyAssets} />}
      {activeTab === 'reports' && <ReportsTab assets={companyAssets} company={company} />}

      {/* Modals */}
      {showForm && (
        <AssetFormModal
          initial={editing || newAssetTemplate(company?.id)}
          suppliers={suppliers}
          accounts={accounts}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {disposing && (
        <DisposalModal
          asset={disposing}
          onSave={(payload) => handleDispose(disposing, payload)}
          onClose={() => setDisposing(null)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Assets list tab
// ----------------------------------------------------------------------------

function AssetsTab({ assets, onEdit, onDispose, onDelete, onReinstate }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (!q) return true;
      const hay = `${a.code} ${a.name} ${a.description} ${a.serialNumber} ${a.location}`.toLowerCase();
      return hay.includes(q);
    });
  }, [assets, search, statusFilter, categoryFilter]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-slate-200">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, serial, location..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-md text-sm px-2 py-1.5"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="disposed">Disposed</option>
          <option value="written-off">Written off</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-slate-300 rounded-md text-sm px-2 py-1.5"
        >
          <option value="all">All categories</option>
          {ASSET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Acquired</th>
              <th className="px-3 py-2 font-medium text-right">Cost</th>
              <th className="px-3 py-2 font-medium text-right">NBV (today)</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400 text-sm">
                  No assets match those filters.
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const nbv = netBookValue(a, todayIso());
              return (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{a.code || a.id.slice(-6)}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-800">{a.name}</div>
                    <div className="text-xs text-slate-500">{a.location || '—'}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{a.category}</td>
                  <td className="px-3 py-2 text-slate-600">{a.acquisitionDate}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{fmtZAR(a.costExclVat)}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{fmtZAR(nbv)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(a)}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {a.status === 'active' ? (
                        <button
                          onClick={() => onDispose(a)}
                          className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800 hover:bg-orange-200 font-medium"
                        >
                          Dispose
                        </button>
                      ) : (
                        <button
                          onClick={() => onReinstate(a)}
                          className="px-2 py-1 rounded text-xs bg-sky-100 text-sky-800 hover:bg-sky-200 font-medium"
                        >
                          Re-instate
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(a.id)}
                        className="p-1.5 rounded hover:bg-red-100 text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    active: 'bg-emerald-100 text-emerald-800',
    disposed: 'bg-slate-200 text-slate-700',
    'written-off': 'bg-red-100 text-red-800',
  }[status] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config}`}>
      {status}
    </span>
  );
}

// ----------------------------------------------------------------------------
// Add / edit modal
// ----------------------------------------------------------------------------

function AssetFormModal({ initial, suppliers, accounts, onSave, onClose }) {
  const [draft, setDraft] = useState(initial);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  // Auto-link cost incl VAT when excl + VAT change.
  const onCostChange = (excl, vat) => {
    update({
      costExclVat: Number(excl) || 0,
      vatAmount: Number(vat) || 0,
      costInclVat: (Number(excl) || 0) + (Number(vat) || 0),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      alert('Name is required.');
      return;
    }
    if (!draft.acquisitionDate) {
      alert('Acquisition date is required.');
      return;
    }
    if (!(Number(draft.costExclVat) > 0)) {
      alert('Cost (excl. VAT) must be greater than zero.');
      return;
    }
    onSave(draft);
  };

  const sectionOptions = Object.entries(TAX_SECTIONS);

  return (
    <Modal title={initial.code ? `Edit asset ${initial.code}` : 'New asset'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {/* Identity */}
        <Section title="Identity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Asset code">
              <input
                type="text"
                value={draft.code}
                onChange={(e) => update({ code: e.target.value })}
                placeholder="e.g. MV-001"
                className="form-input"
              />
            </Field>
            <Field label="Name *">
              <input
                type="text"
                required
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Toyota Hilux 2.4 GD-6"
                className="form-input"
              />
            </Field>
            <Field label="Category">
              <select
                value={draft.category}
                onChange={(e) => update({ category: e.target.value })}
                className="form-input"
              >
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <input
                type="text"
                value={draft.location}
                onChange={(e) => update({ location: e.target.value })}
                placeholder="Head office, Warehouse 2..."
                className="form-input"
              />
            </Field>
            <Field label="Serial number">
              <input
                type="text"
                value={draft.serialNumber}
                onChange={(e) => update({ serialNumber: e.target.value })}
                className="form-input"
              />
            </Field>
            <Field label="Description">
              <input
                type="text"
                value={draft.description}
                onChange={(e) => update({ description: e.target.value })}
                className="form-input"
              />
            </Field>
          </div>
        </Section>

        {/* Acquisition */}
        <Section title="Acquisition">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Acquisition date *">
              <input
                type="date"
                required
                value={draft.acquisitionDate}
                onChange={(e) => update({ acquisitionDate: e.target.value })}
                className="form-input"
              />
            </Field>
            <Field label="Supplier">
              <input
                type="text"
                list="supplier-list"
                value={draft.supplierName}
                onChange={(e) => update({ supplierName: e.target.value })}
                className="form-input"
                placeholder="Supplier name"
              />
              <datalist id="supplier-list">
                {(suppliers || []).map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </Field>
            <Field label="Invoice / reference">
              <input
                type="text"
                value={draft.invoiceRef}
                onChange={(e) => update({ invoiceRef: e.target.value })}
                className="form-input"
              />
            </Field>
            <Field label="Cost excl. VAT *">
              <input
                type="number"
                step="0.01"
                required
                value={draft.costExclVat}
                onChange={(e) => onCostChange(e.target.value, draft.vatAmount)}
                className="form-input"
              />
            </Field>
            <Field label="VAT amount">
              <input
                type="number"
                step="0.01"
                value={draft.vatAmount}
                onChange={(e) => onCostChange(draft.costExclVat, e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Cost incl. VAT">
              <input
                type="number"
                value={draft.costInclVat}
                disabled
                className="form-input bg-slate-50"
              />
            </Field>
          </div>
        </Section>

        {/* Accounting depreciation */}
        <Section title="Accounting depreciation">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Method">
              <select
                value={draft.depreciationMethod}
                onChange={(e) => update({ depreciationMethod: e.target.value })}
                className="form-input"
              >
                {DEPRECIATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Useful life (months)">
              <input
                type="number"
                min={1}
                value={draft.usefulLifeMonths}
                onChange={(e) => update({ usefulLifeMonths: Number(e.target.value) || 0 })}
                className="form-input"
              />
            </Field>
            <Field label="Residual value">
              <input
                type="number"
                step="0.01"
                value={draft.residualValue}
                onChange={(e) => update({ residualValue: Number(e.target.value) || 0 })}
                className="form-input"
              />
            </Field>
            <Field label="Depreciation start (optional)">
              <input
                type="date"
                value={draft.depreciationStartDate || ''}
                onChange={(e) => update({ depreciationStartDate: e.target.value })}
                className="form-input"
              />
            </Field>
            <Field label="Monthly charge (preview)">
              <input
                type="text"
                disabled
                value={fmtZAR(monthlyDepreciation(draft))}
                className="form-input bg-slate-50"
              />
            </Field>
          </div>
        </Section>

        {/* Tax */}
        <Section title="Tax (SARS Wear & Tear)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Section">
              <select
                value={draft.taxSection}
                onChange={(e) => update({ taxSection: e.target.value })}
                className="form-input"
              >
                {sectionOptions.map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year-1 allowance (preview)">
              <input
                type="text"
                disabled
                value={fmtZAR(taxAllowanceForYear(draft, 1))}
                className="form-input bg-slate-50"
              />
            </Field>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {TAX_SECTIONS[draft.taxSection]?.note}
          </p>
        </Section>

        {/* GL */}
        <Section title="GL accounts (optional)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Asset account">
              <input
                type="text"
                list="acc-list"
                value={draft.glAssetAccount}
                onChange={(e) => update({ glAssetAccount: e.target.value })}
                className="form-input"
              />
            </Field>
            <Field label="Accumulated depreciation">
              <input
                type="text"
                list="acc-list"
                value={draft.glAccumDepAccount}
                onChange={(e) => update({ glAccumDepAccount: e.target.value })}
                className="form-input"
              />
            </Field>
            <Field label="Depreciation expense">
              <input
                type="text"
                list="acc-list"
                value={draft.glDepExpenseAccount}
                onChange={(e) => update({ glDepExpenseAccount: e.target.value })}
                className="form-input"
              />
            </Field>
            <datalist id="acc-list">
              {(accounts || []).map((a) => (
                <option key={a.id || a.name} value={a.name} />
              ))}
            </datalist>
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <textarea
            value={draft.notes}
            onChange={(e) => update({ notes: e.target.value })}
            rows={2}
            className="form-input w-full"
          />
        </Section>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
          >
            Save asset
          </button>
        </div>
      </form>

      <style>{`
        .form-input { width: 100%; padding: 0.45rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; font-size: 0.875rem; }
        .form-input:focus { outline: none; border-color: #059669; box-shadow: 0 0 0 1px #059669; }
      `}</style>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Disposal modal
// ----------------------------------------------------------------------------

function DisposalModal({ asset, onSave, onClose }) {
  const [date, setDate] = useState(todayIso());
  const [proceeds, setProceeds] = useState(0);
  const [notes, setNotes] = useState('');

  const previewDisposal = useMemo(() => {
    const tmp = {
      ...asset,
      status: 'disposed',
      disposalDate: date,
      disposalProceeds: Number(proceeds) || 0,
    };
    return {
      nbvAtDisposal: netBookValue(tmp, date),
      gainLoss: disposalGainLoss(tmp),
      tax: taxRecoupment(tmp),
    };
  }, [asset, date, proceeds]);

  return (
    <Modal title={`Dispose: ${asset.name}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <Field label="Disposal date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="Disposal proceeds (excl. VAT)">
          <input
            type="number"
            step="0.01"
            value={proceeds}
            onChange={(e) => setProceeds(e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="Notes">
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input w-full"
          />
        </Field>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">NBV at disposal:</span>
            <span className="font-medium">{fmtZAR(previewDisposal.nbvAtDisposal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">IFRS gain / (loss):</span>
            <span className={`font-medium ${previewDisposal.gainLoss < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {fmtZAR(previewDisposal.gainLoss)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tax recoupment (s8(4)(a)):</span>
            <span className="font-medium">{fmtZAR(previewDisposal.tax.recoupment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Capital gain (CGT):</span>
            <span className="font-medium">{fmtZAR(previewDisposal.tax.capitalGain)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Scrapping allowance (s11(o)):</span>
            <span className="font-medium">{fmtZAR(previewDisposal.tax.scrappingAllowance)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave({ date, proceeds, notes })}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold"
          >
            Confirm disposal
          </button>
        </div>
      </div>
      <style>{`
        .form-input { width: 100%; padding: 0.45rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; font-size: 0.875rem; }
        .form-input:focus { outline: none; border-color: #059669; box-shadow: 0 0 0 1px #059669; }
      `}</style>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Depreciation schedule (monthly grid)
// ----------------------------------------------------------------------------

function DepreciationTab({ assets }) {
  const [year, setYear] = useState(new Date().getFullYear());

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        index: i,
        label: new Date(year, i, 1).toLocaleString('en-ZA', { month: 'short' }),
        from: `${year}-${String(i + 1).padStart(2, '0')}-01`,
        to: `${year}-${String(i + 1).padStart(2, '0')}-${new Date(year, i + 1, 0).getDate()}`,
      })),
    [year],
  );

  const rows = useMemo(() => {
    return assets.map((a) => {
      const monthly = months.map((m) => depreciationInPeriod(a, m.from, m.to));
      const total = monthly.reduce((s, n) => s + n, 0);
      return { asset: a, monthly, total };
    });
  }, [assets, months]);

  const monthlyTotals = months.map((_, i) => rows.reduce((s, r) => s + (r.monthly[i] || 0), 0));
  const grandTotal = monthlyTotals.reduce((s, n) => s + n, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="p-3 border-b border-slate-200 flex items-center gap-3">
        <label className="text-sm text-slate-600">Year</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value) || year)}
          className="border border-slate-300 rounded-md text-sm px-2 py-1 w-24"
        />
        <span className="ml-auto text-xs text-slate-500">
          Total {year}: <span className="font-semibold text-slate-700">{fmtZAR(grandTotal)}</span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 text-left font-medium sticky left-0 bg-slate-50">Asset</th>
              {months.map((m) => (
                <th key={m.label} className="px-2 py-2 text-right font-medium">
                  {m.label}
                </th>
              ))}
              <th className="px-2 py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center py-6 text-slate-400">
                  No assets to depreciate.
                </td>
              </tr>
            )}
            {rows.map(({ asset, monthly, total }) => (
              <tr key={asset.id} className="border-t border-slate-100">
                <td className="px-2 py-1.5 sticky left-0 bg-white">
                  <span className="font-medium text-slate-700">{asset.name}</span>
                  <span className="text-slate-400 ml-1">({asset.code || asset.id.slice(-6)})</span>
                </td>
                {monthly.map((v, i) => (
                  <td key={i} className="px-2 py-1.5 text-right text-slate-600">
                    {v > 0 ? fmtZAR(v) : '—'}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-right font-semibold text-slate-800">{fmtZAR(total)}</td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <td className="px-2 py-2 sticky left-0 bg-slate-50">Total</td>
                {monthlyTotals.map((t, i) => (
                  <td key={i} className="px-2 py-2 text-right">
                    {fmtZAR(t)}
                  </td>
                ))}
                <td className="px-2 py-2 text-right">{fmtZAR(grandTotal)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Tax W&T schedule (yearly)
// ----------------------------------------------------------------------------

function TaxScheduleTab({ assets }) {
  const [years] = useState(7);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-2 py-2 text-left font-medium">Asset</th>
            <th className="px-2 py-2 text-left font-medium">Section</th>
            <th className="px-2 py-2 text-right font-medium">Cost</th>
            {Array.from({ length: years }).map((_, i) => (
              <th key={i} className="px-2 py-2 text-right font-medium">
                Yr {i + 1}
              </th>
            ))}
            <th className="px-2 py-2 text-right font-semibold">Tax base today</th>
          </tr>
        </thead>
        <tbody>
          {assets.length === 0 && (
            <tr>
              <td colSpan={3 + years + 1} className="text-center py-6 text-slate-400">
                No assets.
              </td>
            </tr>
          )}
          {assets.map((a) => (
            <tr key={a.id} className="border-t border-slate-100">
              <td className="px-2 py-1.5">
                <span className="font-medium text-slate-700">{a.name}</span>
                <span className="text-slate-400 ml-1">({a.code || a.id.slice(-6)})</span>
              </td>
              <td className="px-2 py-1.5 text-slate-600">
                {TAX_SECTIONS[a.taxSection]?.label || a.taxSection}
              </td>
              <td className="px-2 py-1.5 text-right text-slate-700">{fmtZAR(a.costExclVat)}</td>
              {Array.from({ length: years }).map((_, i) => {
                const v = taxAllowanceForYear(a, i + 1);
                return (
                  <td key={i} className="px-2 py-1.5 text-right text-slate-600">
                    {v > 0 ? fmtZAR(v) : '—'}
                  </td>
                );
              })}
              <td className="px-2 py-1.5 text-right font-semibold text-slate-800">
                {fmtZAR(taxBase(a, todayIso()))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Deferred tax tab
// ----------------------------------------------------------------------------

function DeferredTaxTab({ assets }) {
  const today = todayIso();
  const rows = assets.map((a) => ({
    asset: a,
    nbv: netBookValue(a, today),
    tb: taxBase(a, today),
    diff: temporaryDifference(a, today),
    dt: deferredTax(a, today),
  }));
  const totals = rows.reduce(
    (acc, r) => ({
      nbv: acc.nbv + r.nbv,
      tb: acc.tb + r.tb,
      diff: acc.diff + r.diff,
      dt: acc.dt + r.dt,
    }),
    { nbv: 0, tb: 0, diff: 0, dt: 0 },
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Stat label="Net book value" value={fmtZAR(totals.nbv)} />
        <Stat label="Tax base" value={fmtZAR(totals.tb)} />
        <Stat
          label="Temporary difference"
          value={fmtZAR(totals.diff)}
          tone={totals.diff >= 0 ? 'pos' : 'neg'}
        />
        <Stat
          label={`Deferred tax @ ${(COMPANY_TAX_RATE * 100).toFixed(0)}%`}
          value={fmtZAR(totals.dt)}
          tone={totals.dt >= 0 ? 'liability' : 'asset'}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 text-left font-medium">Asset</th>
              <th className="px-2 py-2 text-right font-medium">Carrying amt</th>
              <th className="px-2 py-2 text-right font-medium">Tax base</th>
              <th className="px-2 py-2 text-right font-medium">Temp. diff</th>
              <th className="px-2 py-2 text-right font-medium">Deferred tax</th>
              <th className="px-2 py-2 text-right font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-400">
                  No assets.
                </td>
              </tr>
            )}
            {rows.map(({ asset, nbv, tb, diff, dt }) => (
              <tr key={asset.id} className="border-t border-slate-100">
                <td className="px-2 py-1.5">
                  <span className="font-medium text-slate-700">{asset.name}</span>
                </td>
                <td className="px-2 py-1.5 text-right text-slate-700">{fmtZAR(nbv)}</td>
                <td className="px-2 py-1.5 text-right text-slate-700">{fmtZAR(tb)}</td>
                <td className={`px-2 py-1.5 text-right ${diff < 0 ? 'text-sky-700' : 'text-orange-700'}`}>
                  {fmtZAR(diff)}
                </td>
                <td className={`px-2 py-1.5 text-right font-medium ${dt < 0 ? 'text-sky-700' : 'text-orange-700'}`}>
                  {fmtZAR(dt)}
                </td>
                <td className="px-2 py-1.5 text-right text-xs text-slate-500">
                  {dt >= 0 ? 'Liability' : 'Asset'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const toneClass =
    tone === 'pos'
      ? 'text-emerald-700'
      : tone === 'neg'
        ? 'text-red-700'
        : tone === 'liability'
          ? 'text-orange-700'
          : tone === 'asset'
            ? 'text-sky-700'
            : 'text-slate-800';
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reports tab — date-range filterable + Excel export
// ----------------------------------------------------------------------------

function ReportsTab({ assets, company }) {
  const [reportType, setReportType] = useState('listing');
  const [fromDate, setFromDate] = useState(yearStartIso());
  const [toDate, setToDate] = useState(yearEndIso());

  const REPORTS = [
    { id: 'listing', label: 'Asset listing (snapshot)' },
    { id: 'movement', label: 'Movement schedule (period)' },
    { id: 'depreciation', label: 'Depreciation by asset (period)' },
    { id: 'disposals', label: 'Disposals (period)' },
    { id: 'deferred', label: 'Deferred tax summary (asof to-date)' },
    { id: 'category', label: 'Roll-up by category' },
  ];

  const data = useMemo(() => {
    switch (reportType) {
      case 'listing':
        return assets.map((a) => ({
          Code: a.code || a.id.slice(-6),
          Name: a.name,
          Category: a.category,
          Acquired: a.acquisitionDate,
          'Cost (excl)': Number(a.costExclVat) || 0,
          'NBV (asof)': netBookValue(a, toDate),
          'Tax base (asof)': taxBase(a, toDate),
          Status: a.status,
        }));
      case 'movement': {
        const ms = movementSchedule(assets, fromDate, toDate);
        return [
          { Line: 'Opening NBV', Cost: ms.opening.cost, Accum: ms.opening.accum, NBV: ms.opening.nbv },
          { Line: 'Additions', Cost: ms.additions.cost, Accum: 0, NBV: ms.additions.cost },
          { Line: 'Depreciation expense', Cost: 0, Accum: ms.depreciation.expense, NBV: -ms.depreciation.expense },
          { Line: 'Disposals', Cost: -ms.disposals.cost, Accum: -ms.disposals.accum, NBV: -ms.disposals.nbv },
          { Line: 'Closing NBV', Cost: ms.closing.cost, Accum: ms.closing.accum, NBV: ms.closing.nbv },
        ];
      }
      case 'depreciation':
        return assets
          .map((a) => ({
            Code: a.code || a.id.slice(-6),
            Name: a.name,
            Category: a.category,
            'Period depreciation': depreciationInPeriod(a, fromDate, toDate),
            'Cumulative to date': accumulatedDepreciation(a, toDate),
            'NBV at end': netBookValue(a, toDate),
          }))
          .filter((r) => r['Period depreciation'] > 0);
      case 'disposals':
        return assets
          .filter((a) => a.status === 'disposed' && a.disposalDate >= fromDate && a.disposalDate <= toDate)
          .map((a) => {
            const t = taxRecoupment(a);
            return {
              Code: a.code || a.id.slice(-6),
              Name: a.name,
              'Disposal date': a.disposalDate,
              Cost: Number(a.costExclVat) || 0,
              'NBV at disposal': netBookValue(a, a.disposalDate),
              Proceeds: Number(a.disposalProceeds) || 0,
              'Gain / (loss)': disposalGainLoss(a),
              'Tax recoupment': t.recoupment,
              'Capital gain': t.capitalGain,
              'Scrapping allow.': t.scrappingAllowance,
            };
          });
      case 'deferred':
        return assets.map((a) => ({
          Code: a.code || a.id.slice(-6),
          Name: a.name,
          NBV: netBookValue(a, toDate),
          'Tax base': taxBase(a, toDate),
          'Temp. difference': temporaryDifference(a, toDate),
          'Deferred tax': deferredTax(a, toDate),
        }));
      case 'category': {
        const map = new Map();
        for (const a of assets) {
          const key = a.category || 'Other';
          const acc = map.get(key) || { Category: key, Count: 0, Cost: 0, NBV: 0, 'Tax base': 0 };
          acc.Count += 1;
          acc.Cost += Number(a.costExclVat) || 0;
          acc.NBV += netBookValue(a, toDate);
          acc['Tax base'] += taxBase(a, toDate);
          map.set(key, acc);
        }
        return Array.from(map.values());
      }
      default:
        return [];
    }
  }, [reportType, assets, fromDate, toDate]);

  const handleExport = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default || (await import('exceljs'));
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(REPORTS.find((r) => r.id === reportType)?.label || 'Report');
      if (data.length === 0) {
        ws.addRow(['No data']);
      } else {
        const headers = Object.keys(data[0]);
        ws.addRow(headers);
        ws.getRow(1).font = { bold: true };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        for (const row of data) ws.addRow(headers.map((h) => row[h]));
        ws.columns.forEach((col) => {
          col.width = 18;
        });
        // ZAR format on numeric columns.
        headers.forEach((h, i) => {
          const sample = data[0][h];
          if (typeof sample === 'number') {
            ws.getColumn(i + 1).numFmt = '"R"#,##0.00';
          }
        });
      }
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const safeName = (company?.name || 'Asset Register').replace(/[^a-z0-9-]+/gi, '_');
      a.download = `${safeName}_${reportType}_${toDate}.xlsx`;
      a.click();
    } catch (err) {
      alert(`Export failed: ${err.message || err}`);
    }
  };

  // PDF export. Builds column metadata from the same data shape Excel uses;
  // any column whose first row is numeric is right-aligned and ZAR-formatted.
  // For numeric columns we add a totals row except for the movement report,
  // which already presents pre-aggregated lines (Opening / Additions / etc).
  const handleExportPdf = async () => {
    try {
      const reportLabel = REPORTS.find((r) => r.id === reportType)?.label || 'Report';
      const safeName = (company?.name || 'Asset Register').replace(/[^a-z0-9-]+/gi, '_');
      const filename = `${safeName}_${reportType}_${toDate}.pdf`;

      // Build column metadata.
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      const numericByKey = {};
      for (const h of headers) numericByKey[h] = typeof data[0][h] === 'number';

      const columns = headers.map((h) => {
        const isNum = numericByKey[h];
        return {
          key: h,
          header: h,
          align: isNum ? 'right' : 'left',
          format: isNum ? (v) => fmtZAR(v) : (v) => (v == null ? '' : String(v)),
          // Slightly wider weight on the first text column so names/codes don't truncate.
          weight: isNum ? 1 : h.toLowerCase().includes('name') || h.toLowerCase().includes('description') ? 2.2 : 1.3,
        };
      });

      // Totals row for reports where summing makes sense.
      const showTotals = ['listing', 'depreciation', 'disposals', 'deferred', 'category'].includes(reportType);
      let totals = null;
      if (showTotals && data.length > 0) {
        totals = {};
        const firstNum = headers.find((h) => numericByKey[h]);
        for (const h of headers) {
          if (numericByKey[h]) {
            totals[h] = data.reduce((s, r) => s + (Number(r[h]) || 0), 0);
          } else {
            totals[h] = h === headers[0] || h === firstNum ? 'Total' : '';
          }
        }
      }

      const period =
        reportType === 'movement' ||
        reportType === 'depreciation' ||
        reportType === 'disposals'
          ? `${fromDate} to ${toDate}`
          : null;

      await exportTablePdf({
        filename,
        title: `Asset Register — ${reportLabel}`,
        subtitle: undefined,
        company: company?.name || '',
        period,
        asof: !period ? toDate : undefined,
        columns,
        rows: data,
        totals,
      });
    } catch (err) {
      alert(`PDF export failed: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3 flex flex-wrap items-end gap-3">
        <Field label="Report">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border border-slate-300 rounded-md text-sm px-2 py-1.5 min-w-56"
          >
            {REPORTS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-slate-300 rounded-md text-sm px-2 py-1.5"
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-slate-300 rounded-md text-sm px-2 py-1.5"
          />
        </Field>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={data.length === 0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-sm font-semibold"
          >
            <FileDown className="w-4 h-4" />
            Export to PDF
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {data.length > 0 &&
                Object.keys(data[0]).map((h) => (
                  <th key={h} className="px-2 py-2 text-left font-medium">
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td className="text-center py-6 text-slate-400 px-3">No data for this report.</td>
              </tr>
            )}
            {data.map((row, idx) => (
              <tr key={idx} className="border-t border-slate-100">
                {Object.values(row).map((v, i) => (
                  <td key={i} className={`px-2 py-1.5 ${typeof v === 'number' ? 'text-right tabular-nums' : ''}`}>
                    {typeof v === 'number' ? fmtZAR(v) : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
