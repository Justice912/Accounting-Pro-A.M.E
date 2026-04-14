// South African-specific input validators and normalisers.
// Used by client forms and (later) receipt capture flows.

const SA_COUNTRY_CODE = '27';

export function normaliseVatNumber(value) {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(0, 10);
}

export function isValidVatNumber(value) {
  const digits = normaliseVatNumber(value);
  return digits.length === 10 && digits.startsWith('4');
}

export function vatNumberError(value) {
  if (!value) return 'VAT number is required';
  if (!isValidVatNumber(value)) {
    return 'VAT number must be 10 digits and start with 4';
  }
  return null;
}

// Registration number — SA CIPC format YYYY/NNNNNN/NN. We accept with or
// without the slashes and normalise to the canonical form.
export function normaliseRegistrationNumber(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 12);
  if (digits.length < 12) return digits;
  return `${digits.slice(0, 4)}/${digits.slice(4, 10)}/${digits.slice(10, 12)}`;
}

export function isValidRegistrationNumber(value) {
  if (!value) return true; // optional
  const digits = String(value).replace(/\D/g, '');
  return digits.length === 12;
}

// Phone numbers — accept local (0xx xxx xxxx) or international (+27 xx xxx xxxx).
// Normalise to E.164 without the plus (e.g. 27821234567) for storage.
export function normalisePhone(value) {
  if (!value) return '';
  let digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = SA_COUNTRY_CODE + digits.slice(1);
  if (!digits.startsWith(SA_COUNTRY_CODE)) digits = SA_COUNTRY_CODE + digits;
  return digits.slice(0, 11);
}

export function isValidPhone(value) {
  if (!value) return false;
  const digits = normalisePhone(value);
  return digits.length === 11 && digits.startsWith(SA_COUNTRY_CODE);
}

export function formatPhoneForDisplay(value) {
  const digits = normalisePhone(value);
  if (digits.length !== 11) return value || '';
  return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function phoneError(value, { required = true } = {}) {
  if (!value) return required ? 'Phone number is required' : null;
  if (!isValidPhone(value)) return 'Enter a valid SA phone number (e.g. 082 123 4567)';
  return null;
}

export function isValidEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function emailError(value, { required = true } = {}) {
  if (!value) return required ? 'Email is required' : null;
  if (!isValidEmail(value)) return 'Enter a valid email address';
  return null;
}

export const VAT_CATEGORIES = [
  { value: 'A', label: 'Category A — Jan/Mar/May/Jul/Sep/Nov' },
  { value: 'B', label: 'Category B — Feb/Apr/Jun/Aug/Oct/Dec' },
  { value: 'C', label: 'Category C — Monthly' },
  { value: 'D', label: 'Category D — Six-monthly' },
  { value: 'E', label: 'Category E — Annually' }
];

export function isValidVatCategory(value) {
  return VAT_CATEGORIES.some((c) => c.value === value);
}
