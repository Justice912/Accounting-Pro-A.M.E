import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getClientVatSettingsDraft,
  normalizeClientVatSettingsInput,
} from '../../../src/components/clients/clientVatSettingsViewModel.js';
import {
  formatActiveOverride,
  formatOverrideHistoryEntry,
  getAllowedOverrideTypes,
  getOverrideApprovalNote,
  validateOverrideDraft,
} from '../../../src/pages/vatComplianceViewModel.js';

test('getClientVatSettingsDraft returns VAT settings defaults for a new client', () => {
  const draft = getClientVatSettingsDraft();

  assert.deepEqual(draft, {
    vat_registered: false,
    vat_category: '',
    has_mixed_supplies: false,
    apportionment_ratio: '',
    penalty_interest_rate: '',
  });
});

test('getClientVatSettingsDraft preserves existing VAT settings from a client record', () => {
  const draft = getClientVatSettingsDraft({
    vat_registered: 1,
    vat_category: 'category_b',
    has_mixed_supplies: 1,
    apportionment_ratio: 62.5,
    penalty_interest_rate: 11.25,
  });

  assert.deepEqual(draft, {
    vat_registered: true,
    vat_category: 'category_b',
    has_mixed_supplies: true,
    apportionment_ratio: '62.5',
    penalty_interest_rate: '11.25',
  });
});

test('normalizeClientVatSettingsInput normalizes boolean and numeric VAT settings input', () => {
  const normalized = normalizeClientVatSettingsInput({
    vat_registered: 1,
    vat_category: '  category_a  ',
    has_mixed_supplies: 'true',
    apportionment_ratio: ' 75 ',
    penalty_interest_rate: ' 10.5 ',
  });

  assert.deepEqual(normalized, {
    vat_registered: true,
    vat_category: 'category_a',
    has_mixed_supplies: true,
    apportionment_ratio: 75,
    penalty_interest_rate: 10.5,
  });
});

test('getAllowedOverrideTypes returns purchase and sales specific override options', () => {
  const purchaseTypes = getAllowedOverrideTypes('purchase_receipt').map(item => item.value);
  const salesTypes = getAllowedOverrideTypes('sales_invoice').map(item => item.value);

  assert.ok(purchaseTypes.includes('claimable_vat_amount'));
  assert.ok(purchaseTypes.includes('input_tax_block'));
  assert.ok(!purchaseTypes.includes('output_vat_amount'));
  assert.ok(salesTypes.includes('output_vat_amount'));
  assert.ok(!salesTypes.includes('claimable_vat_amount'));
});

test('validateOverrideDraft requires a reason before an override can be saved', () => {
  const result = validateOverrideDraft({
    overrideType: 'supply_type',
    value: 'zero',
    reason: '   ',
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.reason, 'Reason is required.');
});

test('formatActiveOverride returns a display-ready active override summary', () => {
  const formatted = formatActiveOverride({
    override_type: 'claimable_vat_amount',
    override_value: 90,
    reason: 'Reviewed mixed-use percentage.',
    created_by: 'qa.user',
    created_at: '2026-04-20T10:00:00Z',
  });

  assert.equal(formatted.label, 'Claimable VAT amount');
  assert.match(formatted.value, /^R/);
  assert.match(formatted.value.replace(/[\s\u00A0]/g, ''), /90[.,]00$/);
  assert.equal(formatted.reason, 'Reviewed mixed-use percentage.');
  assert.equal(formatted.meta, 'qa.user');
});

test('formatOverrideHistoryEntry returns a readable change summary', () => {
  const formatted = formatOverrideHistoryEntry({
    override_type: 'supply_type',
    event_type: 'update',
    previous_value: 'standard',
    next_value: 'zero',
    reason: 'Zero-rated export confirmed.',
    actor: 'reviewer.user',
    created_at: '2026-04-20T11:00:00Z',
  });

  assert.equal(formatted.title, 'Supply type changed');
  assert.equal(formatted.description, 'Standard -> Zero');
  assert.equal(formatted.reason, 'Zero-rated export confirmed.');
  assert.equal(formatted.meta, 'reviewer.user');
});

test('getOverrideApprovalNote explains the approval-gated totals rule', () => {
  assert.match(getOverrideApprovalNote('pending'), /only after approval/i);
  assert.match(getOverrideApprovalNote('approved'), /already flow into vat totals/i);
});
