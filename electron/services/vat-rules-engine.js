const FULL_TAX_INVOICE_THRESHOLD = 5000;

function normalizeString(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeNumber(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
}

function normalizeOptionalBoolean(value) {
  if (value == null) return null;
  return Boolean(value);
}

function classifyDocumentKind(documentType, totalInclVat) {
  if (documentType === 'credit_note') return 'credit_note';
  if (documentType === 'debit_note') return 'debit_note';
  if (documentType !== 'tax_invoice') return documentType || 'document';
  return totalInclVat > FULL_TAX_INVOICE_THRESHOLD ? 'full_tax_invoice' : 'simplified_tax_invoice';
}

function createFinding(ruleKey, severity, message) {
  return { ruleKey, severity, message };
}

function hasValue(value) {
  return value != null && value !== '';
}

function findZeroRatedReason(lineItems) {
  for (const lineItem of lineItems) {
    const description = normalizeString(lineItem.description)?.toLowerCase();
    if (!description) continue;
    if (description.includes('brown bread')) {
      return 'Zero-rated supply matched brown bread.';
    }
  }

  return null;
}

export function normalizeVatDocument(input = {}) {
  const lineItems = Array.isArray(input.lineItems)
    ? input.lineItems.map(lineItem => ({
      description: normalizeString(lineItem?.description),
      quantity: normalizeNumber(lineItem?.quantity),
      totalExcl: normalizeNumber(lineItem?.totalExcl),
      vatAmount: normalizeNumber(lineItem?.vatAmount),
      totalIncl: normalizeNumber(lineItem?.totalIncl),
    }))
    : [];

  const document = {
    documentTable: normalizeString(input.documentTable),
    direction: normalizeString(input.direction),
    documentType: normalizeString(input.documentType),
    totalInclVat: normalizeNumber(input.totalInclVat),
    hasTextTaxInvoice: normalizeOptionalBoolean(input.hasTextTaxInvoice),
    supplierName: normalizeString(input.supplierName),
    supplierVatNumber: normalizeString(input.supplierVatNumber),
    supplierAddress: normalizeString(input.supplierAddress),
    recipientName: normalizeString(input.recipientName),
    recipientVatNumber: normalizeString(input.recipientVatNumber),
    invoiceNumber: normalizeString(input.invoiceNumber),
    invoiceDate: normalizeString(input.invoiceDate),
    reasonText: normalizeString(input.reasonText),
    originalInvoiceNumber: normalizeString(input.originalInvoiceNumber),
    lineItems,
  };

  return {
    ...document,
    documentKind: classifyDocumentKind(document.documentType, document.totalInclVat),
  };
}

export function validateSection20(document) {
  if (document.documentType !== 'tax_invoice') return [];

  const findings = [];
  if (document.hasTextTaxInvoice === false) {
    findings.push(
      createFinding(
        'section20_tax_invoice_text',
        'critical',
        'Tax invoice documents must include the words "tax invoice".'
      )
    );
  }

  if (document.documentKind === 'full_tax_invoice' && !hasValue(document.recipientName)) {
    findings.push(
      createFinding(
        'section20_recipient_name',
        'critical',
        'Full tax invoices must include the recipient name.'
      )
    );
  }

  if (document.documentKind === 'full_tax_invoice' && !hasValue(document.recipientVatNumber)) {
    findings.push(
      createFinding(
        'section20_recipient_vat_number',
        'critical',
        'Full tax invoices must include the recipient VAT number.'
      )
    );
  }

  return findings;
}

export function validateSection21(document) {
  if (document.documentType !== 'credit_note' && document.documentType !== 'debit_note') {
    return [];
  }

  const findings = [];
  if (!hasValue(document.originalInvoiceNumber)) {
    findings.push(
      createFinding(
        'section21_original_invoice_reference',
        'critical',
        'Credit and debit notes must reference the original invoice.'
      )
    );
  }

  if (!hasValue(document.reasonText)) {
    findings.push(
      createFinding(
        'section21_reason',
        'critical',
        'Credit and debit notes must include a reason for the adjustment.'
      )
    );
  }

  return findings;
}

export function classifySupply(document) {
  const zeroRatedReason = findZeroRatedReason(document.lineItems);
  if (zeroRatedReason) {
    return {
      supplyType: 'zero',
      reason: zeroRatedReason,
    };
  }

  return {
    supplyType: 'standard',
    reason: 'Defaulted to standard-rated supply.',
  };
}

export function evaluateVatDocument(input) {
  const document = normalizeVatDocument(input);
  const findings = [...validateSection20(document), ...validateSection21(document)];
  const classification = classifySupply(document);

  return {
    summary: {
      documentKind: document.documentKind,
      supplyType: classification.supplyType,
      supplyTypeReason: classification.reason,
    },
    findings,
    computed: {
      supplyType: classification.supplyType,
      supplyTypeReason: classification.reason,
    },
  };
}
