import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import registerClientHandlers from '../../electron/ipc/client-handlers.js';
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
      trading_name TEXT,
      registration_number TEXT,
      vat_number TEXT,
      type TEXT DEFAULT 'individual',
      address TEXT,
      email TEXT,
      phone TEXT,
      contact_person TEXT,
      contact_details TEXT,
      industry TEXT,
      financial_year_end TEXT,
      tax_history TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE vat_receipts (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      invoice_date TEXT,
      vat_period TEXT,
      status TEXT
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

test('client:create persists VAT settings fields', async (t) => {
  const database = createDatabaseWrapper();
  t.after(() => database.close());

  const ipcMain = createFakeIpcMain();
  registerClientHandlers(ipcMain, { database });

  const result = await ipcMain.handlers['client:create']({}, {
    name: 'Acme Trading',
    vat_registered: true,
    vat_category: 'category_b',
    has_mixed_supplies: true,
    apportionment_ratio: 62.5,
    penalty_interest_rate: 11.25,
  });

  const stored = database.getOne('SELECT * FROM clients WHERE id = ?', [result.id]);

  assert.equal(result.success, true);
  assert.equal(stored.vat_registered, 1);
  assert.equal(stored.vat_category, 'category_b');
  assert.equal(stored.has_mixed_supplies, 1);
  assert.equal(stored.apportionment_ratio, 62.5);
  assert.equal(stored.penalty_interest_rate, 11.25);
});

test('client:update accepts VAT settings fields through the explicit update whitelist', async (t) => {
  const database = createDatabaseWrapper();
  t.after(() => database.close());

  database.insert('clients', {
    id: 'client-1',
    name: 'Acme Trading',
    type: 'company',
    vat_registered: 0,
    vat_category: null,
    has_mixed_supplies: 0,
    apportionment_ratio: null,
    penalty_interest_rate: 0,
  });

  const ipcMain = createFakeIpcMain();
  registerClientHandlers(ipcMain, { database });

  const result = await ipcMain.handlers['client:update']({}, 'client-1', {
    vat_registered: true,
    vat_category: 'category_a',
    has_mixed_supplies: true,
    apportionment_ratio: 75,
    penalty_interest_rate: 10.5,
  });

  const stored = database.getOne('SELECT * FROM clients WHERE id = ?', ['client-1']);

  assert.equal(result.success, true);
  assert.equal(stored.vat_registered, 1);
  assert.equal(stored.vat_category, 'category_a');
  assert.equal(stored.has_mixed_supplies, 1);
  assert.equal(stored.apportionment_ratio, 75);
  assert.equal(stored.penalty_interest_rate, 10.5);
});
