import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Receipt, Upload, FileSpreadsheet, Building2, ChevronDown,
  CheckCircle2, XCircle, AlertCircle, Clock, HelpCircle,
  Eye, Trash2, Edit3, RefreshCw, Download, Plus, Search,
  ArrowLeft, AlertTriangle, Shield, ShieldCheck, ShieldOff,
  FileText, Banknote, BarChart3, X, Save, Camera,
} from 'lucide-react';
import {
  getReminderActionState,
  getSnoozeChoices,
  getSnoozeUntilPeriodEnd,
  getVisibleReminders,
} from './vatReminderViewModel.js';

// ── Design tokens (matching spec) ────────────────────────────────────────────
const STATUS = {
  pending:  { label: 'Pending',  bg: 'bg-amber-100',  text: 'text-amber-800',  icon: Clock,         dot: 'bg-amber-500' },
  reviewed: { label: 'Reviewed', bg: 'bg-blue-100',   text: 'text-blue-800',   icon: Eye,           dot: 'bg-blue-500' },
  approved: { label: 'Approved', bg: 'bg-green-100',  text: 'text-green-800',  icon: CheckCircle2,  dot: 'bg-green-500' },
  rejected: { label: 'Rejected', bg: 'bg-red-100',    text: 'text-red-800',    icon: XCircle,       dot: 'bg-red-500' },
  query:    { label: 'Query',    bg: 'bg-sky-100',     text: 'text-sky-800',    icon: HelpCircle,    dot: 'bg-sky-500' },
};

const VAT_TYPES = ['standard', 'zero', 'exempt', 'capital'];
const CATEGORIES = ['General', 'Materials', 'Services', 'Equipment', 'Vehicle', 'Travel', 'Entertainment', 'Office', 'Utilities', 'Other'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toZAR(v) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(Number(v) || 0);
}

function parseFlags(flagsStr) {
  try { return JSON.parse(flagsStr || '[]'); } catch { return []; }
}

function currentPeriod() {
  const d = new Date();
  const m = d.getMonth() + 1;
  const start = m % 2 === 0 ? m - 1 : m;
  return `${d.getFullYear()}-${String(start).padStart(2, '0')}`;
}

function periodLabel(p) {
  if (!p) return '';
  const [year, month] = p.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const end = month + 1;
  return `${months[month - 1]}/${months[end - 1]} ${year}`;
}

function buildPeriodOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i * 2, 1);
    const m = d.getMonth() + 1;
    const start = m % 2 === 0 ? m - 1 : m;
    const period = `${d.getFullYear()}-${String(start).padStart(2, '0')}`;
    options.push(period);
  }
  return [...new Set(options)];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}

function FlagBadge({ flags }) {
  if (!flags?.length) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-medium">
      <AlertTriangle className="w-3 h-3" />
      {flags.length}
    </span>
  );
}

function VATBadge({ valid }) {
  if (valid === null || valid === undefined) return (
    <span className="inline-flex items-center gap-1 text-slate-400 text-xs"><Shield className="w-3.5 h-3.5" />–</span>
  );
  if (valid === 1 || valid === true) return (
    <ShieldCheck className="w-4 h-4 text-green-600" title="VAT number verified" />
  );
  return <ShieldOff className="w-4 h-4 text-red-500" title="VAT number invalid" />;
}

