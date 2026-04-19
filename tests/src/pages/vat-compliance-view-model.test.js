import test from 'node:test';
import assert from 'node:assert/strict';
import {
  groupFindingsBySeverity,
  getComplianceTone,
  getSalesInvoiceDraft,
} from '../../../src/pages/vatComplianceViewModel.js';

test('groupFindingsBySeverity groups critical, warning, and advisory findings', () => {
  const grouped = groupFindingsBySeverity([
    { ruleKey: 'a', severity: 'warning' },
    { ruleKey: 'b', severity: 'critical' },
    { ruleKey: 'c', severity: 'advisory' },
  ]);

  assert.deepEqual(grouped.critical.map(item => item.ruleKey), ['b']);
  assert.deepEqual(grouped.warning.map(item => item.ruleKey), ['a']);
  assert.deepEqual(grouped.advisory.map(item => item.ruleKey), ['c']);
});

test('getSalesInvoiceDraft returns a tax-invoice sales skeleton', () => {
  const draft = getSalesInvoiceDraft('client-1');
  assert.equal(draft.client_id, 'client-1');
  assert.equal(draft.document_type, 'tax_invoice');
  assert.equal(draft.status, 'pending');
});

test('getComplianceTone returns a critical tone when critical findings exist', () => {
  const tone = getComplianceTone(72, 1);
  assert.equal(tone.level, 'critical');
});
