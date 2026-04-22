import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateInvoiceS20,
  classifySupply,
  checkInputBlock,
  calculateTimeOfSupply,
  calculateApportionment,
  calculatePenaltyRisk,
} from '../../../src/utils/vatRulesEngine.js';

test('validateInvoiceS20 marks abridged invoice as green when required fields are present', () => {
  const result = validateInvoiceS20({
    hasTextTaxInvoice: true,
    supplierName: 'ACME Supplies',
    supplierAddress: '1 Main Rd, Durban',
    supplierVatNumber: '4123456789',
    invoiceNumber: 'INV-001',
    invoiceDate: '2026-04-01',
    lineItems: [{ description: 'Stationery', quantity: 1, totalExcl: 10000 }],
    totalExclVat: 10000,
    vatAmount: 1500,
    totalInclVat: 11500,
  }, 11500, { today: '2026-04-22' });

  assert.equal(result.invoiceType, 'abridged');
  assert.equal(result.overallScore, 'green');
});

test('validateInvoiceS20 requires recipient details for full invoices', () => {
  const result = validateInvoiceS20({
    hasTextTaxInvoice: true,
    supplierName: 'ACME Supplies',
    supplierAddress: '1 Main Rd, Durban',
    supplierVatNumber: '4123456789',
    invoiceNumber: 'INV-002',
    invoiceDate: '2026-04-01',
    lineItems: [{ description: 'Equipment', quantity: 1, totalExcl: 600000 }],
    totalExclVat: 600000,
    vatAmount: 90000,
    totalInclVat: 690000,
  }, 690000, { today: '2026-04-22' });

  assert.equal(result.invoiceType, 'full');
  assert.equal(result.overallScore, 'red');
  assert.equal(
    result.s20Checks.some(check => check.field === 'recipientName' && check.valid === false),
    true
  );
});

test('validateInvoiceS20 applies section 21 checks for debit notes', () => {
  const result = validateInvoiceS20({
    documentType: 'debit_note',
    documentTypeLabel: 'Debit Note',
    originalInvoiceNumber: 'INV-100',
    adjustmentReason: 'Understated amount',
    correctedAmount: 2500,
  });

  assert.equal(result.invoiceType, 'debit_note');
  assert.equal(result.overallScore, 'green');
  assert.equal(result.s20Checks.length, 4);
});

test('classifySupply identifies zero-rated and exempt supplies', () => {
  const zero = classifySupply('Brown bread loaf');
  const exempt = classifySupply('Residential rental for April');
  const standard = classifySupply('Office chair');

  assert.equal(zero.supplyType, 'zero');
  assert.equal(exempt.supplyType, 'exempt');
  assert.equal(standard.supplyType, 'standard');
});

test('checkInputBlock blocks entertainment and allows delivery vehicles', () => {
  const entertainment = checkInputBlock('Team dinner at restaurant', 'Meals');
  const blockedCar = checkInputBlock('Motor vehicle SUV purchase', 'Asset');
  const allowedBakkie = checkInputBlock('Bakkie for delivery fleet', 'Transport');

  assert.deepEqual(entertainment, {
    inputBlocked: true,
    blockReason: 'S17(2)(a) - entertainment expenditure',
  });
  assert.equal(blockedCar.inputBlocked, true);
  assert.equal(allowedBakkie.inputBlocked, false);
});

test('calculateTimeOfSupply uses earlier of invoice and payment and returns VAT period', () => {
  const result = calculateTimeOfSupply('2026-04-10', '2026-04-05', 'B');

  assert.equal(result.timeOfSupply, '2026-04-05');
  assert.equal(result.source, 'payment');
  assert.equal(result.vatPeriod, '2026-03');
});

test('calculateApportionment clamps ratio and rounds to cents integer', () => {
  const apportioned = calculateApportionment(10000, 67.5);
  const clamped = calculateApportionment(10000, 150);

  assert.deepEqual(apportioned, {
    inputVAT: 10000,
    ratioPercent: 67.5,
    claimableInput: 6750,
    blockedInput: 3250,
    apportionmentApplied: true,
  });

  assert.equal(clamped.claimableInput, 10000);
  assert.equal(clamped.apportionmentApplied, false);
});

test('calculatePenaltyRisk returns zero when not late and computes exposure when late', () => {
  const notLate = calculatePenaltyRisk(250000, '2026-04-30', '2026-04-29', 10.75);
  const late = calculatePenaltyRisk(250000, '2026-04-01', '2026-04-21', 10.75);

  assert.equal(notLate.totalExposure, 0);
  assert.equal(late.daysLate, 20);
  assert.equal(late.lateSubmission, 25000);
  assert.equal(late.latePayment, 25000);
  assert.equal(late.totalExposure > 50000, true);
});