function SummaryCard({ label, value, sub, color = 'slate', icon: Icon }) {
  const colours = {
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red:   'border-red-200   bg-red-50   text-red-700',
    blue:  'border-blue-200  bg-blue-50  text-blue-700',
    slate: 'border-slate-200 bg-white    text-slate-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colours[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 opacity-70" />}
        <span className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs mt-0.5 opacity-60">{sub}</div>}
    </div>
  );
}

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const colours = { info: 'bg-blue-600', success: 'bg-green-600', error: 'bg-red-600', warning: 'bg-amber-500' };
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-sm ${colours[type]}`}>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
}

function VatReminderStrip({ reminders, onAction, onDismiss, onSnooze }) {
  const { items, overflowCount } = getVisibleReminders(reminders);
  if (!items.length) return null;

  return (
    <div className="flex-shrink-0 border-b border-amber-200 bg-amber-50 px-6 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <span className="text-sm font-semibold text-amber-900">VAT reminders</span>
        </div>
        {overflowCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            +{overflowCount} more
          </span>
        )}
      </div>
      <div className="grid gap-2 xl:grid-cols-3">
        {items.map(reminder => (
          <VatReminderCard
            key={reminder.ruleKey}
            reminder={reminder}
            onAction={onAction}
            onDismiss={onDismiss}
            onSnooze={onSnooze}
          />
        ))}
      </div>
    </div>
  );
}

function VatReminderCard({ reminder, onAction, onDismiss, onSnooze }) {
  const [snoozeChoice, setSnoozeChoice] = useState(getSnoozeChoices()[0]);
  const iconStyles = {
    error: { Icon: AlertCircle, ring: 'bg-red-100 text-red-700', border: 'border-red-200', title: 'text-red-900', body: 'text-red-700', button: 'bg-red-600 hover:bg-red-500' },
    warning: { Icon: AlertTriangle, ring: 'bg-amber-100 text-amber-700', border: 'border-amber-200', title: 'text-amber-900', body: 'text-amber-700', button: 'bg-amber-600 hover:bg-amber-500' },
    info: { Icon: Clock, ring: 'bg-sky-100 text-sky-700', border: 'border-sky-200', title: 'text-sky-900', body: 'text-sky-700', button: 'bg-sky-600 hover:bg-sky-500' },
  };
  const config = iconStyles[reminder.severity] || iconStyles.info;
  const Icon = config.Icon;
  const title = reminder.title || reminder.ruleKey.replace(/_/g, ' ');
  const message = reminder.message || '';
  const actionLabel = reminder.ruleKey === 'flagged_receipts'
    ? 'Focus receipt'
    : reminder.ruleKey === 'period_closing'
      ? 'Review period'
      : reminder.actionTab === 'schedule' || reminder.ruleKey === 'schedule_missing' || reminder.ruleKey === 'schedule_stale'
        ? 'Open schedule'
        : 'Review receipts';

  return (
    <div className={`rounded-xl border bg-white p-3 shadow-sm ${config.border}`}>
      <div className="flex gap-3">
        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${config.ring}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={`truncate text-sm font-semibold ${config.title}`}>{title}</div>
              <div className={`mt-0.5 text-xs ${config.body}`}>{message}</div>
            </div>
            {reminder.count > 1 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {reminder.count}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAction(reminder)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${config.button}`}
            >
              {actionLabel}
            </button>
            <select
              value={snoozeChoice}
              onChange={e => setSnoozeChoice(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
            >
              {getSnoozeChoices().map(choice => (
                <option key={choice} value={choice}>{choice}</option>
              ))}
            </select>
            <button
              onClick={() => onSnooze(reminder, snoozeChoice)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Snooze
            </button>
            <button
              onClick={() => onDismiss(reminder)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Dismiss for this period
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function VATCapture() {
  const api = window.api;

  // Read query params for dashboard drill-down
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialClient = urlParams.get('client') || '';
  const initialPeriod = urlParams.get('period') || currentPeriod();

  // ─ Global state ─
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClient);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [activeTab, setActiveTab] = useState('receipts');
  const [toast, setToast] = useState(null);

  // ─ Receipts tab ─
  const [receipts, setReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDetail, setShowDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState({});

  // ─ Capture tab ─
  const [captureStep, setCaptureStep] = useState('idle'); // idle | selected | extracting | review | saving
  const [captureImagePath, setCaptureImagePath] = useState('');
  const [captureImageSrc, setCaptureImageSrc] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [captureDraft, setCaptureDraft] = useState({});
  const [vatVerification, setVatVerification] = useState(null);

  // ─ Schedule tab ─
  const [schedule, setSchedule] = useState(null);
  const [scheduleReceipts, setScheduleReceipts] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [reminders, setReminders] = useState([]);

  // ─ Bank tab ─
  const [bankTxns, setBankTxns] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankFilter, setBankFilter] = useState('all'); // all | matched | unmatched
  const [matchingTxnId, setMatchingTxnId] = useState(null);

  const periodOptions = useMemo(() => buildPeriodOptions(), []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  // ── Load clients ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!api?.listClients) return;
    api.listClients()
      .then(list => {
        setClients(list || []);
        if (list?.length) {
          setSelectedClientId(prev => {
            if (prev && list.some(c => c.id === prev)) return prev;
            return list[0].id;
          });
        }
      })
      .catch(err => console.error('[VATCapture] listClients error:', err));
  }, []);

  // ── Load receipts when client/period/filter changes ──────────────────────
  const loadReceipts = useCallback(async () => {
    if (!selectedClientId || !api?.vatListReceipts) return;
    setLoadingReceipts(true);
    try {
      const list = await api.vatListReceipts(selectedClientId, {
        period: selectedPeriod,
      });
      setReceipts(list || []);
      setSelectedIds(new Set());
      // Mutations all call loadReceipts, so dispatching here catches every receipt change.
      window.dispatchEvent(new Event('vat:receipts-changed'));
    } catch (err) {
      console.error('[VATCapture] loadReceipts error:', err);
      setReceipts([]);
    } finally {
      setLoadingReceipts(false);
    }
  }, [selectedClientId, selectedPeriod]);

  useEffect(() => { loadReceipts(); }, [loadReceipts]);

  const loadReminders = useCallback(async () => {
    if (!selectedClientId || !selectedPeriod || !api?.vatGetReminders) {
      setReminders([]);
      return;
    }
    try {
      const list = await api.vatGetReminders(selectedClientId, selectedPeriod);
      setReminders(list || []);
    } catch (err) {
      console.error('[VATCapture] loadReminders error:', err);
      setReminders([]);
    }
  }, [api, selectedClientId, selectedPeriod]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders, receipts, schedule, scheduleReceipts]);

  // ── Load receipt detail ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedReceiptId) { setSelectedReceipt(null); return; }
    if (!api?.vatGetReceipt) return;
    api.vatGetReceipt(selectedReceiptId)
      .then(r => {
        if (r) {
          setSelectedReceipt(r);
          setEditDraft({
            supplier_name: r.supplier_name || '',
            supplier_vat_number: r.supplier_vat_number || '',
            supplier_address: r.supplier_address || '',
            invoice_number: r.invoice_number || '',
            invoice_date: r.invoice_date || '',
            total_incl_vat: r.total_incl_vat,
            vat_amount: r.vat_amount,
            total_excl_vat: r.total_excl_vat,
            expense_category: r.expense_category || 'General',
            vat_type: r.vat_type || 'standard',
            review_notes: r.review_notes || '',
          });
        }
      })
      .catch(err => console.error('[VATCapture] vatGetReceipt error:', err));
  }, [selectedReceiptId]);

  // ── Load VAT schedule ─────────────────────────────────────────────────────
  const loadSchedule = useCallback(async () => {
    if (!selectedClientId || !api?.vatGetSchedule) return;
    setLoadingSchedule(true);
    try {
      const result = await api.vatGetSchedule(selectedClientId, selectedPeriod);
      setSchedule(result?.schedule || null);
      setScheduleReceipts(result?.receipts || []);
    } catch (err) {
      console.error('[VATCapture] loadSchedule error:', err);
      setSchedule(null);
      setScheduleReceipts([]);
    } finally {
      setLoadingSchedule(false);
    }
  }, [selectedClientId, selectedPeriod]);

  useEffect(() => {
    if (activeTab === 'schedule') loadSchedule();
  }, [activeTab, loadSchedule]);

  // ── Load bank transactions ────────────────────────────────────────────────
  const loadBankTxns = useCallback(async () => {
    if (!selectedClientId || !api?.vatListBankTxns) return;
    setLoadingBank(true);
    try {
      const list = await api.vatListBankTxns(selectedClientId, {
        matched: bankFilter === 'matched' ? true : bankFilter === 'unmatched' ? false : undefined,
      });
      setBankTxns(list || []);
    } catch (err) {
      console.error('[VATCapture] loadBankTxns error:', err);
      setBankTxns([]);
    } finally {
      setLoadingBank(false);
    }
  }, [selectedClientId, bankFilter]);

  useEffect(() => {
    if (activeTab === 'bank') loadBankTxns();
  }, [activeTab, loadBankTxns]);

  // ── Filtered receipts ─────────────────────────────────────────────────────
  const filteredReceipts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return receipts.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return (
        !q ||
        (r.supplier_name || '').toLowerCase().includes(q) ||
        (r.invoice_number || '').toLowerCase().includes(q) ||
        (r.expense_category || '').toLowerCase().includes(q)
      );
    });
  }, [receipts, searchQuery, statusFilter]);

  // ── Summary counts ────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const approved = receipts.filter(r => r.status === 'approved');
    return {
      total: receipts.length,
      pending: receipts.filter(r => r.status === 'pending').length,
      approved: approved.length,
      flagged: receipts.filter(r => parseFlags(r.flags).length > 0).length,
      inputVat: approved.reduce((s, r) => s + (Number(r.vat_amount) || 0), 0),
      totalIncl: approved.reduce((s, r) => s + (Number(r.total_incl_vat) || 0), 0),
    };
  }, [receipts]);

  // ── Action helpers ────────────────────────────────────────────────────────
  async function updateStatus(id, status, notes) {
    const res = await api.vatUpdateReceiptStatus(id, status, notes);
    if (res?.success) {
      showToast(`Receipt ${status}`, status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info');
      loadReceipts();
      if (selectedReceiptId === id) {
        setSelectedReceipt(prev => prev ? { ...prev, status, review_notes: notes || prev.review_notes } : prev);
      }
    } else {
      showToast(res?.error || 'Failed to update status', 'error');
    }
  }

  async function bulkApprove() {
    if (!selectedIds.size) return;
    const res = await api.vatBulkStatus([...selectedIds], 'approved');
    if (res?.success) {
      showToast(`${selectedIds.size} receipts approved`, 'success');
      loadReceipts();
    }
  }

  async function deleteReceipt(id) {
    if (!confirm('Delete this receipt? This cannot be undone.')) return;
    const res = await api.vatDeleteReceipt(id);
    if (res?.success) {
      showToast('Receipt deleted', 'warning');
      if (selectedReceiptId === id) { setShowDetail(false); setSelectedReceiptId(null); }
      loadReceipts();
    }
  }

  async function saveEdit() {
    const res = await api.vatSaveReceipt({ ...selectedReceipt, ...editDraft });
    if (res?.success) {
      showToast('Receipt saved', 'success');
      setEditMode(false);
      setSelectedReceiptId(res.id || selectedReceiptId);
      loadReceipts();
    } else {
      showToast(res?.error || 'Save failed', 'error');
    }
  }

  const refreshReminders = useCallback(() => {
    window.dispatchEvent(new Event('vat:reminders-changed'));
  }, []);

  const handleReminderAction = useCallback((reminder) => {
    const nextState = getReminderActionState(reminder, receipts);
    if (!nextState) return;

    setActiveTab(nextState.activeTab);
    setStatusFilter(nextState.statusFilter);
    setSelectedReceiptId(nextState.selectedReceiptId);
    setShowDetail(nextState.showDetail);
    setEditMode(nextState.editMode);
    if (nextState.selectedReceiptId) {
      const flaggedReceipt = receipts.find(receipt => receipt.id === nextState.selectedReceiptId);
      if (flaggedReceipt) setSelectedReceipt(flaggedReceipt);
    }
  }, [receipts]);

  const persistReminderState = useCallback(async (reminder, action, snoozedUntil = null) => {
    if (!api?.vatUpdateReminderState) return;
    const result = await api.vatUpdateReminderState({
      clientId: selectedClientId,
      period: selectedPeriod,
      ruleKey: reminder.ruleKey,
      action,
      snoozedUntil,
      conditionSignature: reminder.conditionSignature,
    });

    if (result?.success) {
      refreshReminders();
      await loadReminders();
    } else {
      showToast(result?.error || 'Failed to update reminder', 'error');
    }
  }, [api, loadReminders, refreshReminders, selectedClientId, selectedPeriod, showToast]);

  const handleDismissReminder = useCallback((reminder) => {
    void persistReminderState(reminder, 'dismissed');
  }, [persistReminderState]);

  const handleSnoozeReminder = useCallback((reminder, choice) => {
    const now = new Date();
    let snoozedUntil = now;

    if (choice === '1 day') {
      snoozedUntil = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (choice === '3 days') {
      snoozedUntil = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
    } else if (choice === 'until period end') {
      snoozedUntil = getSnoozeUntilPeriodEnd(selectedPeriod, now) || now;
    }

    void persistReminderState(reminder, 'snoozed', snoozedUntil.toISOString());
  }, [persistReminderState, selectedPeriod]);

  // ── Capture actions ───────────────────────────────────────────────────────
  async function pickImage() {
    const res = await api.vatImportImage();
    if (res?.success) {
      setCaptureImagePath(res.imagePath);
      // Load as data URL for preview
      setCaptureImageSrc(`file://${res.imagePath.replace(/\\/g, '/')}`);
      setCaptureStep('selected');
      setExtractedData(null);
      setCaptureDraft({});
      setVatVerification(null);
    } else if (!res?.cancelled) {
      showToast(res?.error || 'Could not load image', 'error');
    }
  }

  async function runExtraction() {
    if (!captureImagePath) return;
    setCaptureStep('extracting');
    const res = await api.vatExtractReceipt(captureImagePath);
    if (res?.success) {
      const d = res.extracted;
      setExtractedData(d);
      setCaptureDraft({
        supplier_name: d.supplier_name || '',
        supplier_vat_number: d.supplier_vat_number || '',
        supplier_address: d.supplier_address || '',
        invoice_number: d.invoice_number || '',
        invoice_date: d.invoice_date || '',
        total_incl_vat: d.total_incl_vat || '',
        vat_amount: d.vat_amount || '',
        total_excl_vat: d.total_excl_vat || '',
        expense_category: 'General',
        vat_type: 'standard',
        flags: d.flags || [],
        ai_confidence: d.confidence,
      });
      setCaptureStep('review');
      // Auto-verify VAT number
      if (d.supplier_vat_number) {
        api.vatVerifyVatNumber(d.supplier_vat_number).then(setVatVerification);
      }
    } else {
      showToast(res?.error || 'AI extraction failed', 'error');
      setCaptureStep('selected');
    }
  }

  async function saveCapture() {
    if (!selectedClientId) { showToast('Select a client first', 'warning'); return; }
    setCaptureStep('saving');
    const res = await api.vatSaveReceipt({
      client_id: selectedClientId,
      capture_method: 'ai_capture',
      image_path: captureImagePath,
      ...captureDraft,
    });
    if (res?.success) {
      showToast('Receipt saved successfully', 'success');
      setCaptureStep('idle');
      setCaptureImagePath('');
      setCaptureImageSrc('');
      setExtractedData(null);
      setCaptureDraft({});
      setVatVerification(null);
      loadReceipts();
    } else {
      showToast(res?.error || 'Save failed', 'error');
      setCaptureStep('review');
    }
  }

  async function handleAddManual() {
    if (!selectedClientId) { showToast('Select a client first', 'warning'); return; }
    const res = await api.vatSaveReceipt({
      client_id: selectedClientId,
      capture_method: 'manual',
      status: 'pending',
      expense_category: 'General',
      vat_type: 'standard',
    });
    if (res?.success) {
      showToast('Blank receipt created — edit the details', 'info');
      loadReceipts();
      setSelectedReceiptId(res.id);
      setShowDetail(true);
      setEditMode(true);
      setActiveTab('receipts');
    }
  }

  // ── Schedule actions ──────────────────────────────────────────────────────
  async function generateSchedule() {
    if (!selectedClientId) return;
    setLoadingSchedule(true);
    const res = await api.vatGenerateSchedule(selectedClientId, selectedPeriod);
    if (res?.success) {
      showToast('VAT schedule generated', 'success');
      refreshReminders();
      loadSchedule();
    } else {
      showToast(res?.error || 'Failed to generate schedule', 'error');
      setLoadingSchedule(false);
    }
  }

  async function exportExcel() {
    if (!selectedClientId) return;
    const res = await api.vatExportExcel(selectedClientId, selectedPeriod);
    if (res?.success) showToast('Exported to Excel', 'success');
    else if (!res?.cancelled) showToast(res?.error || 'Export failed', 'error');
  }

  // ── Bank actions ──────────────────────────────────────────────────────────
  async function importBank() {
    const res = await api.vatImportBank(selectedClientId);
    if (res?.success) {
      showToast(`Imported ${res.imported} transactions`, 'success');
      loadBankTxns();
    } else if (!res?.cancelled) {
      showToast(res?.error || 'Import failed', 'error');
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    if (!showDetail || !selectedReceipt) return;
    const handler = (e) => {
      if (editMode || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'a') updateStatus(selectedReceipt.id, 'approved', selectedReceipt.review_notes);
      if (e.key === 'r') updateStatus(selectedReceipt.id, 'rejected', selectedReceipt.review_notes);
      if (e.key === 'q') updateStatus(selectedReceipt.id, 'query', selectedReceipt.review_notes);
      if (e.key === 'Escape') { setShowDetail(false); setSelectedReceiptId(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showDetail, selectedReceipt, editMode]);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'receipts', label: 'Receipts', icon: Receipt },
    { id: 'capture',  label: 'Capture',  icon: Camera },
    { id: 'schedule', label: 'VAT Schedule', icon: BarChart3 },
    { id: 'bank',     label: 'Bank Recon', icon: Banknote },
  ];

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Top bar ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#1B4F72]" />
          <span className="font-semibold text-[#1B4F72] text-base">AME VAT Capture</span>
        </div>

        {/* Client selector */}
        <div className="flex items-center gap-2 ml-4">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white min-w-[200px]"
          >
            <option value="">— Select client —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.vat_number ? ` (${c.vat_number})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Period:</span>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
          >
            {periodOptions.map(p => (
              <option key={p} value={p}>{periodLabel(p)}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <nav className="flex ml-auto gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-[#1B4F72] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Summary cards ── */}
      {selectedClientId && (
        <>
          <div className="flex-shrink-0 grid grid-cols-6 gap-3 px-6 py-3 bg-white border-b border-slate-200">
            <SummaryCard label="Total" value={summary.total} icon={Receipt} />
            <SummaryCard label="Pending" value={summary.pending} color="amber" icon={Clock} />
            <SummaryCard label="Approved" value={summary.approved} color="green" icon={CheckCircle2} />
            <SummaryCard label="Flagged" value={summary.flagged} color="red" icon={AlertTriangle} />
            <SummaryCard label="Input VAT" value={toZAR(summary.inputVat)} color="blue" icon={BarChart3} />
            <SummaryCard label="Total Purchases" value={toZAR(summary.totalIncl)} icon={Banknote} />
          </div>
          <VatReminderStrip
            reminders={reminders}
            onAction={handleReminderAction}
            onDismiss={handleDismissReminder}
            onSnooze={handleSnoozeReminder}
          />
        </>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 overflow-hidden">
        {!selectedClientId ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Building2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-base font-medium">Select a client to get started</p>
            <p className="text-sm mt-1">Use the dropdown above to choose a client</p>
          </div>
        ) : activeTab === 'receipts' ? (
          <ReceiptsTab
            receipts={filteredReceipts}
            loading={loadingReceipts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            selectedReceiptId={selectedReceiptId}
            setSelectedReceiptId={setSelectedReceiptId}
            showDetail={showDetail}
            setShowDetail={setShowDetail}
            selectedReceipt={selectedReceipt}
            editMode={editMode}
            setEditMode={setEditMode}
            editDraft={editDraft}
            setEditDraft={setEditDraft}
            onUpdateStatus={updateStatus}
            onDelete={deleteReceipt}
            onSaveEdit={saveEdit}
            onBulkApprove={bulkApprove}
            onAddManual={handleAddManual}
            onRefresh={loadReceipts}
          />
        ) : activeTab === 'capture' ? (
          <CaptureTab
            captureStep={captureStep}
            captureImageSrc={captureImageSrc}
            extractedData={extractedData}
            captureDraft={captureDraft}
            setCaptureDraft={setCaptureDraft}
            vatVerification={vatVerification}
            onPickImage={pickImage}
            onExtract={runExtraction}
            onSave={saveCapture}
            onReset={() => { setCaptureStep('idle'); setCaptureImagePath(''); setCaptureImageSrc(''); setExtractedData(null); }}
          />
        ) : activeTab === 'schedule' ? (
          <ScheduleTab
            schedule={schedule}
            receipts={scheduleReceipts}
            period={selectedPeriod}
            loading={loadingSchedule}
            onGenerate={generateSchedule}
            onExport={exportExcel}
          />
        ) : (
          <BankTab
            txns={bankTxns}
            receipts={receipts}
            loading={loadingBank}
            bankFilter={bankFilter}
            setBankFilter={setBankFilter}
            matchingTxnId={matchingTxnId}
            setMatchingTxnId={setMatchingTxnId}
            onImport={importBank}
            onMatch={async (txnId, receiptId) => {
              await api.vatMatchBankTxn(txnId, receiptId);
              setMatchingTxnId(null);
              loadBankTxns();
              loadReceipts();
            }}
            onRefresh={loadBankTxns}
          />
        )}
      </div>

      {/* ── Toast ── */}
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEIPTS TAB
// ─────────────────────────────────────────────────────────────────────────────

function ReceiptsTab({
  receipts, loading, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
  selectedIds, setSelectedIds, selectedReceiptId, setSelectedReceiptId,
  showDetail, setShowDetail, selectedReceipt, editMode, setEditMode,
  editDraft, setEditDraft, onUpdateStatus, onDelete, onSaveEdit,
  onBulkApprove, onAddManual, onRefresh,
}) {
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === receipts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(receipts.map(r => r.id)));
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Receipt list ── */}
      <div className={`flex flex-col overflow-hidden ${showDetail ? 'w-1/2 border-r border-slate-200' : 'flex-1'}`}>
        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-white">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search supplier, invoice no..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {selectedIds.size > 0 && (
            <button
              onClick={onBulkApprove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve {selectedIds.size}
            </button>
          )}
          <div className="flex gap-1 ml-auto">
            <button onClick={onAddManual} className="flex items-center gap-1 px-3 py-1.5 bg-[#1B4F72] hover:bg-[#2E75B6] text-white rounded-lg text-sm">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
            <button onClick={onRefresh} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : receipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <Receipt className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No receipts found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left w-8">
                    <input type="checkbox" checked={selectedIds.size === receipts.length && receipts.length > 0}
                      onChange={toggleAll} className="rounded" />
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Supplier</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600 hidden lg:table-cell">Invoice No.</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">Incl VAT</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">VAT</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-600">Status</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-600">VAT#</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-600">Flags</th>
                  <th className="px-3 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((r, idx) => {
                  const flags = parseFlags(r.flags);
                  const isSelected = selectedReceiptId === r.id;
                  return (
                    <tr
                      key={r.id}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}
                      onClick={() => { setSelectedReceiptId(r.id); setShowDetail(true); setEditMode(false); }}
                    >
                      <td className="px-3 py-2" onClick={e => { e.stopPropagation(); toggleSelect(r.id); }}>
                        <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded" />
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.invoice_date || '—'}</td>
                      <td className="px-3 py-2 font-medium text-slate-800 max-w-[160px] truncate">{r.supplier_name || <span className="text-slate-400 italic">Unknown</span>}</td>
                      <td className="px-3 py-2 text-slate-500 hidden lg:table-cell">{r.invoice_number || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-800">{toZAR(r.total_incl_vat)}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">{toZAR(r.vat_amount)}</td>
                      <td className="px-3 py-2 text-center"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2 text-center"><VATBadge valid={r.vat_number_valid} /></td>
                      <td className="px-3 py-2 text-center"><FlagBadge flags={flags} /></td>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <button title="Approve (A)" onClick={() => onUpdateStatus(r.id, 'approved')} className="p-1 text-green-600 hover:bg-green-100 rounded">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button title="Reject (R)" onClick={() => onUpdateStatus(r.id, 'rejected')} className="p-1 text-red-600 hover:bg-red-100 rounded">
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button title="Delete" onClick={() => onDelete(r.id)} className="p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {showDetail && selectedReceipt && (
        <div className="w-1/2 flex flex-col overflow-hidden bg-white">
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
            <span className="font-medium text-slate-700 text-sm">Receipt Detail</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">A=Approve  R=Reject  Q=Query  Esc=Close</span>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs text-slate-700">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <>
                  <button onClick={onSaveEdit} className="flex items-center gap-1 px-2.5 py-1 bg-[#1B4F72] text-white hover:bg-[#2E75B6] rounded-lg text-xs">
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setEditMode(false)} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs text-slate-700">
                    Cancel
                  </button>
                </>
              )}
              <button onClick={() => { setShowDetail(false); setSelectedReceiptId(null); }} className="p-1 text-slate-400 hover:text-slate-700 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Image */}
            <div className="w-1/2 bg-slate-100 flex items-center justify-center overflow-hidden border-r border-slate-200 p-2">
              {selectedReceipt.image_path ? (
                <img
                  src={`file://${selectedReceipt.image_path.replace(/\\/g, '/')}`}
                  alt="Receipt"
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <FileText className="w-10 h-10 mb-2 opacity-40" />
                  <span className="text-xs">No image</span>
                </div>
              )}
            </div>

            {/* Data */}
            <div className="w-1/2 overflow-y-auto p-4 space-y-4">
              {/* Status actions */}
              <div className="flex gap-2 flex-wrap">
                {['approved','rejected','query','pending'].map(s => (
                  <button key={s} onClick={() => onUpdateStatus(selectedReceipt.id, s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      selectedReceipt.status === s
                        ? `${STATUS[s].bg} ${STATUS[s].text} border-transparent`
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {STATUS[s].label}
                  </button>
                ))}
              </div>

              {/* Flags */}
              {parseFlags(selectedReceipt.flags).length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-orange-700 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> Flags
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {parseFlags(selectedReceipt.flags).map(f => (
                      <span key={f} className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fields */}
              <DetailFields
                receipt={selectedReceipt}
                editMode={editMode}
                draft={editDraft}
                setDraft={setEditDraft}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailFields({ receipt, editMode, draft, setDraft }) {
  const field = (label, key, type = 'text', options = null) => (
    <div key={key} className="flex flex-col gap-0.5">
      <label className="text-xs text-slate-500 font-medium">{label}</label>
      {editMode ? (
        options ? (
          <select value={draft[key] || ''} onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))}
            className="text-sm border border-slate-300 rounded px-2 py-1 bg-white">
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={draft[key] ?? ''} onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))}
            className="text-sm border border-slate-300 rounded px-2 py-1 bg-white" />
        )
      ) : (
        <span className={`text-sm ${key.startsWith('total') || key === 'vat_amount' ? 'font-mono font-semibold text-slate-800' : 'text-slate-700'}`}>
          {receipt[key] != null && receipt[key] !== '' ? (
            type === 'number' ? toZAR(receipt[key]) : receipt[key]
          ) : <span className="text-slate-400 italic">—</span>}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {field('Supplier Name', 'supplier_name')}
      {field('Supplier VAT Number', 'supplier_vat_number')}
      {field('Supplier Address', 'supplier_address')}
      <div className="border-t border-slate-100 pt-3" />
      {field('Invoice Number', 'invoice_number')}
      {field('Invoice Date', 'invoice_date', 'date')}
      <div className="border-t border-slate-100 pt-3" />
      {field('Total Excl VAT', 'total_excl_vat', 'number')}
      {field('VAT Amount (15%)', 'vat_amount', 'number')}
      {field('Total Incl VAT', 'total_incl_vat', 'number')}
      <div className="border-t border-slate-100 pt-3" />
      {field('Expense Category', 'expense_category', 'text', CATEGORIES)}
      {field('VAT Type', 'vat_type', 'text', VAT_TYPES)}
      {field('Review Notes', 'review_notes')}
      {receipt.ai_confidence != null && (
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-slate-500 font-medium">AI Confidence</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.round(receipt.ai_confidence * 100)}%` }} />
            </div>
            <span className="text-xs text-slate-600">{Math.round(receipt.ai_confidence * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPTURE TAB
// ─────────────────────────────────────────────────────────────────────────────

function CaptureTab({
  captureStep, captureImageSrc, extractedData, captureDraft, setCaptureDraft,
  vatVerification, onPickImage, onExtract, onSave, onReset,
}) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-5 h-5 text-[#1B4F72]" />
            <h2 className="text-base font-semibold text-slate-800">AI Receipt Capture</h2>
          </div>
          <p className="text-sm text-slate-500">
            Select a receipt or invoice image. Claude AI will extract all VAT-relevant data automatically.
          </p>
        </div>

        {captureStep === 'idle' && (
          <div
            onClick={onPickImage}
            className="bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1B4F72] cursor-pointer p-12 flex flex-col items-center justify-center gap-4 transition-colors"
          >
            <Upload className="w-10 h-10 text-slate-300" />
            <div className="text-center">
              <p className="font-medium text-slate-700">Click to select a receipt image</p>
              <p className="text-sm text-slate-400 mt-1">Supports JPG, PNG, WEBP, PDF</p>
            </div>
          </div>
        )}

        {(captureStep === 'selected' || captureStep === 'extracting' || captureStep === 'review' || captureStep === 'saving') && (
          <div className="grid grid-cols-2 gap-4">
            {/* Image preview */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Receipt Image</span>
                <button onClick={onReset} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Change
                </button>
              </div>
              {captureImageSrc ? (
                <img src={captureImageSrc} alt="Receipt preview" className="w-full object-contain max-h-[500px] p-2" />
              ) : (
                <div className="p-8 flex items-center justify-center text-slate-300">
                  <FileText className="w-12 h-12" />
                </div>
              )}
              {captureStep === 'selected' && (
                <div className="p-4 border-t border-slate-200">
                  <button
                    onClick={onExtract}
                    className="w-full flex items-center justify-center gap-2 bg-[#1B4F72] hover:bg-[#2E75B6] text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Extract with AI
                  </button>
                </div>
              )}
            </div>

            {/* Extracted data / form */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {captureStep === 'extracting' ? 'Extracting...' : 'Extracted Data'}
                </span>
                {extractedData?.confidence != null && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    extractedData.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                    extractedData.confidence >= 0.6 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    AI: {Math.round(extractedData.confidence * 100)}% confident
                  </span>
                )}
              </div>

              {captureStep === 'extracting' && (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#1B4F72]" />
                  <p className="text-sm">Claude is reading your receipt...</p>
                </div>
              )}

              {(captureStep === 'review' || captureStep === 'saving') && (
                <div className="p-4 space-y-3 overflow-y-auto max-h-[460px]">
                  {/* Flags */}
                  {captureDraft.flags?.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                      <div className="flex items-center gap-1 text-orange-700 text-xs font-medium mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Review needed
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {captureDraft.flags.map(f => (
                          <span key={f} className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VAT verification badge */}
                  {captureDraft.supplier_vat_number && vatVerification && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                      vatVerification.valid === true ? 'bg-green-50 text-green-700 border border-green-200' :
                      vatVerification.valid === false ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                      {vatVerification.valid === true ? <ShieldCheck className="w-4 h-4" /> :
                       vatVerification.valid === false ? <ShieldOff className="w-4 h-4" /> :
                       <Shield className="w-4 h-4" />}
                      {vatVerification.valid === true ? `VAT verified: ${vatVerification.vendorName || captureDraft.supplier_vat_number}` :
                       vatVerification.valid === false ? 'VAT number not registered with SARS' :
                       vatVerification.reason || 'VAT verification inconclusive'}
                    </div>
                  )}

                  {/* Editable fields */}
                  {[
                    ['Supplier Name', 'supplier_name', 'text'],
                    ['Supplier VAT Number', 'supplier_vat_number', 'text'],
                    ['Supplier Address', 'supplier_address', 'text'],
                    ['Invoice Number', 'invoice_number', 'text'],
                    ['Invoice Date', 'invoice_date', 'date'],
                    ['Total Excl VAT (R)', 'total_excl_vat', 'number'],
                    ['VAT Amount (R)', 'vat_amount', 'number'],
                    ['Total Incl VAT (R)', 'total_incl_vat', 'number'],
                  ].map(([label, key, type]) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <label className="text-xs text-slate-500 font-medium">{label}</label>
                      <input
                        type={type}
                        value={captureDraft[key] ?? ''}
                        onChange={e => setCaptureDraft(p => ({ ...p, [key]: e.target.value }))}
                        className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-[#1B4F72] outline-none"
                      />
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-0.5">
                      <label className="text-xs text-slate-500 font-medium">Category</label>
                      <select value={captureDraft.expense_category || 'General'}
                        onChange={e => setCaptureDraft(p => ({ ...p, expense_category: e.target.value }))}
                        className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <label className="text-xs text-slate-500 font-medium">VAT Type</label>
                      <select value={captureDraft.vat_type || 'standard'}
                        onChange={e => setCaptureDraft(p => ({ ...p, vat_type: e.target.value }))}
                        className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
                        {VAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={onSave}
                    disabled={captureStep === 'saving'}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                  >
                    {captureStep === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {captureStep === 'saving' ? 'Saving...' : 'Save Receipt'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VAT SCHEDULE TAB
// ─────────────────────────────────────────────────────────────────────────────

function ScheduleTab({ schedule, receipts, period, loading, onGenerate, onExport }) {
  const approved = receipts.filter(r => r.status === 'approved');

  // Group by category
  const byCategory = useMemo(() => {
    const groups = {};
    for (const r of approved) {
      const cat = r.expense_category || 'General';
      if (!groups[cat]) groups[cat] = { receipts: [], exclVat: 0, vat: 0, inclVat: 0 };
      groups[cat].receipts.push(r);
      groups[cat].exclVat += Number(r.total_excl_vat) || 0;
      groups[cat].vat += Number(r.vat_amount) || 0;
      groups[cat].inclVat += Number(r.total_incl_vat) || 0;
    }
    return groups;
  }, [approved]);

  const totals = useMemo(() => ({
    excl: approved.reduce((s, r) => s + (Number(r.total_excl_vat) || 0), 0),
    vat: approved.reduce((s, r) => s + (Number(r.vat_amount) || 0), 0),
    incl: approved.reduce((s, r) => s + (Number(r.total_incl_vat) || 0), 0),
  }), [approved]);

  const noValidVat = approved.filter(r => !r.vat_number_valid && r.vat_type === 'standard').length;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-[#1B4F72]" />
              <h2 className="text-base font-semibold text-slate-800">VAT Schedule — {periodLabel(period)}</h2>
            </div>
            <p className="text-sm text-slate-500">
              Auto-generated from approved receipts. Mirrors SARS VAT201 input tax structure.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1B4F72] hover:bg-[#2E75B6] text-white rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Generate
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {noValidVat > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {noValidVat} approved receipt{noValidVat > 1 ? 's' : ''} without a valid VAT number
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                SARS requires a valid tax invoice with supplier VAT number for input VAT claims. These may be disallowed.
              </p>
            </div>
          </div>
        )}

        {/* VAT201 summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Field 14 — Purchases (Excl VAT)</div>
            <div className="text-xl font-bold text-slate-800 font-mono">{toZAR(totals.excl)}</div>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Field 15/16 — Input VAT</div>
            <div className="text-xl font-bold text-blue-800 font-mono">{toZAR(totals.vat)}</div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Total Purchases (Incl VAT)</div>
            <div className="text-xl font-bold text-green-800 font-mono">{toZAR(totals.incl)}</div>
          </div>
        </div>

        {/* Category breakdown */}
        {Object.keys(byCategory).length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-sm font-medium text-slate-700">Breakdown by Expense Category</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#1B4F72] text-white">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Category</th>
                  <th className="px-4 py-2.5 text-center font-medium">Receipts</th>
                  <th className="px-4 py-2.5 text-right font-medium">Excl VAT</th>
                  <th className="px-4 py-2.5 text-right font-medium">VAT</th>
                  <th className="px-4 py-2.5 text-right font-medium">Incl VAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(byCategory).map(([cat, data], idx) => (
                  <tr key={cat} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{cat}</td>
                    <td className="px-4 py-2.5 text-center text-slate-600">{data.receipts.length}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-700">{toZAR(data.exclVat)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-700">{toZAR(data.vat)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-800">{toZAR(data.inclVat)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300">
                  <td className="px-4 py-2.5 text-slate-800">TOTAL</td>
                  <td className="px-4 py-2.5 text-center text-slate-800">{approved.length}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-800">{toZAR(totals.excl)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#1B4F72]">{toZAR(totals.vat)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-800">{toZAR(totals.incl)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center text-slate-400">
            <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No approved receipts yet</p>
            <p className="text-xs mt-1">Approve receipts in the Receipts tab, then click Generate.</p>
          </div>
        )}

        {/* Reconciliation status */}
        {receipts.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-700 mb-2">Bank Reconciliation Status</div>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">
                ✓ {receipts.filter(r => r.is_reconciled).length} matched
              </span>
              <span className="text-amber-600 font-medium">
                ○ {receipts.filter(r => !r.is_reconciled).length} unmatched
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BANK RECONCILIATION TAB
// ─────────────────────────────────────────────────────────────────────────────

function BankTab({ txns, receipts, loading, bankFilter, setBankFilter, matchingTxnId, setMatchingTxnId, onImport, onMatch, onRefresh }) {
  const filtered = useMemo(() => {
    if (bankFilter === 'matched') return txns.filter(t => t.is_matched);
    if (bankFilter === 'unmatched') return txns.filter(t => !t.is_matched);
    return txns;
  }, [txns, bankFilter]);

  const unmatchedReceipts = receipts.filter(r => !r.is_reconciled && r.status !== 'rejected');

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-5 h-5 text-[#1B4F72]" />
              <h2 className="text-base font-semibold text-slate-800">Bank Statement Reconciliation</h2>
            </div>
            <p className="text-sm text-slate-500">
              Import a CSV bank statement to match transactions to receipts. Supports FNB, Standard Bank, Nedbank, ABSA, Capitec.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onImport} className="flex items-center gap-1.5 px-3 py-2 bg-[#1B4F72] hover:bg-[#2E75B6] text-white rounded-lg text-sm">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button onClick={onRefresh} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary stats */}
        {txns.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Matched</div>
              <div className="text-xl font-bold text-green-700">{txns.filter(t => t.is_matched).length}</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">Unmatched Bank Txns</div>
              <div className="text-xl font-bold text-amber-700">{txns.filter(t => !t.is_matched).length}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">Unmatched Receipts</div>
              <div className="text-xl font-bold text-red-700">{unmatchedReceipts.length}</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {['all','matched','unmatched'].map(f => (
            <button key={f} onClick={() => setBankFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                bankFilter === f ? 'bg-[#1B4F72] text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Transactions table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center text-slate-400">
            <Banknote className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">{txns.length === 0 ? 'No bank statement imported yet' : 'No transactions match this filter'}</p>
            {txns.length === 0 && <p className="text-xs mt-1">Click "Import CSV" to upload a bank statement</p>}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1B4F72] text-white">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Date</th>
                  <th className="px-4 py-2.5 text-left font-medium">Description</th>
                  <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Bank</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 text-center font-medium">Status</th>
                  <th className="px-4 py-2.5 text-center font-medium">Matched Receipt</th>
                  <th className="px-4 py-2.5 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((txn, idx) => {
                  const matchedReceipt = txn.matched_receipt_id ? receipts.find(r => r.id === txn.matched_receipt_id) : null;
                  return (
                    <tr key={txn.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{txn.txn_date}</td>
                      <td className="px-4 py-2.5 text-slate-700 max-w-[220px] truncate">{txn.description}</td>
                      <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">{txn.bank_name}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-red-600">{toZAR(txn.amount)}</td>
                      <td className="px-4 py-2.5 text-center">
                        {txn.is_matched ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3" /> Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <AlertCircle className="w-3 h-3" /> Unmatched
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600 max-w-[140px] truncate">
                        {matchedReceipt ? `${matchedReceipt.supplier_name || '?'} (${matchedReceipt.invoice_number || 'no inv'})` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {!txn.is_matched ? (
                          matchingTxnId === txn.id ? (
                            <div className="flex flex-col gap-1">
                              <select
                                className="text-xs border border-slate-300 rounded px-1.5 py-1 max-w-[140px]"
                                defaultValue=""
                                onChange={e => { if (e.target.value) onMatch(txn.id, e.target.value); }}
                              >
                                <option value="">— Pick receipt —</option>
                                {receipts.filter(r => !r.is_reconciled).map(r => (
                                  <option key={r.id} value={r.id}>
                                    {r.supplier_name || '?'} {toZAR(r.total_incl_vat)}
                                  </option>
                                ))}
                              </select>
                              <button onClick={() => setMatchingTxnId(null)} className="text-xs text-slate-400 hover:text-slate-700">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setMatchingTxnId(txn.id)}
                              className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-100 text-slate-600"
                            >
                              Link
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => onMatch(txn.id, null)}
                            className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-red-50 hover:text-red-600 text-slate-500"
                          >
                            Unlink
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Unmatched receipts chase list */}
        {unmatchedReceipts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-red-200">
              <span className="text-sm font-medium text-red-700">Unmatched Receipts — no bank entry found</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-red-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-red-700">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-red-700">Supplier</th>
                  <th className="px-4 py-2 text-right font-medium text-red-700">Incl VAT</th>
                  <th className="px-4 py-2 text-center font-medium text-red-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {unmatchedReceipts.map(r => (
                  <tr key={r.id} className="bg-white">
                    <td className="px-4 py-2 text-slate-600">{r.invoice_date || '—'}</td>
                    <td className="px-4 py-2 text-slate-800">{r.supplier_name || <span className="italic text-slate-400">Unknown</span>}</td>
                    <td className="px-4 py-2 text-right font-mono">{toZAR(r.total_incl_vat)}</td>
                    <td className="px-4 py-2 text-center"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
