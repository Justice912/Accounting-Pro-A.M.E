const SEVERITY_ORDER = {
  error: 0,
  warning: 1,
  info: 2,
};

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
