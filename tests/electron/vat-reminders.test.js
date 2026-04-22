import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyReminderState,
  buildReminderCandidates,
  parseFlags,
} from '../../electron/services/vat-reminders.js';
import { getReminderActionState } from '../../src/pages/vatReminderViewModel.js';
import registerVatHandlers, { getVatReminderClientIdsForPeriod } from '../../electron/ipc/vat-handlers.js';

function createFakeIpcMain() {
  const handlers = {};
  return {
    handlers,
    handle(name, handler) {
      handlers[name] = handler;
    },
  };
}

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

test('reminder candidates include tab and filter metadata for renderer actions', () => {
  const reminders = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: [
      {
        id: 'r1',
        status: 'pending',
        flags: '[]',
        updated_at: '2026-04-24T08:00:00Z',
      },
      {
        id: 'r2',
        status: 'pending_review',
        flags: '["low_confidence"]',
        updated_at: '2026-04-24T09:00:00Z',
      },
    ],
    schedule: null,
    reminderStateRows: [],
    now: new Date('2026-04-26T10:00:00Z'),
    closingDays: 7,
  });

  const pending = reminders.find(r => r.ruleKey === 'pending_receipts');
  assert.equal(pending.actionTab, 'receipts');
  assert.equal(pending.actionFilter, 'pending');

  const flagged = reminders.find(r => r.ruleKey === 'flagged_receipts');
  assert.equal(flagged.actionTab, 'receipts');
  assert.equal(flagged.actionFilter, null);
});

test('vat reminder count discovery includes schedule-only clients', () => {
  const queries = [];
  const fakeDb = {
    getAll(sql, params) {
      queries.push({ sql, params });
      if (sql.includes('FROM vat_receipts')) {
        return [{ client_id: 'client-a' }];
      }
      if (sql.includes('FROM vat_schedules')) {
        return [{ client_id: 'client-b' }];
      }
      return [];
    },
  };

  assert.deepEqual(getVatReminderClientIdsForPeriod(fakeDb, '2026-03'), ['client-a', 'client-b']);
  assert.equal(queries.length, 2);
});

test('vat:reminders:get returns reminder candidates from receipts, schedule, and state rows', async () => {
  const pendingReceipts = [
    {
      id: 'r1',
      status: 'pending',
      flags: '[]',
      updated_at: '2026-04-24T08:00:00Z',
    },
    {
      id: 'r2',
      status: 'approved',
      flags: '[]',
      vat_amount: 175,
      total_excl_vat: 1000,
      total_incl_vat: 1175,
      updated_at: '2026-04-25T09:00:00Z',
    },
  ];
  const schedule = {
    id: 'client-1_2026-03',
    updated_at: '2026-04-24T08:00:00Z',
    approved_count: 1,
    input_vat_total: 150,
  };
  const pendingSignature = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: pendingReceipts,
    schedule,
    reminderStateRows: [],
    now: new Date('2026-04-26T10:00:00Z'),
    closingDays: 7,
  }).find(reminder => reminder.ruleKey === 'pending_receipts').conditionSignature;

  const fakeDb = {
    getAll(sql, params) {
      if (sql.includes('FROM vat_receipts WHERE client_id = ? AND vat_period = ?')) {
        assert.deepEqual(params, ['client-1', '2026-03']);
        return pendingReceipts;
      }
      if (sql.includes('FROM vat_reminder_state WHERE client_id = ? AND vat_period = ?')) {
        assert.deepEqual(params, ['client-1', '2026-03']);
        return [
          {
            rule_key: 'pending_receipts',
            state: 'dismissed',
            snoozed_until: null,
            condition_signature: pendingSignature,
          },
        ];
      }
      return [];
    },
    getOne(sql, params) {
      if (sql.includes('FROM vat_schedules WHERE client_id = ? AND period = ?')) {
        assert.deepEqual(params, ['client-1', '2026-03']);
        return schedule;
      }
      return null;
    },
  };
  const ipcMain = createFakeIpcMain();

  registerVatHandlers(ipcMain, { database: fakeDb, keychain: {} });
  const reminders = await ipcMain.handlers['vat:reminders:get']({}, 'client-1', '2026-03');

  assert.deepEqual(reminders.map(reminder => reminder.ruleKey), ['schedule_stale']);
});

test('vat:reminder:update-state writes reminder state through the composite key', async () => {
  const runCalls = [];
  const getOneCalls = [];
  const fakeDb = {
    run(sql, params) {
      runCalls.push({ sql, params });
    },
    getOne(sql, params) {
      getOneCalls.push({ sql, params });
      return {
        client_id: params[0],
        vat_period: params[1],
        rule_key: params[2],
        state: 'dismissed',
        snoozed_until: null,
        condition_signature: 'sig-1',
      };
    },
  };
  const ipcMain = createFakeIpcMain();

  registerVatHandlers(ipcMain, { database: fakeDb, keychain: {} });
  const result = await ipcMain.handlers['vat:reminder:update-state']({}, {
    clientId: 'client-1',
    period: '2026-03',
    ruleKey: 'pending_receipts',
    action: 'dismissed',
    conditionSignature: 'sig-1',
  });

  assert.equal(result.success, true);
  assert.match(runCalls[0].sql, /ON CONFLICT\(client_id, vat_period, rule_key\) DO UPDATE SET/);
  assert.deepEqual(runCalls[0].params.slice(1, 4), ['client-1', '2026-03', 'pending_receipts']);
  assert.deepEqual(getOneCalls[0].params, ['client-1', '2026-03', 'pending_receipts']);
});

