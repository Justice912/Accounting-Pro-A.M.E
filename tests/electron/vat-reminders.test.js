import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyReminderState,
  buildReminderCandidates,
  parseFlags,
} from '../../electron/services/vat-reminders.js';
import { ensureVatReminderStateIndex } from '../../electron/services/database.js';

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

test('period_closing uses the end of April for the Mar/Apr VAT period', () => {
  const reminders = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: [
      {
        id: 'r1',
        status: 'pending',
        flags: '[]',
        updated_at: '2026-04-22T09:00:00Z',
      },
    ],
    schedule: null,
    reminderStateRows: [],
    now: new Date('2026-04-23T10:00:00Z'),
    closingDays: 7,
  });

  assert.deepEqual(reminders.map(r => r.ruleKey), ['period_closing', 'pending_receipts']);
});

test('period_closing does not fire in late January for the Nov/Dec VAT period', () => {
  const reminders = buildReminderCandidates({
    clientId: 'client-1',
    period: '2025-12',
    receipts: [
      {
        id: 'r1',
        status: 'pending',
        flags: '[]',
        updated_at: '2025-12-26T09:00:00Z',
      },
    ],
    schedule: null,
    reminderStateRows: [],
    now: new Date('2026-01-27T10:00:00Z'),
    closingDays: 7,
  });

  assert.deepEqual(reminders.map(r => r.ruleKey), ['pending_receipts']);
});

test('period_closing includes flagged-only work during closing window', () => {
  const reminders = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: [
      {
        id: 'r1',
        status: 'pending_review',
        flags: '["low_confidence"]',
        updated_at: '2026-04-25T09:00:00Z',
      },
    ],
    schedule: null,
    reminderStateRows: [],
    now: new Date('2026-04-26T10:00:00Z'),
    closingDays: 7,
  });

  assert.deepEqual(
    reminders.map(r => r.ruleKey),
    ['period_closing', 'flagged_receipts']
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

test('schedule_stale only tracks approved freshness', () => {
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
      approved_count: 1,
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

test('dismissed reminder stays hidden only while the signature matches', () => {
  const reminders = [
    { ruleKey: 'pending_receipts', count: 3, conditionSignature: 'pending:3:r1|r2|r3' },
  ];
  const stateRows = [
    {
      rule_key: 'pending_receipts',
      state: 'dismissed',
      condition_signature: 'pending:3:r1|r2|r3',
      snoozed_until: null,
    },
  ];

  assert.equal(applyReminderState({ reminders, stateRows, now: new Date('2026-04-20T10:00:00Z') }).length, 0);

  const resurfaced = applyReminderState({
    reminders: [{ ruleKey: 'pending_receipts', count: 4, conditionSignature: 'pending:4:r1|r2|r3|r4' }],
    stateRows,
    now: new Date('2026-04-20T10:00:00Z'),
  });

  assert.equal(resurfaced.length, 1);
});

test('buildReminderCandidates returns schedule_stale when approved receipts changed after schedule update', () => {
  const reminders = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: [
      {
        id: 'r3',
        status: 'approved',
        flags: '[]',
        vat_amount: 150,
        total_excl_vat: 1000,
        total_incl_vat: 1150,
        updated_at: '2026-04-25T09:00:00Z',
      },
    ],
    schedule: {
      id: 'client-1_2026-03',
      updated_at: '2026-04-24T08:00:00Z',
      approved_count: 1,
      input_vat_total: 120,
    },
    reminderStateRows: [],
    now: new Date('2026-04-26T10:00:00Z'),
    closingDays: 7,
  });

  assert.equal(reminders.some(r => r.ruleKey === 'schedule_stale'), true);
});

test('dismissed schedule_stale reminder resurfaces when approved values change but ids do not', () => {
  const staleBefore = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: [
      {
        id: 'r3',
        status: 'approved',
        flags: '[]',
        vat_amount: 150,
        total_excl_vat: 1000,
        total_incl_vat: 1150,
        updated_at: '2026-04-25T09:00:00Z',
      },
    ],
    schedule: {
      id: 'client-1_2026-03',
      updated_at: '2026-04-24T08:00:00Z',
      approved_count: 1,
      input_vat_total: 150,
    },
    reminderStateRows: [],
    now: new Date('2026-04-26T10:00:00Z'),
    closingDays: 7,
  }).find(reminder => reminder.ruleKey === 'schedule_stale');

  const stateRows = [
    {
      rule_key: 'schedule_stale',
      state: 'dismissed',
      condition_signature: staleBefore.conditionSignature,
      snoozed_until: null,
      updated_at: '2026-04-26T10:00:00Z',
    },
  ];

  const staleAfter = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: [
      {
        id: 'r3',
        status: 'approved',
        flags: '[]',
        vat_amount: 175,
        total_excl_vat: 1000,
        total_incl_vat: 1175,
        updated_at: '2026-04-25T09:00:00Z',
      },
    ],
    schedule: {
      id: 'client-1_2026-03',
      updated_at: '2026-04-24T08:00:00Z',
      approved_count: 1,
      input_vat_total: 150,
    },
    reminderStateRows: [],
    now: new Date('2026-04-26T10:00:00Z'),
    closingDays: 7,
  }).find(reminder => reminder.ruleKey === 'schedule_stale');

  assert.notEqual(staleBefore.conditionSignature, staleAfter.conditionSignature);
  assert.equal(
    applyReminderState({
      reminders: [staleAfter],
      stateRows,
      now: new Date('2026-04-26T10:00:00Z'),
    }).length,
    1
  );
});

test('ensureVatReminderStateIndex rebuilds a legacy non-unique reminder index as unique', () => {
  const execCalls = [];
  const fakeDb = {
    prepare(sql) {
      assert.equal(sql, "PRAGMA index_list('vat_reminder_state')");
      return {
        all() {
          return [
            { name: 'idx_vat_reminder_state_period', unique: 0 },
          ];
        },
      };
    },
    exec(sql) {
      execCalls.push(sql);
    },
  };

  ensureVatReminderStateIndex(fakeDb);

  assert.deepEqual(execCalls, [
    'DROP INDEX IF EXISTS idx_vat_reminder_state_period',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_vat_reminder_state_period ON vat_reminder_state(client_id, vat_period, rule_key)',
  ]);
});

test('ensureVatReminderStateIndex leaves an already unique reminder index alone', () => {
  const execCalls = [];
  const fakeDb = {
    prepare(sql) {
      assert.equal(sql, "PRAGMA index_list('vat_reminder_state')");
      return {
        all() {
          return [
            { name: 'idx_vat_reminder_state_period', unique: 1 },
          ];
        },
      };
    },
    exec(sql) {
      execCalls.push(sql);
    },
  };

  ensureVatReminderStateIndex(fakeDb);

  assert.deepEqual(execCalls, []);
});
