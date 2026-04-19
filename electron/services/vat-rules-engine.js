const FULL_TAX_INVOICE_THRESHOLD = 5000;
const ENTERTAINMENT_KEYWORDS = [
  'entertainment',
  'dinner',
  'restaurant',
  'club',
  'hospitality',
  'drinks',
  'party',
  'function',
];

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

function normalizeRatio(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return 0;
  return Math.min(100, Math.max(0, normalized));
}

function roundAmount(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
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

function isEarlierDate(left, right) {
  if (!hasValue(left) || !hasValue(right)) return false;
  return left < right;
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
    totalExclVat: normalizeNumber(input.totalExclVat),
    vatAmount: normalizeNumber(input.vatAmount),
    hasTextTaxInvoice: normalizeOptionalBoolean(input.hasTextTaxInvoice),
    supplierName: normalizeString(input.supplierName),
    supplierVatNumber: normalizeString(input.supplierVatNumber),
    supplierAddress: normalizeString(input.supplierAddress),
    recipientName: normalizeString(input.recipientName),
    recipientVatNumber: normalizeString(input.recipientVatNumber),
    invoiceNumber: normalizeString(input.invoiceNumber),
    invoiceDate: normalizeString(input.invoiceDate),
    paymentDate: normalizeString(input.paymentDate),
    reasonText: normalizeString(input.reasonText),
    originalInvoiceNumber: normalizeString(input.originalInvoiceNumber),
    clientSettings: {
      hasMixedSupplies: Boolean(input.clientSettings?.hasMixedSupplies),
      apportionmentRatio: normalizeRatio(input.clientSettings?.apportionmentRatio),
    },
    context: input.context || null,
    periodContext: input.periodContext || null,
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

export function checkInputTaxBlocks(document) {
  if (document.direction !== 'purchase') {
    return { blockedInputAmount: 0, findings: [] };
  }

  const blockedLineItems = document.lineItems.filter(lineItem => {
    const description = normalizeString(lineItem.description)?.toLowerCase() || '';
    return ENTERTAINMENT_KEYWORDS.some(keyword => description.includes(keyword));
  });

  if (!blockedLineItems.length) {
    return { blockedInputAmount: 0, findings: [] };
  }

  const blockedInputAmount = roundAmount(
    blockedLineItems.reduce((sum, lineItem) => sum + normalizeNumber(lineItem.vatAmount), 0) ||
    document.vatAmount
  );

  return {
    blockedInputAmount,
    findings: [
      createFinding(
        'section17_entertainment_block',
        'critical',
        'Entertainment input tax is blocked under Section 17(2).'
      ),
    ],
  };
}

export function calculateTimeOfSupply(document) {
  const timeOfSupplyDate = isEarlierDate(document.paymentDate, document.invoiceDate)
    ? document.paymentDate
    : document.invoiceDate;

  const findings = [];
  if (isEarlierDate(document.paymentDate, document.invoiceDate)) {
    findings.push(
      createFinding(
        'time_of_supply_period_conflict',
        'warning',
        'Payment predates the invoice date, so the supply may belong to an earlier VAT period.'
      )
    );
  }

  return {
    timeOfSupplyDate,
    findings,
  };
}

export function calculateApportionment(document, clientSettings = {}, blockedInputAmount = 0) {
  if (document.direction !== 'purchase') {
    return {
      apportionedInputAmount: 0,
      nonClaimableApportionmentAmount: 0,
    };
  }

  const claimBase = Math.max(0, roundAmount(document.vatAmount - blockedInputAmount));
  if (!clientSettings?.hasMixedSupplies) {
    return {
      apportionedInputAmount: claimBase,
      nonClaimableApportionmentAmount: 0,
    };
  }

  // The current client ratio is treated as the provisional non-claimable portion
  // until the richer annual apportionment workflow is wired in.
  const nonClaimableApportionmentAmount = roundAmount(
    claimBase * (normalizeRatio(clientSettings.apportionmentRatio) / 100)
  );
  const apportionedInputAmount = roundAmount(claimBase - nonClaimableApportionmentAmount);

  return {
    apportionedInputAmount,
    nonClaimableApportionmentAmount,
  };
}

export function detectDuplicateStatus(document, context = null) {
  const candidates = Array.isArray(context?.existingDocuments) ? context.existingDocuments : [];
  const exactDuplicate = candidates.find(candidate => (
    normalizeString(candidate?.invoiceNumber) === document.invoiceNumber &&
    normalizeString(candidate?.supplierVatNumber) === document.supplierVatNumber &&
    roundAmount(candidate?.totalInclVat) === roundAmount(document.totalInclVat)
  ));

  if (exactDuplicate) {
    return {
      duplicateStatus: 'exact',
      findings: [
        createFinding(
          'duplicate_exact_match',
          'warning',
          'A matching VAT document already exists with the same invoice reference and total.'
        ),
      ],
    };
  }

  return {
    duplicateStatus: 'clear',
    findings: [],
  };
}

export function calculatePenaltyRisk(periodContext = null) {
  if (!periodContext?.dueDate || !periodContext?.today || !periodContext?.vatDue) {
    return null;
  }

  const today = normalizeString(periodContext.today);
  const dueDate = normalizeString(periodContext.dueDate);
  const vatDue = Math.max(0, normalizeNumber(periodContext.vatDue));
  if (!hasValue(today) || !hasValue(dueDate) || vatDue <= 0 || today <= dueDate) {
    return null;
  }

  const penaltyAmount = roundAmount(vatDue * 0.1);
  return {
    type: 'penalty_risk',
    severity: 'warning',
    penaltyAmount,
    message: `Potential late-filing penalty exposure of ${penaltyAmount.toFixed(2)} on the current VAT due amount.`,
  };
}

export function scoreCompliance(findings) {
  const severityPenalty = {
    critical: 25,
    warning: 10,
    info: 5,
  };

  const score = findings.reduce((total, finding) => {
    return total - (severityPenalty[finding.severity] || 0);
  }, 100);

  return Math.max(0, score);
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
  const section20Findings = validateSection20(document);
  const section21Findings = validateSection21(document);
  const blockResult = checkInputTaxBlocks(document);
  const timeOfSupply = calculateTimeOfSupply(document);
  const duplicate = detectDuplicateStatus(document, document.context);
  const classification = classifySupply(document);
  const apportionment = calculateApportionment(
    document,
    document.clientSettings,
    blockResult.blockedInputAmount
  );
  const findings = [
    ...section20Findings,
    ...section21Findings,
    ...blockResult.findings,
    ...timeOfSupply.findings,
    ...duplicate.findings,
  ];
  const complianceScore = scoreCompliance(findings);
  const penaltyRisk = calculatePenaltyRisk(document.periodContext);
  const advisories = penaltyRisk ? [penaltyRisk] : [];

  return {
    summary: {
      documentKind: document.documentKind,
      complianceScore,
      supplyType: classification.supplyType,
      supplyTypeReason: classification.reason,
      blockedInputAmount: blockResult.blockedInputAmount,
      apportionedInputAmount: apportionment.apportionedInputAmount,
      nonClaimableApportionmentAmount: apportionment.nonClaimableApportionmentAmount,
      timeOfSupplyDate: timeOfSupply.timeOfSupplyDate,
      duplicateStatus: duplicate.duplicateStatus,
    },
    findings,
    computed: {
      supplyType: classification.supplyType,
      supplyTypeReason: classification.reason,
      timeOfSupplyDate: timeOfSupply.timeOfSupplyDate,
      blockedInputAmount: blockResult.blockedInputAmount,
      apportionedInputAmount: apportionment.apportionedInputAmount,
    },
    advisories,
  };
}
