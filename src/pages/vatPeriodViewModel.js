const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_PERIOD_PATTERN = /^\d{4}-\d{2}$/;

function pad2(value) {
  return String(value).padStart(2, '0');
}

function coerceDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function cleanPeriod(period) {
  const value = String(period || '').trim();
  return ISO_PERIOD_PATTERN.test(value) ? value : '';
}

function cleanDate(value) {
  const date = String(value || '').trim();
  return ISO_DATE_PATTERN.test(date) ? date : '';
}

export function currentVatPeriod(now = new Date()) {
  const date = coerceDate(now);
  const month = date.getMonth() + 1;
  const startMonth = month % 2 === 0 ? month - 1 : month;
  return `${date.getFullYear()}-${pad2(startMonth)}`;
}

export function buildVatPeriodOptions(anchor = new Date(), count = 8) {
  const date = coerceDate(anchor);
  const options = [];

  for (let index = 0; index < count; index += 1) {
    const periodDate = new Date(date.getFullYear(), date.getMonth() - index * 2, 1);
    options.push(currentVatPeriod(periodDate));
  }

  return [...new Set(options)];
}

export function getVatPeriodDateRange(period) {
  const normalized = cleanPeriod(period);
  if (!normalized) return { startDate: '', endDate: '' };

  const [year, rawMonth] = normalized.split('-').map(Number);
  const startMonth = rawMonth % 2 === 0 ? rawMonth - 1 : rawMonth;
  const endMonth = startMonth + 1;
  const lastDay = new Date(year, endMonth, 0).getDate();

  return {
    startDate: `${year}-${pad2(startMonth)}-01`,
    endDate: `${year}-${pad2(endMonth)}-${pad2(lastDay)}`,
  };
}

export function formatVatPeriodLabel(period) {
  const normalized = cleanPeriod(period);
  if (!normalized) return '';

  const [year, rawMonth] = normalized.split('-').map(Number);
  const startMonth = rawMonth % 2 === 0 ? rawMonth - 1 : rawMonth;
  const endMonth = startMonth + 1;
  return `${MONTHS[startMonth - 1]}/${MONTHS[endMonth - 1]} ${year}`;
}

export function normalizeVatPeriodSelection({
  periodMode = 'preset',
  selectedPeriod = '',
  customStartDate = '',
  customEndDate = '',
  fallbackDate = new Date(),
} = {}) {
  const period = cleanPeriod(selectedPeriod) || currentVatPeriod(fallbackDate);

  if (periodMode === 'custom') {
    const startDate = cleanDate(customStartDate);
    const endDate = cleanDate(customEndDate);

    if (!startDate || !endDate) {
      return {
        isValid: false,
        isCustom: true,
        period,
        filters: { period },
        queryParams: { period },
        label: 'Custom dates',
        error: 'Start and end dates are required for a custom VAT period.',
      };
    }

    if (startDate > endDate) {
      return {
        isValid: false,
        isCustom: true,
        period,
        filters: { period },
        queryParams: { period },
        label: 'Custom dates',
        error: 'The custom start date must be before or equal to the end date.',
      };
    }

    return {
      isValid: true,
      isCustom: true,
      period,
      startDate,
      endDate,
      filters: { period, startDate, endDate },
      queryParams: { period, start: startDate, end: endDate },
      label: `${startDate} to ${endDate}`,
      error: '',
    };
  }

  return {
    isValid: true,
    isCustom: false,
    period,
    startDate: '',
    endDate: '',
    filters: { period },
    queryParams: { period },
    label: formatVatPeriodLabel(period),
    error: '',
  };
}
