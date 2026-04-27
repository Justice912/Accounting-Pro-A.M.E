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

test('vat:sales:save stores a sales invoice and includes it in the period summary', async () => {
  const rows = { sales: [] };
  const fakeDb = {
    insert(table, row) {
      if (table === 'vat_sales_invoices') rows.sales.push(row);
      if (table === 'vat_rule_results') return;
    },
    run() {},
    getOne(sql) {
      if (sql.includes('FROM vat_period_summaries')) return null;
      return null;
    },
    getAll(sql) {
      if (sql.includes('FROM vat_sales_invoices')) return rows.sales;
      return [];
    },
  };
  const ipcMain = createFakeIpcMain();

  registerVatHandlers(ipcMain, { database: fakeDb, keychain: {} });
  const save = await ipcMain.handlers['vat:sales:save']({}, {
    client_id: 'client-1',
    customer_name: 'Customer A',
    invoice_number: 'SALE-1',
    invoice_date: '2026-04-18',
    total_excl_vat: 2000,
    vat_amount: 300,
    total_incl_vat: 2300,
  });

  assert.equal(save.success, true);
  assert.equal(rows.sales.length, 1);
});
