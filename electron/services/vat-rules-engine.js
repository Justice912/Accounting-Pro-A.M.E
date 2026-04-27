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

// Schedule 1 Part B zero-rated basic foodstuffs and other zero-rated supplies
const ZERO_RATED_KEYWORDS = [
  'brown bread', 'maize meal', 'samp', 'mealie rice', 'dried mealies', 'dried beans', 'lentils',
  'pilchards', 'sardines', 'milk powder', 'dairy powder blend', 'rice', 'vegetables', 'fruit',
  'vegetable oil', 'milk', 'cultured milk', 'brown wheaten meal', 'eggs', 'edible legumes',
  'edible pulses', 'illuminating paraffin', 'sanitary towels', 'tampons',
  'fertiliser', 'fertilizer', 'pesticide', 'animal feed', 'seeds',
  'export', 'zero-rated',
];

// Section 12 exempt supplies
const EXEMPT_KEYWORDS = [
  'interest', 'financial service', 'residential rent', 'residential rental',
  'tuition', 'school fee', 'school fees', 'educational', 'child care', 'childcare',
  'union fee', 'union subscription', 'public transport', 'bus fare', 'train fare',
];

// S17(2)(b) motor car — excluded if clearly a commercial delivery vehicle
const MOTOR_CAR_KEYWORDS = ['sedan', 'suv', 'hatchback', 'coupe', 'motor car', 'passenger vehicle'];
const COMMERCIAL_VEHICLE_KEYWORDS = ['bakkie', 'truck', 'delivery van', 'minibus taxi', 'tow truck', 'forklift'];

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
    const match = ZERO_RATED_KEYWORDS.find(k => description.includes(k));
    if (match) {
      return `Zero-rated supply (Schedule 1 / S11): matched '${match}'.`;
    }
  }
  return null;
}

