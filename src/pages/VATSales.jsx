import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  HelpCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  getComplianceTone,
  getSalesInvoiceDraft,
} from './vatComplianceViewModel.js';

const STATUS = {
  pending: { label: 'Pending', icon: Clock, badge: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', icon: CheckCircle2, badge: 'bg-emerald-100 text-emerald-800' },
  query: { label: 'Query', icon: HelpCircle, badge: 'bg-sky-100 text-sky-800' },
  rejected: { label: 'Rejected', icon: XCircle, badge: 'bg-rose-100 text-rose-800' },
};

function toZAR(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function currentPeriod() {
  const date = new Date();
  const month = date.getMonth() + 1;
  const start = month % 2 === 0 ? month - 1 : month;
  return `${date.getFullYear()}-${String(start).padStart(2, '0')}`;
}

function periodLabel(period) {
  if (!period) return '';
  const [year, month] = period.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[month - 1]}/${months[month]} ${year}`;
}

function buildPeriodOptions() {
  const options = [];
  const now = new Date();
  for (let index = 0; index < 8; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index * 2, 1);
    const month = date.getMonth() + 1;
    const start = month % 2 === 0 ? month - 1 : month;
    options.push(`${date.getFullYear()}-${String(start).padStart(2, '0')}`);
  }
  return [...new Set(options)];
}

function normalizeLineItems(lineItems) {
  if (Array.isArray(lineItems)) return lineItems;
  if (typeof lineItems === 'string') {
    try {
      const parsed = JSON.parse(lineItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function hydrateDraft(invoice, selectedClientId) {
  return {
    ...getSalesInvoiceDraft(invoice?.client_id || selectedClientId),
    ...invoice,
    line_items: normalizeLineItems(invoice?.line_items),
  };
}

function StatusBadge({ status }) {
  const config = STATUS[status] || STATUS.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-800">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    info: 'bg-sky-600',
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    warning: 'bg-amber-500 text-slate-900',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-lg ${styles[type] || styles.info}`}>
      <span>{message}</span>
      <button onClick={onClose} className="opacity-80 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function DraftField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1B4F72]"
      />
    </label>
  );
}

