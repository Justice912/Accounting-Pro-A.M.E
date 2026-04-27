import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { ensureVatComplianceSchema } from '../../electron/services/database.js';
import {
  saveDocumentOverride,
  clearDocumentOverride,
  getActiveDocumentOverrides,
  getDocumentOverrideHistory,
  applyDocumentOverrides,
} from '../../electron/services/vat-document-overrides.js';

function createTestDatabase() {
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
  return db;
}

function createBaseSaleEvaluation() {
  return {
    summary: {
      supplyType: 'standard',
      supplyTypeReason: 'Defaulted to standard-rated supply.',
      duplicateStatus: 'clear',
    },
    computed: {
      supplyType: 'standard',
      supplyTypeReason: 'Defaulted to standard-rated supply.',
      vat201: {
        standardRatedSuppliesExclVat: 2000,
        zeroRatedSuppliesExclVat: 0,
        exemptSuppliesExclVat: 0,
        outputTax: 300,
        inputTax: 0,
        capitalInputTax: 0,
      },
    },
    document: {
      direction: 'sale',
      totalExclVat: 2000,
      vatAmount: 300,
      vatType: 'standard',
    },
  };
}

function createBasePurchaseEvaluation() {
  return {
    summary: {
      supplyType: 'standard',
      supplyTypeReason: 'Defaulted to standard-rated supply.',
      duplicateStatus: 'clear',
      blockedInputAmount: 0,
      apportionedInputAmount: 150,
      nonClaimableApportionmentAmount: 0,
    },
    computed: {
      supplyType: 'standard',
      supplyTypeReason: 'Defaulted to standard-rated supply.',
      blockedInputAmount: 0,
      apportionedInputAmount: 150,
      vat201: {
        standardRatedSuppliesExclVat: 0,
        zeroRatedSuppliesExclVat: 0,
        exemptSuppliesExclVat: 0,
        outputTax: 0,
        inputTax: 150,
        capitalInputTax: 0,
      },
    },
    document: {
      direction: 'purchase',
      totalExclVat: 1000,
      vatAmount: 150,
      vatType: 'expense',
    },
  };
}

test('saveDocumentOverride persists an active override and appends create history', () => {
  const db = createTestDatabase();

  const override = saveDocumentOverride(db, {
    documentType: 'purchase_receipt',
    documentId: 'receipt-1',
    overrideType: 'supply_type',
    value: 'zero',
    reason: 'Zero-rated export support confirmed.',
    createdBy: 'qa.user',
  });

  const activeOverrides = getActiveDocumentOverrides(db, 'purchase_receipt', 'receipt-1');
  const history = getDocumentOverrideHistory(db, 'purchase_receipt', 'receipt-1');

  assert.equal(override.override_type, 'supply_type');
  assert.equal(override.override_value, 'zero');
  assert.equal(override.reason, 'Zero-rated export support confirmed.');
  assert.equal(override.created_by, 'qa.user');
  assert.equal(activeOverrides.length, 1);
  assert.equal(activeOverrides[0].override_type, 'supply_type');
  assert.equal(activeOverrides[0].override_value, 'zero');
  assert.equal(history.length, 1);
  assert.equal(history[0].event_type, 'create');
  assert.equal(history[0].previous_value, null);
  assert.equal(history[0].next_value, 'zero');
});

test('clearDocumentOverride clears the active row and preserves override history', () => {
  const db = createTestDatabase();

  saveDocumentOverride(db, {
    documentType: 'purchase_receipt',
    documentId: 'receipt-1',
    overrideType: 'claimable_vat_amount',
    value: 90,
    reason: 'Mixed-use adjustment reviewed.',
    createdBy: 'qa.user',
  });

  clearDocumentOverride(db, {
    documentType: 'purchase_receipt',
    documentId: 'receipt-1',
    overrideType: 'claimable_vat_amount',
    reason: 'Return to engine result after re-review.',
    clearedBy: 'reviewer.user',
  });

  const activeOverrides = getActiveDocumentOverrides(db, 'purchase_receipt', 'receipt-1');
  const history = getDocumentOverrideHistory(db, 'purchase_receipt', 'receipt-1');

  assert.equal(activeOverrides.length, 0);
  assert.equal(history.length, 2);
  assert.equal(history[0].event_type, 'create');
  assert.equal(history[1].event_type, 'clear');
  assert.equal(history[1].previous_value, 90);
  assert.equal(history[1].next_value, null);
  assert.equal(history[1].actor, 'reviewer.user');
});

