import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
      supplier_vat_number TEXT,
      supplier_address TEXT,
      invoice_number TEXT,
      invoice_date TEXT,
      payment_date TEXT,
      total_incl_vat REAL DEFAULT 0,
      vat_amount REAL DEFAULT 0,
      total_excl_vat REAL DEFAULT 0,
      line_items TEXT,
      vat_type TEXT DEFAULT 'standard',
      vat_period TEXT,
      status TEXT DEFAULT 'pending',
      review_notes TEXT,
      created_at TEXT,
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

function seedDocumentFixtures(database) {
  database.insert('clients', {
    id: 'client-1',
    name: 'Acme Trading',
    vat_number: '4123456789',
  });

  database.insert('vat_receipts', {
    id: 'receipt-1',
    client_id: 'client-1',
    supplier_name: 'ABC Suppliers',
    supplier_vat_number: '4123456789',
    supplier_address: '1 Main Road',
    invoice_number: 'INV-1',
    invoice_date: '2026-04-18',
    payment_date: '2026-04-18',
    total_incl_vat: 1150,
    vat_amount: 150,
    total_excl_vat: 1000,
    line_items: JSON.stringify([]),
    vat_type: 'expense',
    vat_period: '2026-03',
    status: 'pending',
    review_notes: null,
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

  database.insert('vat_sales_invoices', {
    id: 'sale-1',
    client_id: 'client-1',
    document_type: 'tax_invoice',
    customer_name: 'Customer A',
    customer_vat_number: '4123456789',
    customer_address: '2 Market Street',
    invoice_number: 'SALE-1',
    invoice_date: '2026-04-18',
    payment_date: '2026-04-18',
    total_incl_vat: 2300,
    vat_amount: 300,
    total_excl_vat: 2000,
    line_items: JSON.stringify([]),
    vat_period: '2026-03',
    document_kind: 'tax_invoice',
    supply_type: 'standard',
    supply_type_reason: 'Defaulted to standard-rated supply.',
    time_of_supply_date: '2026-04-18',
    duplicate_status: 'clear',
    compliance_score: 94,
    status: 'pending',
    review_notes: null,
    rules_evaluated_at: '2026-04-18T10:00:00Z',
    created_at: '2026-04-18T10:00:00Z',
    updated_at: '2026-04-18T10:00:00Z',
  });

  database.insert('vat_rule_results', {
    id: 'finding-1',
    source_type: 'purchase_receipt',
    source_id: 'receipt-1',
    client_id: 'client-1',
    vat_period: '2026-03',
    rule_key: 'section20_recipient_name',
    rule_name: 'section20_recipient_name',
    status: 'active',
    severity: 'critical',
    message: 'Recipient name missing.',
    details: JSON.stringify({ finding: { ruleKey: 'section20_recipient_name' } }),
    score: 25,
    created_at: '2026-04-18T10:00:00Z',
    updated_at: '2026-04-18T10:00:00Z',
  });
}

test('vat document override IPC handlers save, clear, and list history', async (t) => {
  const database = createDatabaseWrapper();
  t.after(() => database.close());
  seedDocumentFixtures(database);

  const ipcMain = createFakeIpcMain();
  registerVatHandlers(ipcMain, { database, keychain: {} });

  const saveResult = await ipcMain.handlers['vat:document:override:save']({}, {
    documentType: 'purchase_receipt',
    documentId: 'receipt-1',
    overrideType: 'claimable_vat_amount',
    value: 90,
    reason: 'Cap the claim to the reviewed amount.',
    createdBy: 'qa.user',
  });

  const listResult = await ipcMain.handlers['vat:document:overrides:get'](
    {},
    'purchase_receipt',
    'receipt-1'
  );

  const clearResult = await ipcMain.handlers['vat:document:override:clear']({}, {
    documentType: 'purchase_receipt',
    documentId: 'receipt-1',
    overrideType: 'claimable_vat_amount',
    reason: 'Return to the engine result.',
    clearedBy: 'reviewer.user',
  });

  const historyResult = await ipcMain.handlers['vat:document:override:history'](
    {},
    'purchase_receipt',
    'receipt-1'
  );

  assert.equal(saveResult.success, true);
  assert.equal(saveResult.override.override_type, 'claimable_vat_amount');
  assert.equal(listResult.success, true);
  assert.equal(listResult.overrides.length, 1);
  assert.equal(clearResult.success, true);
  assert.equal(clearResult.override.override_type, 'claimable_vat_amount');
  assert.equal(historyResult.success, true);
  assert.equal(historyResult.history.length, 2);
  assert.equal(historyResult.history[0].event_type, 'create');
  assert.equal(historyResult.history[1].event_type, 'clear');
});

test('receipt and sales detail handlers expose effective compliance alongside the base state', async (t) => {
  const database = createDatabaseWrapper();
  t.after(() => database.close());
  seedDocumentFixtures(database);

  const ipcMain = createFakeIpcMain();
  registerVatHandlers(ipcMain, { database, keychain: {} });

  await ipcMain.handlers['vat:document:override:save']({}, {
    documentType: 'purchase_receipt',
    documentId: 'receipt-1',
    overrideType: 'claimable_vat_amount',
    value: 90,
    reason: 'Cap the claim to the reviewed amount.',
    createdBy: 'qa.user',
  });

  await ipcMain.handlers['vat:document:override:save']({}, {
    documentType: 'sales_invoice',
    documentId: 'sale-1',
    overrideType: 'supply_type',
    value: 'zero',
    reason: 'Treat the invoice as zero-rated.',
    createdBy: 'qa.user',
  });

  const receiptDetail = await ipcMain.handlers['vat:receipt:compliance:get']({}, 'receipt-1');
  const salesDetail = await ipcMain.handlers['vat:sales:get']({}, 'sale-1');

  assert.equal(receiptDetail.receipt.id, 'receipt-1');
  assert.equal(receiptDetail.findings.length, 1);
  assert.equal(receiptDetail.baseCompliance.summary.apportionedInputAmount, 150);
  assert.equal(receiptDetail.effectiveCompliance.summary.apportionedInputAmount, 90);
  assert.equal(receiptDetail.activeOverrides.length, 1);
  assert.equal(receiptDetail.overrideHistory.length, 1);

  assert.equal(salesDetail.id, 'sale-1');
  assert.equal(salesDetail.baseCompliance.summary.supplyType, 'standard');
  assert.equal(salesDetail.effectiveCompliance.summary.supplyType, 'zero');
  assert.equal(salesDetail.activeOverrides.length, 1);
  assert.equal(salesDetail.overrideHistory.length, 1);
});

test('preload exposes VAT override helper methods', () => {
  const preloadSource = readFileSync(new URL('../../electron/preload.js', import.meta.url), 'utf8');

  assert.match(
    preloadSource,
    /vatGetDocumentOverrides:\s*\(documentType,\s*documentId\)\s*=>\s*ipcRenderer\.invoke\('vat:document:overrides:get',\s*documentType,\s*documentId\)/
  );
  assert.match(
    preloadSource,
    /vatSaveDocumentOverride:\s*\(payload\)\s*=>\s*ipcRenderer\.invoke\('vat:document:override:save',\s*payload\)/
  );
  assert.match(
    preloadSource,
    /vatClearDocumentOverride:\s*\(payload\)\s*=>\s*ipcRenderer\.invoke\('vat:document:override:clear',\s*payload\)/
  );
  assert.match(
    preloadSource,
    /vatGetDocumentOverrideHistory:\s*\(documentType,\s*documentId\)\s*=>\s*ipcRenderer\.invoke\('vat:document:override:history',\s*documentType,\s*documentId\)/
  );
});
