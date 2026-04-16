import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getVisibleReminders,
  getSnoozeChoices,
  getSnoozeUntilPeriodEnd,
  getReminderActionState,
} from '../../../src/pages/vatReminderViewModel.js';

test('getVisibleReminders returns the top three reminders and overflow count', () => {
  const result = getVisibleReminders([
    { ruleKey: 'period_closing', severity: 'error' },
    { ruleKey: 'pending_receipts', severity: 'warning' },
    { ruleKey: 'flagged_receipts', severity: 'warning' },
    { ruleKey: 'schedule_missing', severity: 'warning' },
  ]);

  assert.equal(result.items.length, 3);
  assert.deepEqual(
    result.items.map(item => item.ruleKey),
    ['period_closing', 'pending_receipts', 'flagged_receipts']
  );
  assert.equal(result.overflowCount, 1);
});

test('getSnoozeChoices returns v1 preset options', () => {
  assert.deepEqual(
    getSnoozeChoices(),
    ['1 day', '3 days', 'until period end']
  );
});

test('getSnoozeUntilPeriodEnd returns the end of the VAT period day', () => {
  const result = getSnoozeUntilPeriodEnd('2026-03', new Date('2026-04-10T08:00:00Z'));

  assert.equal(result.getFullYear(), 2026);
  assert.equal(result.getMonth(), 3);
  assert.equal(result.getDate(), 30);
  assert.equal(result.getHours(), 23);
  assert.equal(result.getMinutes(), 59);
  assert.equal(result.getSeconds(), 59);
  assert.equal(result.getMilliseconds(), 999);
});

test('getReminderActionState focuses the first flagged receipt', () => {
  const result = getReminderActionState(
    { ruleKey: 'flagged_receipts', actionTab: 'receipts' },
    [
      { id: 'r1', flags: '[]' },
      { id: 'r2', flags: '["low_confidence"]' },
    ]
  );

  assert.deepEqual(result, {
    activeTab: 'receipts',
    statusFilter: 'all',
    selectedReceiptId: 'r2',
    showDetail: true,
    editMode: false,
  });
});
