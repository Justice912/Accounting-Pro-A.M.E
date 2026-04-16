import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReminderCandidates,
  parseFlags,
} from '../../electron/services/vat-reminders.js';

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

test('parseFlags always returns an array', () => {
  assert.deepEqual(parseFlags('null'), []);
  assert.deepEqual(parseFlags('{}'), []);
  assert.deepEqual(parseFlags('["low_confidence"]'), ['low_confidence']);
});

test('schedule_stale ignores pending and query edits made after the schedule', () => {
  const reminders = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: [
      {
        id: 'r1',
        status: 'pending',
        flags: '[]',
        updated_at: '2026-04-25T08:00:00Z',
      },
      {
        id: 'r2',
        status: 'query',
        flags: '[]',
        updated_at: '2026-04-25T09:00:00Z',
      },
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
    schedule: {
      updated_at: '2026-04-24T10:00:00Z',
      receipt_count: 3,
      approved_count: 1,
      pending_count: 1,
      flagged_count: 0,
      input_vat_total: 150,
    },
    reminderStateRows: [],
    now: new Date('2026-04-26T10:00:00Z'),
    closingDays: 7,
  });

  assert.equal(
    reminders.some(reminder => reminder.ruleKey === 'schedule_stale'),
    false
  );
});

test('period_closing includes stale schedules as outstanding work', () => {
  const reminders = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: [
      {
        id: 'r1',
        status: 'approved',
        flags: '[]',
        vat_amount: 175,
        total_excl_vat: 1000,
        total_incl_vat: 1175,
        updated_at: '2026-04-25T09:00:00Z',
      },
    ],
    schedule: {
      updated_at: '2026-04-24T10:00:00Z',
      receipt_count: 1,
      approved_count: 1,
      pending_count: 0,
      flagged_count: 0,
      input_vat_total: 150,
    },
    reminderStateRows: [],
    now: new Date('2026-04-26T10:00:00Z'),
    closingDays: 7,
  });

  assert.deepEqual(
    reminders.map(r => r.ruleKey),
    ['period_closing', 'schedule_stale']
  );
});
