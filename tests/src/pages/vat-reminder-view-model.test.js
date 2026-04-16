import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisibleReminders, getSnoozeChoices } from '../../../src/pages/vatReminderViewModel.js';

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
