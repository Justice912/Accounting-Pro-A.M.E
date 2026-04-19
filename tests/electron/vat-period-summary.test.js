import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVatPeriodSummary } from '../../electron/services/vat-period-summary.js';

test('buildVatPeriodSummary maps purchases and sales into VAT201 totals', () => {
  const summary = buildVatPeriodSummary({
    clientId: 'client-1',
    period: '2026-03',
    purchases: [
      {
        id: 'p1',
        status: 'approved',
        summary: { blockedInputAmount: 0, apportionedInputAmount: 150, duplicateStatus: 'clear' },
        computed: { vat201: { inputTax: 150, capitalInputTax: 0 } },
      },
    ],
    sales: [
      {
        id: 's1',
        status: 'approved',
        summary: { duplicateStatus: 'clear' },
        computed: { vat201: { standardRatedSuppliesExclVat: 2000, outputTax: 300 } },
      },
    ],
  });

  assert.equal(summary.vat201.field1, 2000);
  assert.equal(summary.vat201.field1a, 300);
  assert.equal(summary.vat201.field12, 150);
  assert.equal(summary.netVat, 150);
});
