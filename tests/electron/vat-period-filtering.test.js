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

test('vat:receipt:list applies custom invoice date range filters before period filters', async () => {
  let captured = null;
  const database = {
    getAll(sql, params = []) {
      if (sql.includes('FROM vat_receipts')) {
        captured = { sql, params };
      }
      return [];
    },
  };
  const ipcMain = createFakeIpcMain();

  registerVatHandlers(ipcMain, { database, keychain: {} });
  await ipcMain.handlers['vat:receipt:list']({}, 'client-1', {
    period: '2026-03',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
  });

  assert.match(captured.sql, /invoice_date >= \?/);
  assert.match(captured.sql, /invoice_date <= \?/);
  assert.doesNotMatch(captured.sql, /vat_period = \?/);
  assert.deepEqual(captured.params, ['client-1', '2026-04-01', '2026-04-30']);
});

test('vat:sales:list applies custom invoice date range filters before period filters', async () => {
  let captured = null;
  const database = {
    getAll(sql, params = []) {
      if (sql.includes('FROM vat_sales_invoices')) {
        captured = { sql, params };
      }
      return [];
    },
  };
  const ipcMain = createFakeIpcMain();

  registerVatHandlers(ipcMain, { database, keychain: {} });
  await ipcMain.handlers['vat:sales:list']({}, 'client-1', {
    period: '2026-03',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
  });

  assert.match(captured.sql, /invoice_date >= \?/);
  assert.match(captured.sql, /invoice_date <= \?/);
  assert.doesNotMatch(captured.sql, /vat_period = \?/);
  assert.deepEqual(captured.params, ['client-1', '2026-04-01', '2026-04-30']);
});

test('vat:period-summary:get builds VAT201 totals from a custom invoice date range', async () => {
  const receipts = [
    {
      id: 'receipt-inside',
      client_id: 'client-1',
      invoice_date: '2026-04-15',
      status: 'approved',
      vat_type: 'standard',
      total_excl_vat: 1000,
      total_incl_vat: 1150,
      vat_amount: 150,
      apportioned_input_amount: 150,
      blocked_input_amount: 0,
      non_claimable_apportionment_amount: 0,
      duplicate_status: 'clear',
      compliance_score: 90,
    },
    {
      id: 'receipt-outside',
      client_id: 'client-1',
      invoice_date: '2026-03-15',
      status: 'approved',
      vat_type: 'standard',
      total_excl_vat: 500,
      total_incl_vat: 575,
      vat_amount: 75,
      apportioned_input_amount: 75,
      duplicate_status: 'clear',
      compliance_score: 90,
    },
  ];
  const sales = [
    {
      id: 'sale-inside',
      client_id: 'client-1',
      invoice_date: '2026-04-20',
      status: 'approved',
      supply_type: 'standard',
      total_excl_vat: 2000,
      vat_amount: 300,
      duplicate_status: 'clear',
      compliance_score: 90,
    },
  ];
  const captured = [];
  const database = {
    getOne(sql) {
      if (sql.includes('FROM clients')) return null;
      if (sql.includes('FROM vat_period_summaries')) {
        throw new Error('custom summaries should not read the cached period summary');
      }
      return null;
    },
    getAll(sql, params = []) {
      captured.push({ sql, params });
      if (sql.includes('vat_document_overrides')) return [];
      if (sql.includes('FROM vat_receipts')) {
        return receipts.filter(receipt => (
          receipt.client_id === params[0]
          && receipt.invoice_date >= params[1]
          && receipt.invoice_date <= params[2]
        ));
      }
      if (sql.includes('FROM vat_sales_invoices')) {
        return sales.filter(invoice => (
          invoice.client_id === params[0]
          && invoice.invoice_date >= params[1]
          && invoice.invoice_date <= params[2]
        ));
      }
      return [];
    },
  };
  const ipcMain = createFakeIpcMain();

  registerVatHandlers(ipcMain, { database, keychain: {}, now: new Date('2026-04-26T10:00:00Z') });
  const summary = await ipcMain.handlers['vat:period-summary:get']({}, 'client-1', '2026-03', {
    startDate: '2026-04-01',
    endDate: '2026-04-30',
  });

  assert.equal(summary.periodStart, '2026-04-01');
  assert.equal(summary.periodEnd, '2026-04-30');
  assert.equal(summary.vat201.field1, 2000);
  assert.equal(summary.vat201.field1a, 300);
  assert.equal(summary.vat201.field12, 150);
  assert.equal(summary.netVat, 150);
  assert.ok(captured.some(query => /invoice_date >= \?/.test(query.sql)));
});
