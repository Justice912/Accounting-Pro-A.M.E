import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVatPeriodOptions,
  currentVatPeriod,
  formatVatPeriodLabel,
  getVatPeriodDateRange,
  normalizeVatPeriodSelection,
} from '../../../src/pages/vatPeriodViewModel.js';

test('currentVatPeriod returns the Category B bi-monthly start month', () => {
  assert.equal(currentVatPeriod(new Date('2026-04-22T12:00:00Z')), '2026-03');
  assert.equal(currentVatPeriod(new Date('2026-01-15T12:00:00Z')), '2026-01');
});

test('buildVatPeriodOptions returns unique descending bi-monthly periods', () => {
  assert.deepEqual(buildVatPeriodOptions(new Date('2026-04-22T12:00:00Z'), 4), [
    '2026-03',
    '2026-01',
    '2025-11',
    '2025-09',
  ]);
});

test('formatVatPeriodLabel and getVatPeriodDateRange describe the period dates', () => {
  assert.equal(formatVatPeriodLabel('2026-03'), 'Mar/Apr 2026');
  assert.deepEqual(getVatPeriodDateRange('2026-03'), {
    startDate: '2026-03-01',
    endDate: '2026-04-30',
  });
});

test('normalizeVatPeriodSelection returns preset period filters', () => {
  const selection = normalizeVatPeriodSelection({
    periodMode: 'preset',
    selectedPeriod: '2026-03',
  });

  assert.equal(selection.isValid, true);
  assert.equal(selection.isCustom, false);
  assert.deepEqual(selection.filters, { period: '2026-03' });
  assert.equal(selection.label, 'Mar/Apr 2026');
});

test('normalizeVatPeriodSelection returns custom date range filters', () => {
  const selection = normalizeVatPeriodSelection({
    periodMode: 'custom',
    selectedPeriod: '2026-03',
    customStartDate: '2026-04-01',
    customEndDate: '2026-04-30',
  });

  assert.equal(selection.isValid, true);
  assert.equal(selection.isCustom, true);
  assert.deepEqual(selection.filters, {
    period: '2026-03',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
  });
  assert.deepEqual(selection.queryParams, {
    period: '2026-03',
    start: '2026-04-01',
    end: '2026-04-30',
  });
  assert.equal(selection.label, '2026-04-01 to 2026-04-30');
});

test('normalizeVatPeriodSelection rejects incomplete and inverted custom ranges', () => {
  assert.equal(normalizeVatPeriodSelection({
    periodMode: 'custom',
    customStartDate: '2026-04-01',
  }).isValid, false);

  const inverted = normalizeVatPeriodSelection({
    periodMode: 'custom',
    customStartDate: '2026-05-01',
    customEndDate: '2026-04-30',
  });

  assert.equal(inverted.isValid, false);
  assert.match(inverted.error, /before or equal/i);
});
