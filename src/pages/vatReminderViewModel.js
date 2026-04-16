const SEVERITY_ORDER = {
  error: 0,
  warning: 1,
  info: 2,
};

function hasFlags(flags) {
  if (Array.isArray(flags)) return flags.length > 0;
  if (typeof flags === 'string') return !['', '[]', 'null', '{}'].includes(flags);
  return Boolean(flags);
}

export function getVisibleReminders(reminders = []) {
  const items = [...reminders].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );

  return {
    items: items.slice(0, 3),
    overflowCount: Math.max(items.length - 3, 0),
  };
}

export function getSnoozeChoices() {
  return ['1 day', '3 days', 'until period end'];
}

export function getSnoozeUntilPeriodEnd(period, now = new Date()) {
  if (!period) return null;
  const [year, month] = period.split('-').map(Number);
  const periodEnd = new Date(year, month + 1, 0);
  periodEnd.setHours(23, 59, 59, 999);
  return periodEnd;
}

export function getReminderActionState(reminder, receipts = []) {
  if (!reminder) return null;

  if (reminder.ruleKey === 'flagged_receipts') {
    const flaggedReceipt = receipts.find(receipt => hasFlags(receipt.flags));
    return {
      activeTab: reminder.actionTab || 'receipts',
      statusFilter: 'all',
      selectedReceiptId: flaggedReceipt?.id || null,
      showDetail: Boolean(flaggedReceipt),
      editMode: false,
    };
  }

  if (reminder.actionTab === 'receipts') {
    return {
      activeTab: 'receipts',
      statusFilter: reminder.actionFilter || 'all',
      selectedReceiptId: null,
      showDetail: false,
      editMode: false,
    };
  }

  if (reminder.actionTab === 'schedule') {
    return {
      activeTab: 'schedule',
      statusFilter: 'all',
      selectedReceiptId: null,
      showDetail: false,
      editMode: false,
    };
  }

  return {
    activeTab: reminder.actionTab || 'receipts',
    statusFilter: 'all',
    selectedReceiptId: null,
    showDetail: false,
    editMode: false,
  };
}