test('saveDocumentOverride updates an existing override and appends update history', () => {
  const db = createTestDatabase();

  const created = saveDocumentOverride(db, {
    documentType: 'sales_invoice',
    documentId: 'sale-1',
    overrideType: 'supply_type',
    value: 'zero',
    reason: 'Initial export treatment.',
    createdBy: 'qa.user',
  });

  const updated = saveDocumentOverride(db, {
    documentType: 'sales_invoice',
    documentId: 'sale-1',
    overrideType: 'supply_type',
    value: 'exempt',
    reason: 'Reclassified after final review.',
    createdBy: 'reviewer.user',
  });

  const activeOverrides = getActiveDocumentOverrides(db, 'sales_invoice', 'sale-1');
  const history = getDocumentOverrideHistory(db, 'sales_invoice', 'sale-1');

  assert.equal(activeOverrides.length, 1);
  assert.equal(updated.id, created.id);
  assert.equal(updated.override_value, 'exempt');
  assert.equal(updated.reason, 'Reclassified after final review.');
  assert.equal(updated.created_by, 'reviewer.user');
  assert.equal(history.length, 2);
  assert.equal(history[0].event_type, 'create');
  assert.equal(history[1].event_type, 'update');
  assert.equal(history[1].previous_value, 'zero');
  assert.equal(history[1].next_value, 'exempt');
  assert.equal(history[1].actor, 'reviewer.user');
});

test('saveDocumentOverride requires a reason and rejects unknown override types', () => {
  const db = createTestDatabase();

  assert.throws(() => {
    saveDocumentOverride(db, {
      documentType: 'purchase_receipt',
      documentId: 'receipt-1',
      overrideType: 'mystery_type',
      value: 'zero',
      reason: 'Trying an unsupported override.',
      createdBy: 'qa.user',
    });
  }, /unsupported override type/i);

  assert.throws(() => {
    saveDocumentOverride(db, {
      documentType: 'purchase_receipt',
      documentId: 'receipt-1',
      overrideType: 'supply_type',
      value: 'zero',
      reason: '   ',
      createdBy: 'qa.user',
    });
  }, /reason is required/i);
});

test('saveDocumentOverride rejects invalid enum and negative numeric values', () => {
  const db = createTestDatabase();

  assert.throws(() => {
    saveDocumentOverride(db, {
      documentType: 'sales_invoice',
      documentId: 'sale-1',
      overrideType: 'duplicate_status',
      value: 'maybe',
      reason: 'Trying an invalid duplicate override.',
      createdBy: 'qa.user',
    });
  }, /invalid override value/i);

  assert.throws(() => {
    saveDocumentOverride(db, {
      documentType: 'purchase_receipt',
      documentId: 'receipt-1',
      overrideType: 'claimable_vat_amount',
      value: -1,
      reason: 'Trying a negative amount.',
      createdBy: 'qa.user',
    });
  }, /non-negative/i);
});

test('clearDocumentOverride requires a reason', () => {
  const db = createTestDatabase();

  saveDocumentOverride(db, {
    documentType: 'purchase_receipt',
    documentId: 'receipt-1',
    overrideType: 'duplicate_status',
    value: 'duplicate',
    reason: 'Confirmed duplicate.',
    createdBy: 'qa.user',
  });

  assert.throws(() => {
    clearDocumentOverride(db, {
      documentType: 'purchase_receipt',
      documentId: 'receipt-1',
      overrideType: 'duplicate_status',
      reason: ' ',
      clearedBy: 'qa.user',
    });
  }, /reason is required/i);
});

test('applyDocumentOverrides returns an effective sales evaluation with overridden supply treatment', () => {
  const result = applyDocumentOverrides(createBaseSaleEvaluation(), [
    {
      override_type: 'supply_type',
      override_value: 'zero',
      reason: 'Export supply confirmed.',
      created_at: '2026-04-19T10:00:00Z',
    },
    {
      override_type: 'duplicate_status',
      override_value: 'probable',
      reason: 'Possible repost from source ledger.',
      created_at: '2026-04-19T10:05:00Z',
    },
  ]);

  assert.equal(result.summary.supplyType, 'zero');
  assert.match(result.summary.supplyTypeReason, /practitioner override/i);
  assert.equal(result.summary.duplicateStatus, 'probable');
  assert.deepEqual(result.effectiveVat201, {
    standardRatedSuppliesExclVat: 0,
    zeroRatedSuppliesExclVat: 2000,
    exemptSuppliesExclVat: 0,
    outputTax: 0,
    inputTax: 0,
    capitalInputTax: 0,
  });
  assert.equal(result.computed.vat201.zeroRatedSuppliesExclVat, 2000);
  assert.equal(result.activeOverrides.length, 2);
});

test('applyDocumentOverrides returns an effective purchase evaluation with explicit claimable VAT', () => {
  const result = applyDocumentOverrides(createBasePurchaseEvaluation(), [
    {
      override_type: 'input_tax_block',
      override_value: 'allowed',
      reason: 'Section 17 block should not apply.',
      created_at: '2026-04-19T10:00:00Z',
    },
    {
      override_type: 'claimable_vat_amount',
      override_value: 90,
      reason: 'Limit claimable VAT to the reviewed amount.',
      created_at: '2026-04-19T10:05:00Z',
    },
  ]);

  assert.equal(result.summary.blockedInputAmount, 60);
  assert.equal(result.summary.apportionedInputAmount, 90);
  assert.equal(result.computed.vat201.inputTax, 90);
  assert.deepEqual(result.effectiveVat201, {
    standardRatedSuppliesExclVat: 0,
    zeroRatedSuppliesExclVat: 0,
    exemptSuppliesExclVat: 0,
    outputTax: 0,
    inputTax: 90,
    capitalInputTax: 0,
  });
  assert.equal(result.activeOverrides.length, 2);
});
