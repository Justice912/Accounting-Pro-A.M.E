const PRIORITY = {
  period_closing: 0,
  pending_receipts: 1,
  flagged_receipts: 2,
  queried_receipts: 3,
  schedule_missing: 4,
  schedule_stale: 5,
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

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month + 1, 0);
  return {
    start: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`,
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

function buildReminder(ruleKey, clientId, period, count, extras = {}) {
  return {
    clientId,
    period,
    ruleKey,
    count,
    ...extras,
  };
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
  void reminderStateRows;

  const reminderDate = now instanceof Date ? now : new Date(now);
  const pending = receipts.filter(receipt => receipt.status === 'pending');
  const queried = receipts.filter(receipt => receipt.status === 'query');
  const flagged = receipts.filter(receipt => receipt.status !== 'approved' && parseFlags(receipt.flags).length > 0);
  const approved = receipts.filter(receipt => receipt.status === 'approved');
  const reminders = [];

  if (pending.length) {
    reminders.push(buildReminder('pending_receipts', clientId, period, pending.length));
  }

  if (flagged.length) {
    reminders.push(buildReminder('flagged_receipts', clientId, period, flagged.length));
  }

  if (queried.length) {
    reminders.push(buildReminder('queried_receipts', clientId, period, queried.length));
  }

  if (approved.length && !schedule) {
    reminders.push(buildReminder('schedule_missing', clientId, period, approved.length));
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
      reminders.push(buildReminder('schedule_stale', clientId, period, approved.length || receipts.length));
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
    reminders.push(buildReminder('period_closing', clientId, period, daysToEnd));
  }

  return reminders.sort((a, b) => PRIORITY[a.ruleKey] - PRIORITY[b.ruleKey]);
}

export { parseFlags };
