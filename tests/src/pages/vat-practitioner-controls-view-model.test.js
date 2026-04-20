import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getClientVatSettingsDraft,
  normalizeClientVatSettingsInput,
} from '../../../src/components/clients/clientVatSettingsViewModel.js';

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
