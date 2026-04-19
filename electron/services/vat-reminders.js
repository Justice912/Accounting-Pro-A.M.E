const PRIORITY = {
  period_closing: 0,
  critical_compliance_findings: 1,
  pending_receipts: 2,
  flagged_receipts: 3,
  queried_receipts: 4,
  duplicate_documents: 5,
  schedule_missing: 6,
  schedule_stale: 7,
  high_penalty_risk: 8,
};

const META = {
  pending_receipts: {
    title: 'Pending receipts',
    severity: 'warning',
    actionTab: 'receipts',
    actionFilter: 'pending',
  },
  critical_compliance_findings: {
    title: 'Critical compliance findings',
    severity: 'error',
    actionTab: 'receipts',
    actionFilter: null,
  },
  flagged_receipts: {
    title: 'Flagged receipts',
    severity: 'warning',
    actionTab: 'receipts',
    actionFilter: null,
  },
  queried_receipts: {
    title: 'Queried receipts',
    severity: 'info',
    actionTab: 'receipts',
    actionFilter: 'query',
  },
  schedule_missing: {
    title: 'VAT schedule missing',
    severity: 'warning',
    actionTab: 'schedule',
    actionFilter: null,
  },
  schedule_stale: {
    title: 'VAT schedule stale',
    severity: 'warning',
    actionTab: 'schedule',
    actionFilter: null,
  },
  duplicate_documents: {
    title: 'Duplicate documents',
    severity: 'warning',
    actionTab: 'receipts',
    actionFilter: null,
  },
  high_penalty_risk: {
    title: 'High penalty risk',
    severity: 'error',
    actionTab: 'schedule',
    actionFilter: null,
  },
  period_closing: {
    title: 'Period closing soon',
    severity: 'error',
    actionTab: 'schedule',
    actionFilter: null,
  },
};

