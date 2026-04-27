import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import registerVatHandlers from '../../electron/ipc/vat-handlers.js';
import { ensureVatComplianceSchema } from '../../electron/services/database.js';

function createFakeIpcMain() {
  const handlers = {};
  return {
    handlers,
    handle(name, handler) {
      handlers[name] = handler;
    },
  };
}

function createDatabaseWrapper() {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      vat_number TEXT
    );

    CREATE TABLE vat_receipts (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      supplier_name TEXT,
      invoice_number TEXT,
      invoice_date TEXT,
      total_incl_vat REAL DEFAULT 0,
      vat_amount REAL DEFAULT 0,
      total_excl_vat REAL DEFAULT 0,
      line_items TEXT,
      vat_type TEXT DEFAULT 'standard',
      vat_period TEXT,
      status TEXT DEFAULT 'pending',
      flags TEXT DEFAULT '[]',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE vat_schedules (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      period TEXT,
      updated_at TEXT
    );

    CREATE TABLE vat_bank_transactions (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      txn_date TEXT,
      is_matched INTEGER DEFAULT 0
    );

    CREATE TABLE vat_reminder_state (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      vat_period TEXT,
      rule_key TEXT,
      state TEXT,
      snoozed_until TEXT,
      condition_signature TEXT,
      updated_at TEXT
    );
  `);
  ensureVatComplianceSchema(sqlite);

  return {
    getOne(sql, params = []) {
      return sqlite.prepare(sql).get(...(Array.isArray(params) ? params : [params]));
    },
    getAll(sql, params = []) {
      return sqlite.prepare(sql).all(...(Array.isArray(params) ? params : [params]));
    },
    run(sql, params = []) {
      return sqlite.prepare(sql).run(...(Array.isArray(params) ? params : [params]));
    },
    insert(table, row) {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(column => row[column]);
      sqlite.prepare(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
      ).run(...values);
      return row.id;
    },
    close() {
      sqlite.close();
    },
  };
}

test('vat:dashboard:get includes compliance score and penalty risk from period summaries', async () => {
  const fakeDb = {
    getAll(sql) {
      if (sql.includes('SELECT DISTINCT client_id FROM vat_receipts WHERE vat_period = ?')) {
        return [];
      }
      if (sql.includes('SELECT DISTINCT client_id FROM vat_schedules WHERE period = ?')) {
        return [];
      }
      return [];
    },
    getOne(sql) {
      if (sql.includes('FROM vat_period_summaries')) {
        return {
          compliance_score: 82,
          penalty_risk_amount: 450,
          blocked_input_vat: 150,
          apportioned_input_vat: 90,
        };
      }
      return null;
    },
  };
  const ipcMain = createFakeIpcMain();

  registerVatHandlers(ipcMain, { database: fakeDb, keychain: {}, now: new Date('2026-04-26T10:00:00Z') });
  const result = await ipcMain.handlers['vat:dashboard:get']({}, '2026-03');

  assert.ok('averageComplianceScore' in result.summary);
  assert.ok('totalPenaltyRisk' in result.summary);
});

test('vat:dashboard:get uses approved effective override totals for client and summary VAT figures', async (t) => {
  const database = createDatabaseWrapper();
  t.after(() => database.close());

  database.insert('clients', {
    id: 'client-1',
    name: 'Acme Trading',
    vat_number: '4123456789',
  });

  database.insert('vat_receipts', {
    id: 'receipt-1',
    client_id: 'client-1',
    supplier_name: 'ABC Suppliers',
    invoice_number: 'INV-1',
    invoice_date: '2026-04-18',
    total_incl_vat: 1150,
    vat_amount: 150,
    total_excl_vat: 1000,
    line_items: JSON.stringify([]),
    vat_type: 'expense',
    vat_period: '2026-03',
    status: 'approved',
    flags: '[]',
    created_at: '2026-04-18T10:00:00Z',
    updated_at: '2026-04-18T10:00:00Z',
    document_kind: 'tax_invoice',
    compliance_score: 88,
    supply_type: 'standard',
    supply_type_reason: 'Defaulted to standard-rated supply.',
    blocked_input_amount: 0,
    apportioned_input_amount: 150,
    non_claimable_apportionment_amount: 0,
    time_of_supply_date: '2026-04-18',
    duplicate_status: 'clear',
    rules_evaluated_at: '2026-04-18T10:00:00Z',
  });

  const ipcMain = createFakeIpcMain();
  registerVatHandlers(ipcMain, { database, keychain: {}, now: new Date('2026-04-26T10:00:00Z') });

  const initialSummary = await ipcMain.handlers['vat:period-summary:get']({}, 'client-1', '2026-03');
  assert.equal(initialSummary.totals.inputVat, 150);

  const saveOverride = await ipcMain.handlers['vat:document:override:save']({}, {
    documentType: 'purchase_receipt',
    documentId: 'receipt-1',
    overrideType: 'claimable_vat_amount',
    value: 90,
    reason: 'Limit claimable VAT to the reviewed amount.',
    createdBy: 'qa.user',
  });

  assert.equal(saveOverride.success, true);

  const result = await ipcMain.handlers['vat:dashboard:get']({}, '2026-03');

  assert.equal(result.clients.length, 1);
  assert.equal(result.clients[0].inputVat, 90);
  assert.equal(result.clients[0].blockedInputVat, 60);
  assert.equal(result.clients[0].apportionedInputVat, 90);
  assert.equal(result.summary.totalInputVat, 90);
  assert.equal(result.summary.totalBlockedInputVat, 60);
  assert.equal(result.summary.totalApportionedInputVat, 90);
});