test('vat:reminders:count includes clients discovered from schedules as well as receipts', async () => {
  const queries = [];
  const fakeDb = {
    getAll(sql, params) {
      queries.push({ sql, params });
      if (sql.includes('SELECT DISTINCT client_id FROM vat_receipts WHERE vat_period = ?')) {
        return [{ client_id: 'client-a' }];
      }
      if (sql.includes('SELECT DISTINCT client_id FROM vat_schedules WHERE period = ?')) {
        return [{ client_id: 'client-b' }];
      }
      if (sql.includes('FROM vat_receipts WHERE client_id = ? AND vat_period = ?') && params[0] === 'client-a') {
        return [
          {
            id: 'r1',
            status: 'pending',
            flags: '[]',
            updated_at: '2026-04-24T08:00:00Z',
          },
        ];
      }
      if (sql.includes('FROM vat_receipts WHERE client_id = ? AND vat_period = ?') && params[0] === 'client-b') {
        return [];
      }
      if (sql.includes('FROM vat_reminder_state WHERE client_id = ? AND vat_period = ?')) {
        return [];
      }
      return [];
    },
    getOne(sql, params) {
      if (sql.includes('FROM vat_schedules WHERE client_id = ? AND period = ?') && params[0] === 'client-a') {
        return null;
      }
      if (sql.includes('FROM vat_schedules WHERE client_id = ? AND period = ?') && params[0] === 'client-b') {
        return {
          id: 'client-b_2026-03',
          updated_at: '2026-04-01T08:00:00Z',
          approved_count: 0,
          input_vat_total: 0,
        };
      }
      return null;
    },
  };
  const ipcMain = createFakeIpcMain();

  registerVatHandlers(ipcMain, {
    database: fakeDb,
    keychain: {},
    now: new Date('2026-04-26T10:00:00Z'),
  });

  const result = await ipcMain.handlers['vat:reminders:count']();

  assert.equal(result.count, 1);
  assert.ok(queries.some(entry => entry.sql.includes('SELECT DISTINCT client_id FROM vat_schedules WHERE period = ?')));
  assert.ok(queries.some(entry => entry.sql.includes('FROM vat_receipts WHERE client_id = ? AND vat_period = ?') && entry.params[0] === 'client-b'));
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
  const closingReminder = reminders.find(r => r.ruleKey === 'period_closing');
  assert.equal(closingReminder.actionTab, 'receipts');
  assert.equal(closingReminder.actionFilter, 'pending');
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
  const closingReminder = reminders.find(r => r.ruleKey === 'period_closing');
  assert.equal(closingReminder.actionTab, 'receipts');
  assert.equal(closingReminder.actionFilter, 'all');
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
  const closingReminder = reminders.find(r => r.ruleKey === 'period_closing');
  assert.equal(closingReminder.actionTab, 'schedule');
  assert.equal(closingReminder.actionFilter, null);
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

test('flagged reminder focuses the first non-approved flagged receipt', () => {
  const result = getReminderActionState(
    { ruleKey: 'flagged_receipts', actionTab: 'receipts' },
    [
      { id: 'r1', status: 'approved', flags: '["low_confidence"]' },
      { id: 'r2', status: 'pending', flags: '["low_confidence"]' },
    ]
  );

  assert.equal(result.selectedReceiptId, 'r2');
  assert.equal(result.showDetail, true);
});

if (process.execArgv.includes('--test-isolation=none')) {
  const { ensureVatReminderStateIndex } = await import('../../electron/services/database.js');
  const Database = (await import('better-sqlite3')).default;

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

    assert.equal(execCalls.length, 3);
    assert.equal(execCalls[0], 'DROP INDEX IF EXISTS idx_vat_reminder_state_period');
    assert.match(execCalls[1], /DELETE FROM vat_reminder_state/);
    assert.equal(execCalls[2], 'CREATE UNIQUE INDEX IF NOT EXISTS idx_vat_reminder_state_period ON vat_reminder_state(client_id, vat_period, rule_key)');
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

  test('ensureVatReminderStateIndex removes duplicate reminder-state rows before creating the unique index', () => {
    const db = new Database(':memory:');
    db.exec(`
      CREATE TABLE vat_reminder_state (
        id TEXT PRIMARY KEY,
        client_id TEXT,
        vat_period TEXT NOT NULL,
        rule_key TEXT NOT NULL,
        state TEXT NOT NULL,
        snoozed_until TEXT,
        condition_signature TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO vat_reminder_state (id, client_id, vat_period, rule_key, state, updated_at)
      VALUES
        ('old-1', 'client-1', '2026-03', 'pending_receipts', 'dismissed', '2026-04-25T08:00:00Z'),
        ('new-1', 'client-1', '2026-03', 'pending_receipts', 'snoozed', '2026-04-26T08:00:00Z'),
        ('only-1', 'client-1', '2026-05', 'schedule_missing', 'dismissed', '2026-04-26T08:00:00Z');
    `);

    ensureVatReminderStateIndex(db);

    const remaining = db.prepare(`
      SELECT id, client_id, vat_period, rule_key, state, updated_at
      FROM vat_reminder_state
      ORDER BY client_id, vat_period, rule_key, updated_at
    `).all();
    const indexes = db.prepare("PRAGMA index_list('vat_reminder_state')").all();

    assert.equal(remaining.length, 2);
    assert.deepEqual(remaining.find(row => row.rule_key === 'pending_receipts'), {
      id: 'new-1',
      client_id: 'client-1',
      vat_period: '2026-03',
      rule_key: 'pending_receipts',
      state: 'snoozed',
      updated_at: '2026-04-26T08:00:00Z',
    });
    assert.ok(indexes.some(row => row.name === 'idx_vat_reminder_state_period' && row.unique === 1));
    db.close();
  });
}
