const FULL_INVOICE_THRESHOLD_CENTS = 500000; // R5,000.00

function isNonEmpty(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value != null;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDate(value) {
  const d = parseDate(value);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function vatPeriodFromDate(value, filingCategory = 'B') {
  const d = parseDate(value);
  if (!d) return null;

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;

  if (filingCategory === 'A') {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  // Category B bi-monthly (Jan/Feb -> 01, Mar/Apr -> 03, ...)
  const startMonth = month % 2 === 0 ? month - 1 : month;
  return `${year}-${String(startMonth).padStart(2, '0')}`;
}

function validateVatNumber(vatNumber) {
  return /^4\d{9}$/.test((vatNumber || '').replace(/\s/g, ''));
}

function makeCheck(field, required, valid, message, actReference, severity = 'critical') {
  return {
    field,
    required,
    present: valid,
    valid,
    severity,
    message,
    actReference,
  };
}

function parseDocumentType(data = {}) {
  const doc = String(data.documentType || data.document_type || 'tax_invoice').toLowerCase();
  if (doc.includes('debit')) return 'debit_note';
  if (doc.includes('credit')) return 'credit_note';
  return 'tax_invoice';
}

function scoreFromChecks(checks = []) {
  const hasCriticalFailure = checks.some(c => c.severity === 'critical' && !c.valid);
  if (hasCriticalFailure) return 'red';
  const hasWarningFailure = checks.some(c => c.severity === 'warning' && !c.valid);
  return hasWarningFailure ? 'amber' : 'green';
}

function vatToleranceValid(totalExclVat, vatAmount, toleranceCents = 100) {
  const excl = Number(totalExclVat) || 0;
  const vat = Number(vatAmount) || 0;
  const expected = Math.round(excl * 0.15);
  return Math.abs(expected - vat) <= toleranceCents;
}

export function validateInvoiceS20(data = {}, totalInclVat = null, options = {}) {
  const documentType = parseDocumentType(data);
  const totalIncl = Number(totalInclVat ?? data.totalInclVat ?? data.total_incl_vat ?? 0) || 0;
  const isFullInvoice = documentType === 'tax_invoice' && totalIncl > FULL_INVOICE_THRESHOLD_CENTS;
  const invoiceType = documentType === 'tax_invoice'
    ? (isFullInvoice ? 'full' : 'abridged')
    : documentType;

  if (documentType === 'debit_note' || documentType === 'credit_note') {
    const checks = [
      makeCheck('documentTypeLabel', true, isNonEmpty(data.documentTypeLabel || data.document_type_label), 'Document label is required', 'S21(2)(a)'),
      makeCheck('originalInvoiceNumber', true, isNonEmpty(data.originalInvoiceNumber || data.original_invoice_number), 'Original invoice reference is required', 'S21(2)(b)'),
      makeCheck('adjustmentReason', true, isNonEmpty(data.adjustmentReason || data.adjustment_reason), 'Adjustment reason is required', 'S21(2)(c)'),
      makeCheck('correctedAmounts', true, Number.isFinite(Number(data.correctedAmount ?? data.corrected_amount ?? NaN)), 'Corrected amount is required', 'S21(3)(a)'),
    ];

    return {
      invoiceType,
      s20Checks: checks,
      overallScore: scoreFromChecks(checks),
    };
  }

  const now = parseDate(options.today) || new Date();
  const lineItems = Array.isArray(data.lineItems) ? data.lineItems : [];

  const checks = [];
  checks.push(makeCheck('hasTextTaxInvoice', true, Boolean(data.hasTextTaxInvoice), "Must contain 'Tax Invoice' text", 'S20(4)(a)'));
  checks.push(makeCheck('supplierName', true, isNonEmpty(data.supplierName), 'Supplier name is required', 'S20(4)(b)(i)'));
  checks.push(makeCheck('supplierAddress', true, isNonEmpty(data.supplierAddress), 'Supplier address is recommended', 'S20(4)(b)(ii)', 'warning'));
  checks.push(makeCheck('supplierVatNumber', true, validateVatNumber(data.supplierVatNumber), 'Supplier VAT number must be valid', 'S20(4)(b)(iii)'));

  if (isFullInvoice) {
    checks.push(makeCheck('recipientName', true, isNonEmpty(data.recipientName), 'Recipient name is required for full tax invoices', 'S20(4)(c)(i)'));
    checks.push(makeCheck('recipientAddress', true, isNonEmpty(data.recipientAddress), 'Recipient address is recommended for full tax invoices', 'S20(4)(c)(ii)', 'warning'));
    checks.push(makeCheck('recipientVatNumber', true, validateVatNumber(data.recipientVatNumber), 'Recipient VAT number must be valid for full tax invoices', 'S20(4)(c)(iii)'));
  }

  checks.push(makeCheck('invoiceNumber', true, isNonEmpty(data.invoiceNumber), 'Serial invoice number is required', 'S20(4)(d)'));

  const invoiceDate = parseDate(data.invoiceDate);
  checks.push(makeCheck('invoiceDate', true, Boolean(invoiceDate) && invoiceDate <= now, 'Invoice date is required and cannot be in the future', 'S20(4)(e)'));

  const allLineDescriptionsPresent = lineItems.length > 0 && lineItems.every(item => isNonEmpty(item?.description));
  checks.push(makeCheck('lineItems.description', true, allLineDescriptionsPresent, 'Each line item needs a description', 'S20(4)(f)'));

  const quantityValid = lineItems.length > 0 && lineItems.every(item => Number(item?.quantity ?? 1) > 0);
  checks.push(makeCheck('lineItems.quantity', true, quantityValid, 'Line item quantities should be positive', 'S20(4)(f)', 'warning'));

  const totalExclLine = lineItems.reduce((sum, item) => sum + (Number(item?.totalExcl) || 0), 0);
  const totalExcl = Number(data.totalExclVat ?? 0);
  const valueMatches = totalExcl >= 0 && Math.abs(totalExcl - totalExclLine) <= 100;
  checks.push(makeCheck('totalExclVat', true, valueMatches, 'Excluding VAT total should match line items', 'S20(4)(g)'));

  const vatValid = vatToleranceValid(data.totalExclVat, data.vatAmount);
  checks.push(makeCheck('vatAmount', true, vatValid, 'VAT amount should be 15% of total excluding VAT within R1', 'S20(4)(h)'));

  return {
    invoiceType,
    s20Checks: checks,
    overallScore: scoreFromChecks(checks),
  };
}

export function classifySupply(description = '') {
  const text = String(description || '').toLowerCase();
  if (!text.trim()) {
    return { supplyType: 'unknown', supplyTypeReason: 'No description provided' };
  }

  const zeroRatedKeywords = [
    'brown bread', 'maize meal', 'samp', 'mealie rice', 'dried beans', 'lentils', 'pilchards',
    'sardines', 'rice', 'vegetables', 'fruit', 'vegetable oil', 'milk', 'eggs', 'paraffin',
    'sanitary towels', 'tampons', 'export', 'fertiliser', 'fertilizer', 'pesticide', 'seed',
  ];
  const exemptKeywords = [
    'interest', 'financial service', 'residential rent', 'residential rental', 'tuition',
    'school fee', 'child care', 'union fee', 'public transport',
  ];

  const zeroMatch = zeroRatedKeywords.find(k => text.includes(k));
  if (zeroMatch) {
    return {
      supplyType: 'zero',
      supplyTypeReason: `Zero-rated indicator detected: ${zeroMatch}`,
    };
  }

  const exemptMatch = exemptKeywords.find(k => text.includes(k));
  if (exemptMatch) {
    return {
      supplyType: 'exempt',
      supplyTypeReason: `Exempt indicator detected: ${exemptMatch}`,
    };
  }

  return {
    supplyType: 'standard',
    supplyTypeReason: 'Defaulted to standard-rated supply (15%)',
  };
}

export function checkInputBlock(description = '', category = '') {
  const text = `${description} ${category}`.toLowerCase();

  const entertainmentWords = ['restaurant', 'dinner', 'entertainment', 'golf', 'club', 'hospitality', 'drinks', 'party', 'function'];
  if (entertainmentWords.some(word => text.includes(word))) {
    return { inputBlocked: true, blockReason: 'S17(2)(a) - entertainment expenditure' };
  }

  const hasMotorCarWord = ['vehicle', 'car', 'sedan', 'suv', 'motor vehicle'].some(word => text.includes(word));
  const excludedCommercial = ['bakkie', 'truck', 'delivery van', 'van for delivery'].some(word => text.includes(word));
  if (hasMotorCarWord && !excludedCommercial) {
    return { inputBlocked: true, blockReason: 'S17(2)(b) - motor car acquisition' };
  }

  if (['private', 'personal', 'donation', 'gift', 'non-business'].some(word => text.includes(word))) {
    return { inputBlocked: true, blockReason: 'S17(2)(c) - non-taxable/private use' };
  }

  return { inputBlocked: false, blockReason: null };
}

export function calculateTimeOfSupply(invoiceDate, paymentDate, filingCategory = 'B') {
  const invoice = parseDate(invoiceDate);
  const payment = parseDate(paymentDate);

  if (!invoice && !payment) {
    return { timeOfSupply: null, vatPeriod: null, source: null };
  }

  let chosen = invoice;
  let source = 'invoice';

  if (!invoice || (payment && payment < invoice)) {
    chosen = payment;
    source = 'payment';
  }

  const isoDate = toIsoDate(chosen);

  return {
    timeOfSupply: isoDate,
    vatPeriod: vatPeriodFromDate(isoDate, filingCategory),
    source,
  };
}

export function calculateApportionment(inputVAT, ratioPercent) {
  const vat = Math.max(Number(inputVAT) || 0, 0);
  const ratio = Math.min(100, Math.max(0, Number(ratioPercent) || 0));
  const claimable = Math.round(vat * (ratio / 100));

  return {
    inputVAT: vat,
    ratioPercent: ratio,
    claimableInput: claimable,
    blockedInput: vat - claimable,
    apportionmentApplied: ratio < 100,
  };
}

export function calculatePenaltyRisk(vatDue, dueDate, today = new Date(), prescribedRate = 10.75) {
  const principal = Math.max(Number(vatDue) || 0, 0);
  const due = parseDate(dueDate);
  const asAt = parseDate(today) || new Date();

  if (!due || asAt <= due || principal === 0) {
    return {
      daysLate: 0,
      lateSubmission: 0,
      latePayment: 0,
      interest: 0,
      totalExposure: 0,
    };
  }

  const ms = asAt.getTime() - due.getTime();
  const daysLate = Math.ceil(ms / 86400000);
  const lateSubmission = Math.round(principal * 0.1);
  const latePayment = Math.round(principal * 0.1);
  const interest = Math.round(principal * (Number(prescribedRate) / 100) * (daysLate / 365));

  return {
    daysLate,
    lateSubmission,
    latePayment,
    interest,
    totalExposure: lateSubmission + latePayment + interest,
  };
}

export default {
  validateInvoiceS20,
  classifySupply,
  checkInputBlock,
  calculateTimeOfSupply,
  calculateApportionment,
  calculatePenaltyRisk,
};
