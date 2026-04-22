const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_PERIOD_PATTERN = /^\d{4}-\d{2}$/;

function cleanDate(value) {
  const date = String(value || '').trim();
  return ISO_DATE_PATTERN.test(date) ? date : '';
}

function cleanPeriod(value) {
  const period = String(value || '').trim();
  return ISO_PERIOD_PATTERN.test(period) ? period : '';
}

export function normalizeVatDateRangeFilter(filters = {}) {
  const startDate = cleanDate(filters.startDate ?? filters.customStartDate ?? filters.start);
  const endDate = cleanDate(filters.endDate ?? filters.customEndDate ?? filters.end);

  if (!startDate || !endDate || startDate > endDate) {
    return null;
  }

  return { startDate, endDate };
}

export function getVatDocumentPeriodWhere(filters = {}, {
  dateColumn = 'invoice_date',
  periodColumn = 'vat_period',
} = {}) {
  const dateRange = normalizeVatDateRangeFilter(filters);

  if (dateRange) {
    return {
      clause: ` AND ${dateColumn} >= ? AND ${dateColumn} <= ?`,
      params: [dateRange.startDate, dateRange.endDate],
      dateRange,
      period: cleanPeriod(filters.period),
    };
  }

  const period = cleanPeriod(filters.period ?? filters.vatPeriod);
  if (period) {
    return {
      clause: ` AND ${periodColumn} = ?`,
      params: [period],
      dateRange: null,
      period,
    };
  }

  return {
    clause: '',
    params: [],
    dateRange: null,
    period: '',
  };
}