function findExemptReason(lineItems) {
  for (const lineItem of lineItems) {
    const description = normalizeString(lineItem.description)?.toLowerCase();
    if (!description) continue;
    const match = EXEMPT_KEYWORDS.find(k => description.includes(k));
    if (match) {
      return `Exempt supply (S12): matched '${match}'.`;
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
    vatType: normalizeString(input.vatType ?? input.vat_type),
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

  const findings = [];
  let blockedVat = 0;

  for (const lineItem of document.lineItems) {
    const desc = normalizeString(lineItem.description)?.toLowerCase() || '';
    const vat = normalizeNumber(lineItem.vatAmount);

    if (ENTERTAINMENT_KEYWORDS.some(k => desc.includes(k))) {
      blockedVat += vat;
      if (!findings.some(f => f.ruleKey === 'section17_entertainment_block')) {
        findings.push(createFinding(
          'section17_entertainment_block',
          'critical',
          'Entertainment input tax is blocked under S17(2)(a).'
        ));
      }
      continue;
    }

    const isMotorCar = MOTOR_CAR_KEYWORDS.some(k => desc.includes(k));
    const isCommercial = COMMERCIAL_VEHICLE_KEYWORDS.some(k => desc.includes(k));
    if (isMotorCar && !isCommercial) {
      blockedVat += vat;
      if (!findings.some(f => f.ruleKey === 'section17_motor_car_block')) {
        findings.push(createFinding(
          'section17_motor_car_block',
          'critical',
          'Motor car input tax is blocked under S17(2)(b) — only commercial vehicles qualify.'
        ));
      }
      continue;
    }

    if (['private use', 'personal use', 'donation', 'gift', 'non-business'].some(k => desc.includes(k))) {
      blockedVat += vat;
      if (!findings.some(f => f.ruleKey === 'section17_non_taxable_use')) {
        findings.push(createFinding(
          'section17_non_taxable_use',
          'critical',
          'Input tax blocked under S17(2)(c) — non-taxable or private use.'
        ));
      }
    }
  }

  if (!findings.length) {
    return { blockedInputAmount: 0, findings: [] };
  }

  const blockedInputAmount = roundAmount(blockedVat || document.vatAmount);
  return { blockedInputAmount, findings };
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

function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return Infinity;
  return Math.abs(new Date(dateA) - new Date(dateB)) / 86400000;
}

function fuzzyNameMatch(a, b) {
  if (!a || !b) return false;
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const na = norm(a), nb = norm(b);
  return na === nb || (na.length > 4 && nb.includes(na)) || (nb.length > 4 && na.includes(nb));
}

export function detectDuplicateStatus(document, context = null) {
  const candidates = Array.isArray(context?.existingDocuments) ? context.existingDocuments : [];

  // Exact: same supplier VAT + invoice number + total (S5.5 spec)
  const exactDuplicate = candidates.find(c => (
    normalizeString(c?.invoiceNumber) === document.invoiceNumber &&
    normalizeString(c?.supplierVatNumber) === document.supplierVatNumber &&
    roundAmount(c?.totalInclVat) === roundAmount(document.totalInclVat)
  ));
  if (exactDuplicate) {
    return {
      duplicateStatus: 'exact',
      findings: [createFinding(
        'duplicate_exact_match', 'warning',
        'A matching VAT document already exists with the same invoice reference and total.'
      )],
    };
  }

  // Probable: same supplier name (fuzzy) + same total + date within 7 days
  const probable = candidates.find(c => (
    fuzzyNameMatch(c?.supplierName, document.supplierName) &&
    roundAmount(c?.totalInclVat) === roundAmount(document.totalInclVat) &&
    daysBetween(c?.invoiceDate, document.invoiceDate) <= 7
  ));
  if (probable) {
    return {
      duplicateStatus: 'probable',
      findings: [createFinding(
        'duplicate_probable_match', 'warning',
        'Probable duplicate — same supplier name, total, and date within 7 days.'
      )],
    };
  }

  // Near: same total + same date + different supplier (suspicious)
  const near = candidates.find(c => (
    roundAmount(c?.totalInclVat) === roundAmount(document.totalInclVat) &&
    normalizeString(c?.invoiceDate) === document.invoiceDate &&
    !fuzzyNameMatch(c?.supplierName, document.supplierName)
  ));
  if (near) {
    return {
      duplicateStatus: 'near',
      findings: [createFinding(
        'duplicate_near_match', 'warning',
        'Suspicious duplicate — same total and date but different supplier.'
      )],
    };
  }

  return { duplicateStatus: 'clear', findings: [] };
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

function buildVat201Contribution(document, classification, apportionment) {
  const contribution = {
    standardRatedSuppliesExclVat: 0,
    zeroRatedSuppliesExclVat: 0,
    exemptSuppliesExclVat: 0,
    outputTax: 0,
    inputTax: 0,
    capitalInputTax: 0,
  };

  if (document.direction === 'sale') {
    if (classification.supplyType === 'zero') {
      contribution.zeroRatedSuppliesExclVat = document.totalExclVat;
    } else if (classification.supplyType === 'exempt') {
      contribution.exemptSuppliesExclVat = document.totalExclVat;
    } else {
      contribution.standardRatedSuppliesExclVat = document.totalExclVat;
      contribution.outputTax = document.vatAmount;
    }
    return contribution;
  }

  if (document.direction === 'purchase') {
    if (document.vatType === 'capital') {
      contribution.capitalInputTax = apportionment.apportionedInputAmount;
    } else {
      contribution.inputTax = apportionment.apportionedInputAmount;
    }
  }

  return contribution;
}

export function classifySupply(document) {
  const zeroRatedReason = findZeroRatedReason(document.lineItems);
  if (zeroRatedReason) {
    return { supplyType: 'zero', reason: zeroRatedReason };
  }

  const exemptReason = findExemptReason(document.lineItems);
  if (exemptReason) {
    return { supplyType: 'exempt', reason: exemptReason };
  }

  return { supplyType: 'standard', reason: 'Defaulted to standard-rated supply.' };
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
  const vat201 = buildVat201Contribution(document, classification, apportionment);

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
      vat201,
      timeOfSupplyDate: timeOfSupply.timeOfSupplyDate,
      blockedInputAmount: blockResult.blockedInputAmount,
      apportionedInputAmount: apportionment.apportionedInputAmount,
    },
    advisories,
  };
}
