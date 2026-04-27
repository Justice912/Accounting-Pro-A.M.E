import { useMemo, useState } from 'react';
import {
  History,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';
import {
  formatActiveOverride,
  formatOverrideHistoryEntry,
  getAllowedOverrideTypes,
  getOverrideApprovalNote,
  validateOverrideDraft,
} from '../../pages/vatComplianceViewModel.js';

const STATUS_BADGES = {
  approved: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-700',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700',
  },
  query: {
    label: 'Query',
    className: 'bg-sky-100 text-sky-700',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-100 text-rose-700',
  },
  reviewed: {
    label: 'Reviewed',
    className: 'bg-blue-100 text-blue-700',
  },
};

function formatTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getOverrideRawValue(override) {
  return override?.override_value ?? override?.overrideValue ?? override?.override_value_json ?? '';
}

function getDefaultDraftValue(overrideOption) {
  if (!overrideOption) return '';
  if (overrideOption.kind === 'enum') {
    return overrideOption.options?.[0]?.value || '';
  }
  return '';
}

export default function PractitionerOverridePanel({
  documentType,
  status,
  activeOverrides = [],
  overrideHistory = [],
  onSaveOverride,
  onClearOverride,
  busy = false,
}) {
  const allowedOverrideTypes = useMemo(
    () => getAllowedOverrideTypes(documentType),
    [documentType]
  );
  const [mode, setMode] = useState(null);
  const [draft, setDraft] = useState({
    overrideType: allowedOverrideTypes[0]?.value || '',
    value: getDefaultDraftValue(allowedOverrideTypes[0]),
    reason: '',
  });
  const [errors, setErrors] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  const selectedType = allowedOverrideTypes.find(option => option.value === draft.overrideType)
    || allowedOverrideTypes[0]
    || null;
  const statusBadge = STATUS_BADGES[status] || STATUS_BADGES.pending;
  const activeItems = useMemo(
    () => activeOverrides.map(override => ({
      key: override.id || override.override_type,
      override,
      formatted: formatActiveOverride(override),
    })),
    [activeOverrides]
  );
  const historyItems = useMemo(
    () => [...overrideHistory]
      .reverse()
      .map(entry => ({
        key: entry.id || `${entry.override_type}-${entry.created_at}-${entry.event_type}`,
        formatted: formatOverrideHistoryEntry(entry),
      })),
    [overrideHistory]
  );

  function resetEditor() {
    const firstOption = allowedOverrideTypes[0] || null;
    setMode(null);
    setErrors({});
    setDraft({
      overrideType: firstOption?.value || '',
      value: getDefaultDraftValue(firstOption),
      reason: '',
    });
  }

  function startAdd() {
    const firstOption = allowedOverrideTypes[0] || null;
    setMode('add');
    setErrors({});
    setDraft({
      overrideType: firstOption?.value || '',
      value: getDefaultDraftValue(firstOption),
      reason: '',
    });
  }

  function startEdit(override) {
    setMode('edit');
    setErrors({});
    setDraft({
      overrideType: override.override_type,
      value: String(getOverrideRawValue(override) ?? ''),
      reason: '',
    });
  }

  function startClear(override) {
    setMode('clear');
    setErrors({});
    setDraft({
      overrideType: override.override_type,
      value: String(getOverrideRawValue(override) ?? ''),
      reason: '',
    });
  }

  async function handleSubmit() {
    const normalizedReason = String(draft.reason || '').trim();

    if (mode === 'clear') {
      if (!normalizedReason) {
        setErrors({ reason: 'Reason is required.' });
        return;
      }

      try {
        const result = await onClearOverride?.({
          overrideType: draft.overrideType,
          reason: normalizedReason,
        });
        if (!result?.success) {
          setErrors({ form: result?.error || 'Could not clear override.' });
          return;
        }
        resetEditor();
      } catch (error) {
        setErrors({ form: error.message || 'Could not clear override.' });
      }
      return;
    }

    const validation = validateOverrideDraft({
      overrideType: draft.overrideType,
      value: draft.value,
      reason: normalizedReason,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      const result = await onSaveOverride?.({
        overrideType: draft.overrideType,
        value: selectedType?.kind === 'number' ? Number(draft.value) : draft.value,
        reason: normalizedReason,
      });
      if (!result?.success) {
        setErrors({ form: result?.error || 'Could not save override.' });
        return;
      }
      resetEditor();
    } catch (error) {
      setErrors({ form: error.message || 'Could not save override.' });
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-800">Practitioner overrides</div>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {getOverrideApprovalNote(status)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(previous => !previous)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <History className="h-3.5 w-3.5" />
            {showHistory ? 'Hide History' : 'View History'}
          </button>
          <button
            type="button"
            onClick={startAdd}
            disabled={!allowedOverrideTypes.length || busy}
            className="inline-flex items-center gap-1 rounded-lg bg-[#1B4F72] px-3 py-2 text-xs font-medium text-white hover:bg-[#2E75B6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Override
          </button>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {!activeItems.length ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
            No active practitioner overrides are saved for this document yet.
          </div>
        ) : (
          <div className="space-y-3">
            {activeItems.map(({ key, override, formatted }) => {
              const metaLine = [formatted.meta, formatTimestamp(formatted.timestamp)]
                .filter(Boolean)
                .join(' • ');

              return (
                <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{formatted.label}</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{formatted.value}</div>
                      <div className="mt-1 text-xs text-slate-600">{formatted.reason}</div>
                      {metaLine ? (
                        <div className="mt-1 text-[11px] text-slate-500">{metaLine}</div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(override)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => startClear(override)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mode ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-800">
                {mode === 'add' ? 'Add override' : mode === 'edit' ? 'Edit override' : 'Clear override'}
              </div>
              <button
                type="button"
                onClick={resetEditor}
                className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Override type</span>
                <select
                  value={draft.overrideType}
                  disabled={mode !== 'add' || busy}
                  onChange={event => {
                    const nextType = allowedOverrideTypes.find(option => option.value === event.target.value) || null;
                    setDraft(previous => ({
                      ...previous,
                      overrideType: event.target.value,
                      value: getDefaultDraftValue(nextType),
                    }));
                    setErrors({});
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1B4F72] disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {allowedOverrideTypes.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.overrideType ? (
                  <span className="text-xs text-rose-600">{errors.overrideType}</span>
                ) : null}
              </label>

              {mode !== 'clear' ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500">Override value</span>
                  {selectedType?.kind === 'enum' ? (
                    <select
                      value={draft.value}
                      disabled={busy}
                      onChange={event => {
                        setDraft(previous => ({ ...previous, value: event.target.value }));
                        setErrors({});
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1B4F72]"
                    >
                      {selectedType.options.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.value}
                      disabled={busy}
                      onChange={event => {
                        setDraft(previous => ({ ...previous, value: event.target.value }));
                        setErrors({});
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1B4F72]"
                    />
                  )}
                  {errors.value ? (
                    <span className="text-xs text-rose-600">{errors.value}</span>
                  ) : null}
                </label>
              ) : null}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Reason</span>
                <textarea
                  value={draft.reason}
                  rows={3}
                  disabled={busy}
                  onChange={event => {
                    setDraft(previous => ({ ...previous, reason: event.target.value }));
                    setErrors({});
                  }}
                  placeholder={
                    mode === 'clear'
                      ? 'Explain why the override should be removed.'
                      : 'Capture the practitioner rationale for this change.'
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1B4F72]"
                />
                {errors.reason ? (
                  <span className="text-xs text-rose-600">{errors.reason}</span>
                ) : null}
              </label>

              {errors.form ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {errors.form}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={busy}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                    mode === 'clear'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-[#1B4F72] hover:bg-[#2E75B6]'
                  }`}
                >
                  <Save className="h-3.5 w-3.5" />
                  {busy
                    ? 'Saving...'
                    : mode === 'clear'
                      ? 'Confirm Clear'
                      : 'Save Override'}
                </button>
                <button
                  type="button"
                  onClick={resetEditor}
                  disabled={busy}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showHistory ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="mb-3 text-sm font-semibold text-slate-800">Override history</div>
            {!historyItems.length ? (
              <div className="text-sm text-slate-500">No override history has been recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {historyItems.map(({ key, formatted }) => {
                  const metaLine = [formatted.meta, formatTimestamp(formatted.timestamp)]
                    .filter(Boolean)
                    .join(' • ');

                  return (
                    <div key={key} className="rounded-lg bg-white px-3 py-3">
                      <div className="text-sm font-semibold text-slate-800">{formatted.title}</div>
                      <div className="mt-1 text-xs font-medium text-slate-600">{formatted.description}</div>
                      <div className="mt-1 text-xs text-slate-600">{formatted.reason}</div>
                      {metaLine ? (
                        <div className="mt-1 text-[11px] text-slate-500">{metaLine}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
