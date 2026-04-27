import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { ensureVatComplianceSchema } from '../../electron/services/database.js';

function getColumnNames(db, tableName) {
  return db.prepare(`PRAGMA table_info('${tableName}')`).all().map(row => row.name);
}

function getIndexColumns(db, indexName) {
  return db.prepare(`PRAGMA index_info('${indexName}')`).all().map(row => row.name);
}

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
  const clientColumns = getColumnNames(db, 'clients');
  const overrideColumns = getColumnNames(db, 'vat_document_overrides');
  const overrideHistoryColumns = getColumnNames(db, 'vat_document_override_history');
  const overrideIndexes = db.prepare(`PRAGMA index_list('vat_document_overrides')`).all();
  const historyIndexes = db.prepare(`PRAGMA index_list('vat_document_override_history')`).all();
  const activeOverrideIndex = overrideIndexes.find((indexRow) => (
    Number(indexRow.unique) === 1
      && Number(indexRow.partial) === 1
      && getIndexColumns(db, indexRow.name).join(',') === 'document_type,document_id,override_type'
  ));
  const overrideDocumentIndex = overrideIndexes.find((indexRow) => (
    Number(indexRow.unique) === 0
      && getIndexColumns(db, indexRow.name).join(',') === 'document_type,document_id'
  ));
  const overrideHistoryDocumentIndex = historyIndexes.find((indexRow) => (
    getIndexColumns(db, indexRow.name).join(',') === 'document_type,document_id,created_at'
  ));

  assert.ok(tables.includes('vat_sales_invoices'));
  assert.ok(tables.includes('vat_rule_results'));
  assert.ok(tables.includes('vat_period_summaries'));
  assert.ok(tables.includes('vat_document_overrides'));
  assert.ok(tables.includes('vat_document_override_history'));
  assert.ok(clientColumns.includes('vat_category'));
  assert.ok(clientColumns.includes('vat_registered'));
  assert.ok(clientColumns.includes('has_mixed_supplies'));
  assert.ok(clientColumns.includes('apportionment_ratio'));
  assert.ok(overrideColumns.includes('document_type'));
  assert.ok(overrideColumns.includes('document_id'));
  assert.ok(overrideColumns.includes('override_type'));
  assert.ok(overrideColumns.includes('override_value_json'));
  assert.ok(overrideColumns.includes('reason'));
  assert.ok(overrideColumns.includes('created_by'));
  assert.ok(overrideColumns.includes('cleared_at'));
  assert.ok(overrideHistoryColumns.includes('event_type'));
  assert.ok(overrideHistoryColumns.includes('previous_value_json'));
  assert.ok(overrideHistoryColumns.includes('next_value_json'));
  assert.ok(activeOverrideIndex);
  assert.ok(overrideDocumentIndex);
  assert.ok(overrideHistoryDocumentIndex);
});