function parseFlags(flags) {
  if (Array.isArray(flags)) return flags;
  try {
    const parsed = JSON.parse(flags || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getPeriodDates(period) {
  const [year, month] = String(period || '').split('-').map(Number);
  if (!year || !month) return { start: null, end: null };

  const startMonth = month % 2 === 0 ? month - 1 : month;
  const endMonth = startMonth + 1;
  const endDate = new Date(year, endMonth, 0);
  return {
    start: `${year}-${String(startMonth).padStart(2, '0')}-01`,
    end: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`,
  };
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sumBy(rows, selector) {
  return rows.reduce((total, row) => total + (Number(selector(row)) || 0), 0);
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildReminderMessage(ruleKey, count, period, extras = {}) {
  switch (ruleKey) {
    case 'critical_compliance_findings':
      return `${pluralize(count, 'receipt')} have unresolved critical VAT compliance findings for ${period}.`;
    case 'pending_receipts':
      return `${pluralize(count, 'receipt')} still need review for ${period}.`;
    case 'flagged_receipts':
      return `${pluralize(count, 'receipt')} have flags that need attention for ${period}.`;
    case 'queried_receipts':
      return `${pluralize(count, 'receipt')} are marked as query for ${period}.`;
    case 'duplicate_documents':
      return `${pluralize(count, 'document')} are marked as duplicates or likely duplicates for ${period}.`;
    case 'schedule_missing':
      return `Approved receipts are ready, but the VAT schedule has not been generated for ${period}.`;
    case 'schedule_stale':
      return `The VAT schedule is out of date and should be regenerated for ${period}.`;
    case 'high_penalty_risk':
      return `Penalty risk is elevated for ${period} and needs review before filing.`;
    case 'period_closing':
      return `This VAT period closes in ${count} ${count === 1 ? 'day' : 'days'}.`;
    default:
      return extras.message || '';
  }
}

function buildReminder(ruleKey, clientId, period, count, extras = {}) {
  const meta = META[ruleKey] || {};
  return {
    clientId,
    period,
    ruleKey,
    count,
    title: meta.title || ruleKey,
    severity: meta.severity || 'info',
    actionTab: meta.actionTab ?? null,
    actionFilter: meta.actionFilter ?? null,
    message: buildReminderMessage(ruleKey, count, period, extras),
    ...extras,
  };
}

function stableFingerprint(value) {
  if (value == null) return 'null';
  if (Array.isArray(value)) return `[${value.map(stableFingerprint).join(',')}]`;
  if (typeof value !== 'object') return JSON.stringify(value);

  return `{${Object.keys(value)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableFingerprint(value[key])}`)
    .join(',')}}`;
}

function fingerprintItem(item) {
  if (item?.signature) return String(item.signature);

  return stableFingerprint({
    id: item?.id ?? null,
    status: item?.status ?? null,
    updated_at: item?.updated_at ?? null,
    vat_amount: item?.vat_amount ?? null,
    total_excl_vat: item?.total_excl_vat ?? null,
    total_incl_vat: item?.total_incl_vat ?? null,
    compliance_score: item?.compliance_score ?? null,
    critical_finding_count: item?.critical_finding_count ?? null,
    duplicate_status: item?.duplicate_status ?? null,
    flags: parseFlags(item?.flags).slice().sort(),
  });
}

export function makeConditionSignature(ruleKey, items = [], context = {}) {
  return `${ruleKey}:${items.length}:${items.map(fingerprintItem).sort().join('|')}:${stableFingerprint(context)}`;
}

export function applyReminderState({ reminders = [], stateRows = [], now = new Date() }) {
  const current = now instanceof Date ? now : new Date(now);

  return reminders.filter(reminder => {
    const match = stateRows.find(row => row.rule_key === reminder.ruleKey);
    if (!match) return true;
    if (match.condition_signature && match.condition_signature !== reminder.conditionSignature) return true;
    if (match.state === 'dismissed') return false;
    if (match.state === 'snoozed' && match.snoozed_until && new Date(match.snoozed_until) > current) return false;
    return true;
  });
}

export function buildReminderCandidates({
  clientId,
  period,
  receipts = [],
  schedule = null,
  reminderStateRows = [],
  now = new Date(),
  closingDays = 7,
}) {
  const reminderDate = now instanceof Date ? now : new Date(now);
  const pending = receipts.filter(receipt => receipt.status === 'pending');
  const queried = receipts.filter(receipt => receipt.status === 'query');
  const flagged = receipts.filter(receipt => receipt.status !== 'approved' && parseFlags(receipt.flags).length > 0);
  const criticalCompliance = receipts.filter(receipt => (
    receipt.status !== 'approved' &&
    (
      (Number(receipt.critical_finding_count) || 0) > 0 ||
      (receipt.compliance_score != null && Number(receipt.compliance_score) < 50)
    )
  ));
  const duplicates = receipts.filter(receipt => (
    receipt.status !== 'approved' &&
    ['duplicate', 'probable', 'suspected'].includes(String(receipt.duplicate_status || '').toLowerCase())
  ));
  const approved = receipts.filter(receipt => receipt.status === 'approved');
  const reminders = [];

  if (criticalCompliance.length) {
    reminders.push(buildReminder('critical_compliance_findings', clientId, period, criticalCompliance.length, {
      conditionSignature: makeConditionSignature('critical_compliance_findings', criticalCompliance),
    }));
  }

  if (pending.length) {
    reminders.push(buildReminder('pending_receipts', clientId, period, pending.length, {
      conditionSignature: makeConditionSignature('pending_receipts', pending),
    }));
  }

  if (flagged.length) {
    reminders.push(buildReminder('flagged_receipts', clientId, period, flagged.length, {
      conditionSignature: makeConditionSignature('flagged_receipts', flagged),
    }));
  }

  if (queried.length) {
    reminders.push(buildReminder('queried_receipts', clientId, period, queried.length, {
      conditionSignature: makeConditionSignature('queried_receipts', queried),
    }));
  }

  if (duplicates.length) {
    reminders.push(buildReminder('duplicate_documents', clientId, period, duplicates.length, {
      conditionSignature: makeConditionSignature('duplicate_documents', duplicates),
    }));
  }

  if (approved.length && !schedule) {
    reminders.push(buildReminder('schedule_missing', clientId, period, approved.length, {
      conditionSignature: makeConditionSignature('schedule_missing', approved),
    }));
  }

  let scheduleStale = false;
  if (schedule) {
    const scheduleUpdatedAt = toDate(schedule.updated_at);
    const approvedUpdatedAfterSchedule = scheduleUpdatedAt
      ? receipts.some(receipt => {
        if (receipt.status !== 'approved') return false;
        const receiptUpdatedAt = toDate(receipt.updated_at);
        return receiptUpdatedAt && receiptUpdatedAt > scheduleUpdatedAt;
      })
      : false;

    const approvedCountMismatch =
      schedule.approved_count != null && Number(schedule.approved_count) !== approved.length;

    const approvedVatTotal = sumBy(approved, receipt => receipt.vat_amount);
    const scheduleVatTotal =
      schedule.input_vat_total != null ? Number(schedule.input_vat_total) : null;
    const vatTotalMismatch =
      scheduleVatTotal != null && Math.abs(scheduleVatTotal - approvedVatTotal) > 0.01;

    scheduleStale = approvedUpdatedAfterSchedule || approvedCountMismatch || vatTotalMismatch;

    if (scheduleStale) {
      reminders.push(buildReminder('schedule_stale', clientId, period, approved.length || receipts.length, {
        conditionSignature: makeConditionSignature('schedule_stale', approved, {
          approvedCount: schedule.approved_count ?? null,
          inputVatTotal: schedule.input_vat_total ?? null,
          receiptCount: schedule.receipt_count ?? null,
          scheduleUpdatedAt: schedule.updated_at ?? null,
        }),
      }));
    }

    if (Number(schedule.penalty_risk_amount) > 0) {
      reminders.push(buildReminder('high_penalty_risk', clientId, period, 1, {
        conditionSignature: makeConditionSignature('high_penalty_risk', [schedule], {
          penaltyRiskAmount: schedule.penalty_risk_amount,
        }),
      }));
    }
  }

  const { end } = getPeriodDates(period);
  const periodEnd = toDate(end);
  const daysToEnd = periodEnd
    ? Math.ceil((periodEnd.getTime() - reminderDate.getTime()) / 86400000)
    : null;
  const needsClosingReminder =
    daysToEnd != null &&
    daysToEnd <= closingDays &&
    daysToEnd >= 0 &&
    (pending.length || queried.length || flagged.length || (approved.length && !schedule) || scheduleStale);

  if (needsClosingReminder) {
    const closingItems = [...pending, ...queried, ...flagged];
    if (!schedule || scheduleStale) {
      closingItems.push(...approved);
    }
    reminders.push(buildReminder('period_closing', clientId, period, daysToEnd, {
      conditionSignature: makeConditionSignature('period_closing', closingItems),
    }));
  }

  return applyReminderState({
    reminders: reminders.sort((a, b) => PRIORITY[a.ruleKey] - PRIORITY[b.ruleKey]),
    stateRows: reminderStateRows,
    now: reminderDate,
  });
}

export { parseFlags };
