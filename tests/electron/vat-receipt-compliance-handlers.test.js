import test from 'node:test';
import assert from 'node:assert/strict';
import registerVatHandlers from '../../electron/ipc/vat-handlers.js';

function createFakeIpcMain() {
  const handlers = {};
  return {
    handlers,
    handle(name, handler) {
      handlers[name] = handler;
    },
  };
}

test('vat:receipt:save persists compliance score and rule results', async () => {
  const inserts = [];
  const fakeDb = {
    insert(table, row) {
      inserts.push({ table, row });
    },
    run() {},
    getOne() {
      return null;
    },
    getAll() {
      return [];
    },
  };
  const ipcMain = createFakeIpcMain();

  registerVatHandlers(ipcMain, { database: fakeDb, keychain: {} });
  const result = await ipcMain.handlers['vat:receipt:save']({}, {
    client_id: 'client-1',
    supplier_name: 'ABC Suppliers',
    supplier_vat_number: '4123456789',
    invoice_number: 'INV-1',
    invoice_date: '2026-04-18',
    total_excl_vat: 1000,
    vat_amount: 150,
    total_incl_vat: 1150,
  });

  assert.equal(result.success, true);
  assert.ok(
    inserts.some(entry => entry.table === 'vat_receipts' && typeof entry.row.compliance_score === 'number')
  );
  assert.ok(inserts.some(entry => entry.table === 'vat_rule_results'));
});

test('vat:receipt:compliance:get returns the receipt with its findings', async () => {
  const ipcMain = createFakeIpcMain();
  const fakeDb = {
    getOne(sql, params) {
      if (sql.includes('FROM vat_receipts WHERE id = ?')) {
        assert.deepEqual(params, ['receipt-1']);
        return { id: 'receipt-1', compliance_score: 90 };
      }
      return null;
    },
    getAll(sql, params) {
      if (sql.includes('FROM vat_rule_results')) {
        assert.deepEqual(params, ['purchase_receipt', 'receipt-1']);
        return [{ rule_key: 'section20_recipient_name', severity: 'critical' }];
      }
      return [];
    },
  };

  registerVatHandlers(ipcMain, { database: fakeDb, keychain: {} });
  const result = await ipcMain.handlers['vat:receipt:compliance:get']({}, 'receipt-1');

  assert.equal(result.receipt.id, 'receipt-1');
  assert.equal(result.findings.length, 1);
});