export default function VATSales() {
  const api = window.api;
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod());
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [draft, setDraft] = useState(getSalesInvoiceDraft(''));
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const periodOptions = useMemo(() => buildPeriodOptions(), []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const loadClients = useCallback(async () => {
    if (!api?.listClients) return;
    try {
      const list = await api.listClients();
      setClients(list || []);
      if (!selectedClientId && list?.length) {
        setSelectedClientId(list[0].id);
      }
    } catch (error) {
      console.error('[VATSales] loadClients error:', error);
    }
  }, [api, selectedClientId]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const openInvoice = useCallback(async (invoice) => {
    if (!invoice) return;
    try {
      const detailed = api?.vatGetSalesInvoice ? await api.vatGetSalesInvoice(invoice.id) : invoice;
      const nextInvoice = detailed || invoice;
      setSelectedInvoiceId(nextInvoice.id || null);
      setSelectedInvoice(nextInvoice);
      setDraft(hydrateDraft(nextInvoice, selectedClientId));
    } catch (error) {
      console.error('[VATSales] openInvoice error:', error);
    }
  }, [api, selectedClientId]);

  const loadSales = useCallback(async () => {
    if (!selectedClientId || !api?.vatListSales) {
      setSales([]);
      return;
    }

    setLoading(true);
    try {
      const list = await api.vatListSales(selectedClientId, { period: selectedPeriod });
      setSales(list || []);

      if (selectedInvoiceId) {
        const refreshed = (list || []).find(invoice => invoice.id === selectedInvoiceId);
        if (refreshed) {
          setSelectedInvoice(refreshed);
          setDraft(hydrateDraft(refreshed, selectedClientId));
        }
      }
    } catch (error) {
      console.error('[VATSales] loadSales error:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [api, selectedClientId, selectedInvoiceId, selectedPeriod]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    if (!selectedClientId) return;
    setSelectedInvoiceId(null);
    const nextDraft = {
      ...getSalesInvoiceDraft(selectedClientId),
      vat_period: selectedPeriod,
    };
    setSelectedInvoice(nextDraft);
    setDraft(nextDraft);
  }, [selectedClientId, selectedPeriod]);

  const filteredSales = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sales;
    return sales.filter(invoice => (
      String(invoice.invoice_number || '').toLowerCase().includes(query) ||
      String(invoice.customer_name || '').toLowerCase().includes(query)
    ));
  }, [sales, searchQuery]);

  const selectedClient = clients.find(client => client.id === selectedClientId) || null;
  const summary = useMemo(() => {
    const outputVat = filteredSales.reduce((sum, invoice) => sum + (Number(invoice.vat_amount) || 0), 0);
    const averageScore = filteredSales.length
      ? filteredSales.reduce((sum, invoice) => sum + (Number(invoice.compliance_score) || 0), 0) / filteredSales.length
      : 0;
    return {
      count: filteredSales.length,
      outputVat,
      averageScore,
    };
  }, [filteredSales]);

  const startNewInvoice = useCallback(() => {
    const nextDraft = {
      ...getSalesInvoiceDraft(selectedClientId),
      vat_period: selectedPeriod,
    };
    setSelectedInvoiceId(null);
    setSelectedInvoice(nextDraft);
    setDraft(nextDraft);
  }, [selectedClientId, selectedPeriod]);

  const saveInvoice = useCallback(async () => {
    if (!selectedClientId || !api?.vatSaveSalesInvoice) return;
    const payload = {
      ...draft,
      client_id: selectedClientId,
      vat_period: selectedPeriod,
    };
    const result = await api.vatSaveSalesInvoice(payload);
    if (!result?.success) {
      showToast(result?.error || 'Could not save sales invoice', 'error');
      return;
    }

    showToast('Sales invoice saved', 'success');
    await loadSales();
    const detailed = api?.vatGetSalesInvoice ? await api.vatGetSalesInvoice(result.id) : null;
    const nextInvoice = detailed || {
      ...payload,
      id: result.id,
      compliance_score: result.compliance?.summary?.complianceScore || 0,
      supply_type: result.compliance?.summary?.supplyType || 'standard',
      supply_type_reason: result.compliance?.summary?.supplyTypeReason || null,
      duplicate_status: result.compliance?.summary?.duplicateStatus || 'clear',
      time_of_supply_date: result.compliance?.summary?.timeOfSupplyDate || payload.invoice_date,
    };
    setSelectedInvoiceId(result.id);
    setSelectedInvoice(nextInvoice);
    setDraft(hydrateDraft(nextInvoice, selectedClientId));
  }, [api, draft, loadSales, selectedClientId, selectedPeriod, showToast]);

  const deleteInvoice = useCallback(async () => {
    if (!selectedInvoiceId || !api?.vatDeleteSalesInvoice) return;
    if (!window.confirm('Delete this sales invoice?')) return;
    const result = await api.vatDeleteSalesInvoice(selectedInvoiceId);
    if (!result?.success) {
      showToast(result?.error || 'Could not delete sales invoice', 'error');
      return;
    }

    showToast('Sales invoice deleted', 'warning');
    setSelectedInvoiceId(null);
    setSelectedInvoice(null);
    setDraft(getSalesInvoiceDraft(selectedClientId));
    loadSales();
  }, [api, loadSales, selectedClientId, selectedInvoiceId, showToast]);

  const updateStatus = useCallback(async (status) => {
    if (!selectedInvoiceId || !api?.vatUpdateSalesInvoiceStatus) return;
    const result = await api.vatUpdateSalesInvoiceStatus(
      selectedInvoiceId,
      status,
      draft.review_notes || selectedInvoice?.review_notes || ''
    );
    if (!result?.success) {
      showToast(result?.error || 'Could not update sales status', 'error');
      return;
    }

    showToast(`Sales invoice marked ${status}`, 'success');
    await loadSales();
    if (selectedInvoiceId && api?.vatGetSalesInvoice) {
      const refreshed = await api.vatGetSalesInvoice(selectedInvoiceId);
      if (refreshed) {
        setSelectedInvoice(refreshed);
        setDraft(hydrateDraft(refreshed, selectedClientId));
      }
    }
  }, [api, draft.review_notes, loadSales, selectedClientId, selectedInvoice, selectedInvoiceId, showToast]);

  const complianceTone = getComplianceTone(
    selectedInvoice?.compliance_score || draft.compliance_score || 0,
    0
  );

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#1B4F72]" />
              <h1 className="text-lg font-semibold text-slate-900">VAT Sales</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Separate output-VAT workflow for sales invoices, credit notes, and advisory review.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadSales}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={startNewInvoice}
              disabled={!selectedClientId}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] px-3 py-2 text-sm font-medium text-white hover:bg-[#2E75B6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <Building2 className="h-4 w-4 text-slate-400" />
            <select
              value={selectedClientId}
              onChange={event => setSelectedClientId(event.target.value)}
              className="bg-transparent outline-none"
            >
              {!clients.length && <option value="">No clients</option>}
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>

          <select
            value={selectedPeriod}
            onChange={event => setSelectedPeriod(event.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
          >
            {periodOptions.map(period => (
              <option key={period} value={period}>{periodLabel(period)}</option>
            ))}
          </select>

          <label className="flex min-w-[240px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search customer or invoice..."
              className="w-full bg-transparent outline-none"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-4 lg:grid-cols-3">
        <MetricCard label="Invoices" value={summary.count} sub={selectedClient?.name || 'Select a client'} />
        <MetricCard label="Output VAT" value={toZAR(summary.outputVat)} sub={periodLabel(selectedPeriod)} />
        <MetricCard label="Avg Compliance" value={`${Math.round(summary.averageScore || 0)}`} sub="Advisory-first score" />
      </div>

      <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
        <div className="flex min-h-0 w-[46%] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="text-sm font-semibold text-slate-800">Sales invoices</div>
            <div className="text-xs text-slate-500">Output VAT documents for {selectedClient?.name || 'the selected client'}.</div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm text-slate-500">Loading sales invoices…</div>
            ) : !filteredSales.length ? (
              <div className="px-4 py-6 text-sm text-slate-500">No sales invoices found for this period yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Invoice</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(invoice => (
                    <tr
                      key={invoice.id}
                      onClick={() => openInvoice(invoice)}
                      className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${
                        selectedInvoiceId === invoice.id ? 'bg-[#EAF2F8]' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">{invoice.invoice_number || invoice.id}</td>
                      <td className="px-4 py-3 text-slate-600">{invoice.customer_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{Math.round(Number(invoice.compliance_score) || 0)}</td>
                      <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{toZAR(invoice.total_incl_vat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedInvoiceId ? 'Sales detail' : 'Draft sales invoice'}
                </div>
                <div className="text-xs text-slate-500">
                  Review compliance outcome, then save or update status.
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedInvoiceId && (
                  <button
                    onClick={deleteInvoice}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
                <button
                  onClick={saveInvoice}
                  disabled={!selectedClientId}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#1B4F72] px-3 py-2 text-xs font-medium text-white hover:bg-[#2E75B6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save invoice
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!selectedClientId ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Create a client first, then come back here to capture sales invoices.
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`rounded-xl border p-4 ${complianceTone.panelClass}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compliance summary</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${complianceTone.badgeClass}`}>
                          Score {Math.round(Number(selectedInvoice?.compliance_score || draft.compliance_score) || 0)}
                        </span>
                        <span className="text-xs text-slate-600">{complianceTone.label}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <div>Supply type: {selectedInvoice?.supply_type || draft.supply_type || 'pending'}</div>
                      <div>Duplicate: {selectedInvoice?.duplicate_status || draft.duplicate_status || 'clear'}</div>
                      <div>Time of supply: {selectedInvoice?.time_of_supply_date || draft.time_of_supply_date || draft.invoice_date || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <DraftField
                    label="Customer name"
                    value={draft.customer_name}
                    onChange={value => setDraft(previous => ({ ...previous, customer_name: value }))}
                  />
                  <DraftField
                    label="Customer VAT number"
                    value={draft.customer_vat_number}
                    onChange={value => setDraft(previous => ({ ...previous, customer_vat_number: value }))}
                  />
                  <DraftField
                    label="Invoice number"
                    value={draft.invoice_number}
                    onChange={value => setDraft(previous => ({ ...previous, invoice_number: value }))}
                  />
                  <DraftField
                    label="Invoice date"
                    type="date"
                    value={draft.invoice_date}
                    onChange={value => setDraft(previous => ({ ...previous, invoice_date: value }))}
                  />
                  <DraftField
                    label="Total excl VAT"
                    type="number"
                    value={draft.total_excl_vat}
                    onChange={value => setDraft(previous => ({ ...previous, total_excl_vat: value }))}
                  />
                  <DraftField
                    label="VAT amount"
                    type="number"
                    value={draft.vat_amount}
                    onChange={value => setDraft(previous => ({ ...previous, vat_amount: value }))}
                  />
                  <DraftField
                    label="Total incl VAT"
                    type="number"
                    value={draft.total_incl_vat}
                    onChange={value => setDraft(previous => ({ ...previous, total_incl_vat: value }))}
                  />
                  <DraftField
                    label="Document type"
                    value={draft.document_type}
                    onChange={value => setDraft(previous => ({ ...previous, document_type: value }))}
                  />
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500">Customer address</span>
                  <textarea
                    value={draft.customer_address || ''}
                    onChange={event => setDraft(previous => ({ ...previous, customer_address: event.target.value }))}
                    rows={3}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1B4F72]"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500">Review notes</span>
                  <textarea
                    value={draft.review_notes || ''}
                    onChange={event => setDraft(previous => ({ ...previous, review_notes: event.target.value }))}
                    rows={3}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1B4F72]"
                  />
                </label>

                {selectedInvoiceId && (
                  <div className="flex flex-wrap gap-2">
                    {['approved', 'query', 'rejected', 'pending'].map(status => (
                      <button
                        key={status}
                        onClick={() => updateStatus(status)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Mark {STATUS[status]?.label || status}
                      </button>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="mb-2 flex items-center gap-2 font-medium text-slate-700">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Advisory-first review
                  </div>
                  <div>
                    Sales invoices are evaluated and stored through the same VAT rules engine as purchases, but shown here in a separate workflow so output VAT can be reviewed independently.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
