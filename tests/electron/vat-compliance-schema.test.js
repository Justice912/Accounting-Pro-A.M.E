import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { ensureVatComplianceSchema } from '../../electron/services/database.js';

test('ensureVatComplianceSchema creates compliance tables and client VAT settings columns', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      vat_number TEXT
    );
    CREATE TABLE vat_receipts (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      invoice_date TEXT,
      vat_period TEXT,
      status TEXT
    );
  `);

  ensureVatComplianceSchema(db);

  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name
  `).all().map(row => row.name);
  const clientColumns = db.prepare(`PRAGMA table_info('clients')`).all().map(row => row.name);

  assert.ok(tables.includes('vat_sales_invoices'));
  assert.ok(tables.includes('vat_rule_results'));
  assert.ok(tables.includes('vat_period_summaries'));
  assert.ok(clientColumns.includes('vat_category'));
  assert.ok(clientColumns.includes('vat_registered'));
  assert.ok(clientColumns.includes('has_mixed_supplies'));
  assert.ok(clientColumns.includes('apportionment_ratio'));
});
