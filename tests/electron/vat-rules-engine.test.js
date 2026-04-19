import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateVatDocument } from '../../electron/services/vat-rules-engine.js';

test('evaluateVatDocument returns critical Section 20 findings for a full tax invoice missing recipient fields', () => {
  const result = evaluateVatDocument({
    documentTable: 'vat_receipts',
    direction: 'purchase',
    documentType: 'tax_invoice',
    totalInclVat: 5750,
    hasTextTaxInvoice: true,
    supplierName: 'ABC Suppliers',
    supplierVatNumber: '4123456789',
    supplierAddress: '1 Main Road',
    recipientName: null,
    recipientVatNumber: null,
    invoiceNumber: 'INV-100',
    invoiceDate: '2026-04-15',
    lineItems: [
      {
        description: 'Office chairs',
        quantity: 1,
        totalExcl: 5000,
        vatAmount: 750,
        totalIncl: 5750,
      },
    ],
  });

  assert.equal(result.summary.documentKind, 'full_tax_invoice');
  assert.ok(
    result.findings.some(
      finding => finding.ruleKey === 'section20_recipient_name' && finding.severity === 'critical'
    )
  );
  assert.ok(
    result.findings.some(
      finding =>
        finding.ruleKey === 'section20_recipient_vat_number' && finding.severity === 'critical'
    )
  );
});

test('evaluateVatDocument returns critical Section 21 findings for a credit note without original invoice reference', () => {
  const result = evaluateVatDocument({
    documentTable: 'vat_sales_invoices',
    direction: 'sale',
    documentType: 'credit_note',
    totalInclVat: 1150,
    invoiceNumber: 'CN-1',
    invoiceDate: '2026-04-18',
    reasonText: 'Customer return',
    originalInvoiceNumber: null,
    lineItems: [
      {
        description: 'Returned stock',
        quantity: 1,
        totalExcl: 1000,
        vatAmount: 150,
        totalIncl: 1150,
      },
    ],
  });

  assert.ok(
    result.findings.some(
      finding =>
        finding.ruleKey === 'section21_original_invoice_reference' &&
        finding.severity === 'critical'
    )
  );
});

test('evaluateVatDocument classifies brown bread as zero rated with a reason', () => {
  const result = evaluateVatDocument({
    documentTable: 'vat_sales_invoices',
    direction: 'sale',
    documentType: 'tax_invoice',
    totalInclVat: 1000,
    invoiceNumber: 'INV-200',
    invoiceDate: '2026-04-18',
    lineItems: [
      {
        description: 'Brown bread loaves',
        quantity: 10,
        totalExcl: 1000,
        vatAmount: 0,
        totalIncl: 1000,
      },
    ],
  });

  assert.equal(result.summary.supplyType, 'zero');
  assert.match(result.summary.supplyTypeReason, /brown bread/i);
  assert.equal(result.computed.supplyType, result.summary.supplyType);
  assert.equal(result.computed.supplyTypeReason, result.summary.supplyTypeReason);
  assert.ok(
    !result.findings.some(finding => finding.ruleKey === 'section20_tax_invoice_text'),
    'missing hasTextTaxInvoice input should remain unknown, not become a critical finding'
  );
});

test('evaluateVatDocument blocks entertainment input tax and returns blocked amount', () => {
  const result = evaluateVatDocument({
    documentTable: 'vat_receipts',
    direction: 'purchase',
    documentType: 'tax_invoice',
    invoiceNumber: 'ENT-1',
    invoiceDate: '2026-04-18',
    totalInclVat: 1150,
    vatAmount: 150,
    totalExclVat: 1000,
    lineItems: [
      {
        description: 'Client dinner entertainment',
        quantity: 1,
        totalExcl: 1000,
        vatAmount: 150,
        totalIncl: 1150,
      },
    ],
  });

  assert.equal(result.summary.blockedInputAmount, 150);
  assert.ok(result.findings.some(finding => finding.ruleKey === 'section17_entertainment_block'));
});

test('evaluateVatDocument applies apportionment for mixed-supply clients', () => {
  const result = evaluateVatDocument({
    documentTable: 'vat_receipts',
    direction: 'purchase',
    documentType: 'tax_invoice',
    invoiceNumber: 'MIX-1',
    invoiceDate: '2026-04-18',
    totalInclVat: 1150,
    vatAmount: 150,
    totalExclVat: 1000,
    clientSettings: { hasMixedSupplies: true, apportionmentRatio: 60 },
    lineItems: [
      {
        description: 'Shared admin costs',
        quantity: 1,
        totalExcl: 1000,
        vatAmount: 150,
        totalIncl: 1150,
      },
    ],
  });

  assert.equal(result.summary.apportionedInputAmount, 60);
  assert.equal(result.summary.nonClaimableApportionmentAmount, 90);
});

test('evaluateVatDocument flags time-of-supply conflicts when payment predates invoice period', () => {
  const result = evaluateVatDocument({
    documentTable: 'vat_sales_invoices',
    direction: 'sale',
    documentType: 'tax_invoice',
    invoiceNumber: 'SALE-1',
    invoiceDate: '2026-04-12',
    paymentDate: '2026-03-30',
    totalInclVat: 2300,
    vatAmount: 300,
    totalExclVat: 2000,
    lineItems: [
      {
        description: 'Consulting fee',
        quantity: 1,
        totalExcl: 2000,
        vatAmount: 300,
        totalIncl: 2300,
      },
    ],
  });

  assert.ok(result.findings.some(finding => finding.ruleKey === 'time_of_supply_period_conflict'));
  assert.equal(result.summary.timeOfSupplyDate, '2026-03-30');
});
