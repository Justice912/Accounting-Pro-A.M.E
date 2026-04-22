import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, Receipt, FileSpreadsheet, AlertTriangle,
  CheckCircle2, Clock, ChevronDown, RefreshCw, ArrowRight,
  Banknote, Bell, ShieldCheck, AlertCircle, XCircle,
  Plus, CalendarDays,
} from 'lucide-react';
import {
  buildVatPeriodOptions,
  currentVatPeriod,
  formatVatPeriodLabel,
  getVatPeriodDateRange,
  normalizeVatPeriodSelection,
} from './vatPeriodViewModel.js';
import ClientManager from '../components/clients/ClientManager.jsx';

function toZAR(v) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(Number(v) || 0);
}

const URGENCY = {
  high:   { label: 'Urgent',      bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700',    dot: 'bg-red-500',    icon: AlertTriangle },
  medium: { label: 'Attention',   bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700',  dot: 'bg-amber-500',  icon: AlertCircle },
  low:    { label: 'Pending',     bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500',   icon: Clock },
  clear:  { label: 'Up to date',  bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500',  icon: CheckCircle2 },
};

const SCHEDULE_STATUS = {
  current: { label: 'Current',  icon: CheckCircle2, color: 'text-green-600' },
  stale:   { label: 'Stale',    icon: AlertCircle,  color: 'text-amber-600' },
  missing: { label: 'Missing',  icon: XCircle,      color: 'text-red-500' },
  custom:  { label: 'Custom dates', icon: CalendarDays, color: 'text-slate-500' },
};

function UrgencyBadge({ urgency }) {
  const u = URGENCY[urgency] || URGENCY.clear;
  const Icon = u.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.bg} ${u.text}`}>
      <Icon className="w-3 h-3" />
      {u.label}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color = 'text-slate-800' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ClientCard({ client, onOpen, onPreview }) {
  const u = URGENCY[client.urgency] || URGENCY.clear;
  const sched = SCHEDULE_STATUS[client.schedule.status] || SCHEDULE_STATUS.missing;
  const SchedIcon = sched.icon;
  const matchRate = client.bank.total > 0
    ? Math.round((client.bank.matched / client.bank.total) * 100)
    : null;

  return (
    <div className={`rounded-xl border ${u.border} ${u.bg} p-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{client.name}</h3>
          {client.vatNumber && (
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{client.vatNumber}</p>
          )}
        </div>
        <UrgencyBadge urgency={client.urgency} />
      </div>

      {/* Receipt stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-slate-700">{client.receipts.total}</div>
          <div className="text-[10px] text-slate-400 uppercase">Total</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${client.receipts.pending > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
            {client.receipts.pending}
          </div>
          <div className="text-[10px] text-slate-400 uppercase">Pending</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${client.receipts.approved > 0 ? 'text-green-600' : 'text-slate-300'}`}>
            {client.receipts.approved}
          </div>
          <div className="text-[10px] text-slate-400 uppercase">Approved</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${client.receipts.flagged > 0 ? 'text-red-600' : 'text-slate-300'}`}>
            {client.receipts.flagged}
          </div>
          <div className="text-[10px] text-slate-400 uppercase">Flagged</div>
        </div>
      </div>

      {/* Bottom row: schedule, bank, reminders */}
      <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
        <div className="flex items-center gap-1">
          <SchedIcon className={`w-3.5 h-3.5 ${sched.color}`} />
          <span className={sched.color}>Schedule: {sched.label}</span>
        </div>
        {matchRate !== null && (
          <div className="flex items-center gap-1 text-slate-500">
            <Banknote className="w-3.5 h-3.5" />
            {matchRate}% matched
          </div>
        )}
        {client.reminders > 0 && (
          <div className="flex items-center gap-1 text-rose-500">
            <Bell className="w-3.5 h-3.5" />
            {client.reminders}
          </div>
        )}
      </div>

      {/* Input VAT */}
      {client.inputVat > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-200/60 flex justify-between text-xs">
          <span className="text-slate-500">Input VAT claimable</span>
          <span className="font-semibold text-[#1B4F72] font-mono">{toZAR(client.inputVat)}</span>
        </div>
      )}

      <div className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>Compliance score</span>
          <span className="font-semibold text-slate-800">{Math.round(client.complianceScore || 0)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>Penalty risk</span>
          <span className="font-semibold text-slate-800">{toZAR(client.penaltyRisk)}</span>
        </div>
      </div>
      {client.complianceScore < 50 && (
        <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          Critical compliance work is still unresolved for this VAT period.
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onOpen(client.id)}
          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          Open
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={() => onPreview(client.id)}
          className="inline-flex items-center gap-1 rounded-lg bg-[#1B4F72] px-3 py-2 text-xs font-medium text-white hover:bg-[#2E75B6]"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          VAT201
        </button>
      </div>
    </div>
  );
}

export default function VATDashboard() {
  const navigate = useNavigate();
  const initialPeriod = currentVatPeriod();
  const initialRange = getVatPeriodDateRange(initialPeriod);
  const [period, setPeriod] = useState(initialPeriod);
  const [periodMode, setPeriodMode] = useState('preset');
  const [customStartDate, setCustomStartDate] = useState(initialRange.startDate);
  const [customEndDate, setCustomEndDate] = useState(initialRange.endDate);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showClientManager, setShowClientManager] = useState(false);
  const [clientManagerMode, setClientManagerMode] = useState('list');

  const periods = useMemo(() => buildVatPeriodOptions(), []);
  const periodSelection = useMemo(() => normalizeVatPeriodSelection({
    periodMode,
    selectedPeriod: period,
    customStartDate,
    customEndDate,
  }), [customEndDate, customStartDate, period, periodMode]);

  const load = useCallback(async () => {
    if (!periodSelection.isValid) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await window.api?.vatDashboardGet(periodSelection.isCustom
        ? periodSelection.filters
        : periodSelection.period);
      setData(res);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [periodSelection]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (periodMode !== 'preset') return;
    const range = getVatPeriodDateRange(period);
    setCustomStartDate(range.startDate);
    setCustomEndDate(range.endDate);
  }, [period, periodMode]);

  const handlePeriodChange = (e) => setPeriod(e.target.value);

  const openClientManager = useCallback((mode = 'list') => {
    setClientManagerMode(mode);
    setShowClientManager(true);
  }, []);

  const handleOpenClient = (clientId) => {
    const params = new URLSearchParams({
      client: clientId,
      ...periodSelection.queryParams,
    });
    navigate(`/vat-capture?${params.toString()}`);
  };

  const handlePreviewClient = (clientId) => {
    const params = new URLSearchParams({
      client: clientId,
      ...periodSelection.queryParams,
    });
    navigate(`/vat201-preview?${params.toString()}`);
  };

  const filteredClients = useMemo(() => {
    if (!data?.clients) return [];
    if (filter === 'all') return data.clients;
    return data.clients.filter(c => c.urgency === filter);
  }, [data, filter]);

  const s = data?.summary || {};

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-[#1B4F72]" />
              <h1 className="text-lg font-bold text-slate-800">VAT Practice Dashboard</h1>
            </div>
            <p className="text-sm text-slate-500">
              Overview of all clients' VAT status for the selected period.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => openClientManager('new')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </button>
            <div className="relative">
              <select
                value={periodMode}
                onChange={event => setPeriodMode(event.target.value)}
                className="appearance-none bg-white border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1B4F72]/30 focus:border-[#1B4F72]"
              >
                <option value="preset">Standard period</option>
                <option value="custom">Custom dates</option>
              </select>
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={period}
                onChange={handlePeriodChange}
                className="appearance-none bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1B4F72]/30 focus:border-[#1B4F72]"
              >
                {periods.map(p => (
                  <option key={p} value={p}>{formatVatPeriodLabel(p)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {periodMode === 'custom' && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={event => setCustomStartDate(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1B4F72]/30 focus:border-[#1B4F72]"
                  aria-label="Custom VAT period start date"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={event => setCustomEndDate(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1B4F72]/30 focus:border-[#1B4F72]"
                  aria-label="Custom VAT period end date"
                />
              </>
            )}
            <button
              onClick={load}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {!periodSelection.isValid && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {periodSelection.error}
          </div>
        )}

        {/* Period deadline banner */}
        {data?.daysUntilClose != null && data.daysUntilClose <= 14 && (
          <div className={`rounded-xl border p-4 flex items-center gap-3 ${
            data.daysUntilClose <= 7
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-amber-50 border-amber-300 text-amber-700'
          }`}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-semibold">
                {data.daysUntilClose <= 0
                  ? 'VAT period has closed!'
                  : `${data.daysUntilClose} day${data.daysUntilClose === 1 ? '' : 's'} until period closes`}
              </span>
              {s.clientsWithWork > 0 && (
                <span className="ml-1 font-normal">
                  — {s.clientsWithWork} client{s.clientsWithWork === 1 ? '' : 's'} still have outstanding work.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Summary cards */}
        {!loading && data?.clients?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            <SummaryCard icon={Users} label="Clients" value={s.totalClients || 0}
              sub={s.clientsWithWork > 0 ? `${s.clientsWithWork} need attention` : 'All clear'} />
            <SummaryCard icon={Receipt} label="Receipts" value={s.totalReceipts || 0}
              sub={`${s.totalPending || 0} pending`} />
            <SummaryCard icon={CheckCircle2} label="Approved" value={s.totalApproved || 0}
              color="text-green-600" />
            <SummaryCard icon={AlertTriangle} label="Flagged" value={s.totalFlagged || 0}
              color={s.totalFlagged > 0 ? 'text-red-600' : 'text-slate-300'} />
            <SummaryCard icon={ShieldCheck} label="Input VAT" value={toZAR(s.totalInputVat || 0)}
              color="text-[#1B4F72]" sub="Approved claimable" />
            <SummaryCard icon={Banknote} label="Reconciliation"
              value={s.reconciliationRate != null ? `${Math.round(s.reconciliationRate * 100)}%` : '—'}
              sub={s.reconciliationRate != null ? 'Bank match rate' : 'No bank data'} />
            <SummaryCard icon={ShieldCheck} label="Compliance"
              value={Math.round(s.averageComplianceScore || 0)}
              sub="Average score" />
            <SummaryCard icon={AlertCircle} label="Penalty Risk"
              value={toZAR(s.totalPenaltyRisk || 0)}
              sub={toZAR(s.totalBlockedInputVat || 0)} />
          </div>
        )}

        {/* Filter row */}
        {!loading && data?.clients?.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium mr-1">Filter:</span>
            {['all', 'high', 'medium', 'low', 'clear'].map(f => {
              const labels = { all: 'All', high: 'Urgent', medium: 'Attention', low: 'Pending', clear: 'Up to date' };
              const count = f === 'all' ? data.clients.length : data.clients.filter(c => c.urgency === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f ? 'bg-[#1B4F72] text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {labels[f]} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Client grid */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading dashboard...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center text-slate-400">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {data?.clients?.length === 0
                ? 'No VAT activity found for this period'
                : 'No clients match this filter'}
            </p>
            <p className="text-xs mt-1">
              {data?.clients?.length === 0
                ? 'Capture receipts in the VAT Capture tab to see clients here.'
                : 'Try a different filter or period.'}
            </p>
            {data?.clients?.length === 0 && (
              <button
                onClick={() => openClientManager('new')}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] px-3 py-2 text-sm font-medium text-white hover:bg-[#2E75B6]"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onOpen={handleOpenClient}
                onPreview={handlePreviewClient}
              />
            ))}
          </div>
        )}
      </div>
      {showClientManager && (
        <ClientManager
          initialMode={clientManagerMode}
          onClose={() => { setShowClientManager(false); load(); }}
        />
      )}
    </div>
  );
}
