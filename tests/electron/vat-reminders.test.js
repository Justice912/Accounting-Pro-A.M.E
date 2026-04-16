import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReminderCandidates } from '../../electron/services/vat-reminders.js';

test('buildReminderCandidates returns VAT reminder rules in priority order', () => {
  const reminders = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: [
      { id: 'r1', status: 'pending', flags: '[]', updated_at: '2026-04-24T08:00:00Z' },
      { id: 'r2', status: 'query', flags: '["low_confidence"]', updated_at: '2026-04-24T09:00:00Z' },
      {
        id: 'r3',
        status: 'approved',
        flags: '[]',
        vat_amount: 150,
        total_excl_vat: 1000,
        total_incl_vat: 1150,
        updated_at: '2026-04-20T09:00:00Z',
      },
    ],
    schedule: null,
    reminderStateRows: [],
    now: new Date('2026-04-26T10:00:00Z'),
    closingDays: 7,
  });

  assert.deepEqual(
    reminders.map(r => r.ruleKey),
    [
      'period_closing',
      'pending_receipts',
      'flagged_receipts',
      'queried_receipts',
      'schedule_missing',
    ]
  );
});
