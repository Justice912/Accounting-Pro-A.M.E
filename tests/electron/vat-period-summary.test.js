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

test('buildVatPeriodSummary ignores pending purchase overrides in totals', () => {
  const summary = buildVatPeriodSummary({
    clientId: 'client-1',
    period: '2026-03',
    purchases: [
      {
        id: 'p1',
        status: 'pending',
        summary: { blockedInputAmount: 0, apportionedInputAmount: 150, duplicateStatus: 'clear' },
        computed: { vat201: { inputTax: 150, capitalInputTax: 0 } },
        effectiveSummary: { blockedInputAmount: 60, apportionedInputAmount: 90, duplicateStatus: 'clear' },
        effectiveVat201: { inputTax: 90, capitalInputTax: 0 },
      },
    ],
    sales: [],
  });

  assert.equal(summary.totals.inputVat, 0);
  assert.equal(summary.totals.blockedInputVat, 0);
  assert.equal(summary.totals.apportionedInputVat, 0);
  assert.equal(summary.vat201.field12, 0);
});

test('buildVatPeriodSummary uses effective purchase values for approved overridden documents', () => {
  const summary = buildVatPeriodSummary({
    clientId: 'client-1',
    period: '2026-03',
    purchases: [
      {
        id: 'p1',
        status: 'approved',
        summary: { blockedInputAmount: 0, apportionedInputAmount: 150, duplicateStatus: 'clear' },
        computed: { vat201: { inputTax: 150, capitalInputTax: 0 } },
        effectiveSummary: { blockedInputAmount: 60, apportionedInputAmount: 90, duplicateStatus: 'clear' },
        effectiveVat201: { inputTax: 90, capitalInputTax: 0 },
      },
    ],
    sales: [],
  });

  assert.equal(summary.totals.inputVat, 90);
  assert.equal(summary.totals.blockedInputVat, 60);
  assert.equal(summary.totals.apportionedInputVat, 90);
  assert.equal(summary.vat201.field12, 90);
});

test('buildVatPeriodSummary uses effective sales values for approved overridden invoices', () => {
  const summary = buildVatPeriodSummary({
    clientId: 'client-1',
    period: '2026-03',
    purchases: [],
    sales: [
      {
        id: 's1',
        status: 'approved',
        summary: { duplicateStatus: 'clear' },
        computed: {
          vat201: {
            standardRatedSuppliesExclVat: 2000,
            zeroRatedSuppliesExclVat: 0,
            exemptSuppliesExclVat: 0,
            outputTax: 300,
          },
        },
        effectiveSummary: { duplicateStatus: 'clear' },
        effectiveVat201: {
          standardRatedSuppliesExclVat: 2000,
          zeroRatedSuppliesExclVat: 0,
          exemptSuppliesExclVat: 0,
          outputTax: 250,
        },
      },
    ],
  });

  assert.equal(summary.totals.outputVat, 250);
  assert.equal(summary.vat201.field1a, 250);
  assert.equal(summary.netVat, 250);
});
