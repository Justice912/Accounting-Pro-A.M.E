export const VAT_CATEGORY_OPTIONS = [
  { value: 'category_a', label: 'Category A (monthly)' },
  { value: 'category_b', label: 'Category B (bi-monthly)' },
  { value: 'category_c', label: 'Category C (six-monthly)' },
  { value: 'category_d', label: 'Category D (annual)' },
  { value: 'category_e', label: 'Category E (special approval)' },
];

function normalizeBoolean(value) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
  }
  return value === true || value === 1;
}

function formatDraftNumber(value) {
  if (value == null || value === '') return '';
  const normalized = Number(value);
  return Number.isFinite(normalized) ? String(normalized) : '';
}

function normalizeOptionalString(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeOptionalNumber(value) {
  if (value == null || String(value).trim() === '') return null;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

export function getClientVatSettingsDraft(client = {}) {
  return {
    vat_registered: normalizeBoolean(client.vat_registered),
    vat_category: client?.vat_category ? String(client.vat_category) : '',
    has_mixed_supplies: normalizeBoolean(client.has_mixed_supplies),
    apportionment_ratio: formatDraftNumber(client.apportionment_ratio),
    penalty_interest_rate: formatDraftNumber(client.penalty_interest_rate),
  };
}

export function normalizeClientVatSettingsInput(draft = {}) {
  return {
    vat_registered: normalizeBoolean(draft.vat_registered),
    vat_category: normalizeOptionalString(draft.vat_category),
    has_mixed_supplies: normalizeBoolean(draft.has_mixed_supplies),
    apportionment_ratio: normalizeOptionalNumber(draft.apportionment_ratio),
    penalty_interest_rate: normalizeOptionalNumber(draft.penalty_interest_rate),
  };
}
