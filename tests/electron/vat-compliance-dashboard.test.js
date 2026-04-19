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
