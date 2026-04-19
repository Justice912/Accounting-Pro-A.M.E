function roundAmount(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function sumBy(items, selector) {
  return roundAmount(items.reduce((sum, item) => sum + (Number(selector(item)) || 0), 0));
}

function isIncludedDocument(document) {
  return document?.status === 'approved' && (document?.summary?.duplicateStatus || 'clear') === 'clear';
}

function averageComplianceScore(documents) {
  if (!documents.length) return 100;
  const total = documents.reduce((sum, document) => {
    return sum + (Number(document?.summary?.complianceScore) || 100);
  }, 0);
  return roundAmount(total / documents.length);
}

function estimatePenaltyRisk({ netVat, clientSettings, now }) {
  if (!clientSettings?.returnDueDate || !now || netVat <= 0) {
    return null;
  }

  const today = String(now).slice(0, 10);
  const dueDate = String(clientSettings.returnDueDate).slice(0, 10);
  if (!today || !dueDate || today <= dueDate) {
    return null;
  }

  const latePenalty = roundAmount(netVat * 0.1);
  const annualRate = Number(clientSettings.penaltyInterestRate) || 0;
  return {
    latePenalty,
    estimatedInterest: roundAmount(netVat * (annualRate / 100) / 12),
  };
}

export function toVat201Fields(summary) {
  return {
    field1: roundAmount(summary.standardRatedSuppliesExclVat),
    field1a: roundAmount(summary.outputTax),
    field2: roundAmount(summary.zeroRatedSuppliesExclVat),
    field3: roundAmount(summary.exemptSuppliesExclVat),
    field12: roundAmount(summary.inputTax),
    field13: roundAmount(summary.capitalInputTax),
  };
}

export function buildVatPeriodSummary({
  clientId,
  period,
  purchases = [],
  sales = [],
  clientSettings = null,
  now = null,
}) {
  const includedPurchases = purchases.filter(isIncludedDocument);
  const includedSales = sales.filter(isIncludedDocument);
  const includedDocuments = [...includedPurchases, ...includedSales];

  const standardRatedSuppliesExclVat = sumBy(
    includedSales,
    document => document?.computed?.vat201?.standardRatedSuppliesExclVat
  );
  const zeroRatedSuppliesExclVat = sumBy(
    includedSales,
    document => document?.computed?.vat201?.zeroRatedSuppliesExclVat
  );
  const exemptSuppliesExclVat = sumBy(
    includedSales,
    document => document?.computed?.vat201?.exemptSuppliesExclVat
  );
  const outputTax = sumBy(
    includedSales,
    document => document?.computed?.vat201?.outputTax
  );
  const inputTax = sumBy(
    includedPurchases,
    document => document?.computed?.vat201?.inputTax
  );
  const capitalInputTax = sumBy(
    includedPurchases,
    document => document?.computed?.vat201?.capitalInputTax
  );
  const blockedInputVat = sumBy(
    includedPurchases,
    document => document?.summary?.blockedInputAmount
  );
  const apportionedInputVat = sumBy(
    includedPurchases,
    document => document?.summary?.apportionedInputAmount
  );
  const totalInputVat = roundAmount(inputTax + capitalInputTax);
  const netVat = roundAmount(outputTax - totalInputVat);

  const vat201 = toVat201Fields({
    standardRatedSuppliesExclVat,
    outputTax,
    zeroRatedSuppliesExclVat,
    exemptSuppliesExclVat,
    inputTax,
    capitalInputTax,
  });

  return {
    clientId,
    period,
    vat201,
    totals: {
      outputVat: outputTax,
      inputVat: totalInputVat,
      blockedInputVat,
      apportionedInputVat,
    },
    netVat,
    complianceScore: averageComplianceScore(includedDocuments),
    penaltyRisk: estimatePenaltyRisk({ netVat, clientSettings, now }),
  };
}
