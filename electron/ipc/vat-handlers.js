import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { buildReminderCandidates } from '../services/vat-reminders.js';
import { evaluateVatDocument } from '../services/vat-rules-engine.js';
import { buildVatPeriodSummary } from '../services/vat-period-summary.js';
import {
  applyDocumentOverrides,
  clearDocumentOverride,
  getActiveDocumentOverrides,
  getDocumentOverrideHistory,
  saveDocumentOverride,
} from '../services/vat-document-overrides.js';

const VAT_RATE = 0.15;
const VAT_OVERRIDE_DOCUMENT_TYPES = new Set(['purchase_receipt', 'sales_invoice']);

/** SARS VAT number: 10 digits starting with 4 */
function validateVatNumberFormat(vatNum) {
  return /^4\d{9}$/.test((vatNum || '').replace(/\s/g, ''));
}

function normalizeVatOverrideDocumentType(documentType) {
  const normalized = String(documentType || '').trim();
  if (!VAT_OVERRIDE_DOCUMENT_TYPES.has(normalized)) {
    throw new Error(`Unsupported VAT override document type: ${normalized || '<empty>'}`);
  }
  return normalized;
}

function getVatOverrideDocumentScope(database, documentType, documentId) {
  if (!documentId || typeof database?.getOne !== 'function') {
    return null;
  }

  const normalizedDocumentType = normalizeVatOverrideDocumentType(documentType);
  const tableName = normalizedDocumentType === 'purchase_receipt'
    ? 'vat_receipts'
    : 'vat_sales_invoices';
  return database.getOne(
    `SELECT client_id, vat_period FROM ${tableName} WHERE id = ?`,
    [documentId]
  );
}

/**
 * Derive VAT period string (YYYY-MM) from a date string.
 * Category B bi-monthly: Jan/Feb→01, Mar/Apr→03, May/Jun→05, Jul/Aug→07, Sep/Oct→09, Nov/Dec→11
 */
function getVatPeriod(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();
  const periodStart = month % 2 === 0 ? month - 1 : month;
  return `${year}-${String(periodStart).padStart(2, '0')}`;
}

function getPeriodDates(period) {
  const [year, month] = period.split('-').map(Number);
  const startMonth = month % 2 === 0 ? month - 1 : month;
  const endMonth = startMonth + 1;
  const lastDay = new Date(year, endMonth, 0).getDate();
  return {
    start: `${year}-${String(startMonth).padStart(2, '0')}-01`,
    end: `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`,
  };
}

function computeFlags(data) {
  const flags = [];
  const net = Number(data.total_excl_vat) || 0;
  const vat = Number(data.vat_amount) || 0;
  const gross = Number(data.total_incl_vat) || 0;
  if (gross > 0 && Math.abs(net + vat - gross) > 0.02) flags.push('vat_mismatch');
  if (data.supplier_vat_number && !validateVatNumberFormat(data.supplier_vat_number)) {
    flags.push('invalid_vat_format');
  }
  if (data.ai_confidence !== undefined && data.ai_confidence !== null && data.ai_confidence < 0.7) {
    flags.push('low_confidence');
  }
  if (data.invoice_date) {
    const d = new Date(data.invoice_date);
    const now = new Date();
    if (d > now) flags.push('future_date');
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    if (d < fiveYearsAgo) flags.push('old_date');
  }
  return flags;
}

function parseLineItems(lineItems) {
  if (Array.isArray(lineItems)) return lineItems;
  if (typeof lineItems === 'string') {
    try {
      const parsed = JSON.parse(lineItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function serializeLineItems(lineItems) {
  if (lineItems == null) return null;
  return typeof lineItems === 'string' ? lineItems : JSON.stringify(lineItems);
}

function getClientVatSettings(database, clientId) {
  if (!clientId || typeof database?.getOne !== 'function') return null;

  try {
    const client = database.getOne(
      `SELECT has_mixed_supplies, apportionment_ratio, penalty_interest_rate
       FROM clients WHERE id = ?`,
      [clientId]
    );
    if (!client) return null;

    return {
      hasMixedSupplies: Boolean(client.has_mixed_supplies),
      apportionmentRatio: Number(client.apportionment_ratio) || 0,
      penaltyInterestRate: Number(client.penalty_interest_rate) || 0,
    };
  } catch {
    return null;
  }
}

function evaluatePurchaseReceiptCompliance(database, data) {
  const clientSettings = data.clientSettings || getClientVatSettings(database, data.client_id) || undefined;
  return evaluateVatDocument({
    documentTable: 'vat_receipts',
    direction: 'purchase',
    documentType: data.document_type || 'tax_invoice',
    totalInclVat: data.total_incl_vat,
    totalExclVat: data.total_excl_vat,
    vatAmount: data.vat_amount,
    hasTextTaxInvoice: data.has_text_tax_invoice ?? data.hasTextTaxInvoice ?? null,
    supplierName: data.supplier_name,
    supplierVatNumber: data.supplier_vat_number,
    supplierAddress: data.supplier_address,
    recipientName: data.recipient_name,
    recipientVatNumber: data.recipient_vat_number,
    invoiceNumber: data.invoice_number,
    invoiceDate: data.invoice_date,
    paymentDate: data.payment_date,
    vatType: data.vat_type,
    lineItems: parseLineItems(data.line_items),
    clientSettings,
  });
}

function evaluateSalesInvoiceCompliance(database, data) {
  const clientSettings = data.clientSettings || getClientVatSettings(database, data.client_id) || undefined;
  return evaluateVatDocument({
    documentTable: 'vat_sales_invoices',
    direction: 'sale',
    documentType: data.document_type || 'tax_invoice',
    totalInclVat: data.total_incl_vat,
    totalExclVat: data.total_excl_vat,
    vatAmount: data.vat_amount,
    invoiceNumber: data.invoice_number,
    invoiceDate: data.invoice_date,
    paymentDate: data.payment_date,
    recipientName: data.customer_name,
    recipientVatNumber: data.customer_vat_number,
    supplierName: data.customer_name,
    supplierVatNumber: data.customer_vat_number,
    supplierAddress: data.customer_address,
    lineItems: parseLineItems(data.line_items),
    clientSettings,
  });
}

function buildReceiptComplianceFields(compliance, evaluatedAt) {
  return {
    document_kind: compliance.summary.documentKind || null,
    compliance_score: Number(compliance.summary.complianceScore) || 0,
    supply_type: compliance.summary.supplyType || null,
    supply_type_reason: compliance.summary.supplyTypeReason || null,
    blocked_input_amount: Number(compliance.summary.blockedInputAmount) || 0,
    apportioned_input_amount: Number(compliance.summary.apportionedInputAmount) || 0,
    non_claimable_apportionment_amount:
      Number(compliance.summary.nonClaimableApportionmentAmount) || 0,
    time_of_supply_date: compliance.summary.timeOfSupplyDate || null,
    duplicate_status: compliance.summary.duplicateStatus || 'clear',
    rules_evaluated_at: evaluatedAt,
  };
}

function persistRuleResults(database, {
  sourceType,
  sourceId,
  clientId,
  vatPeriod,
  findings = [],
  evaluatedAt,
  complianceScore = 0,
}) {
  if (!database) return;

  if (typeof database.run === 'function') {
    database.run('DELETE FROM vat_rule_results WHERE source_type = ? AND source_id = ?', [
      sourceType,
      sourceId,
    ]);
  }

  if (typeof database.insert !== 'function') return;

  const severityScore = { critical: 25, warning: 10, info: 5 };
  findings.forEach(finding => {
    database.insert('vat_rule_results', {
      id: crypto.randomUUID(),
      source_type: sourceType,
      source_id: sourceId,
      client_id: clientId,
      vat_period: vatPeriod,
      rule_key: finding.ruleKey,
      rule_name: finding.ruleKey,
      status: 'active',
      severity: finding.severity || 'info',
      message: finding.message || null,
      details: JSON.stringify({ finding }),
      score: severityScore[finding.severity] || 0,
      created_at: evaluatedAt,
      updated_at: evaluatedAt,
    });
  });

  if (!findings.length && typeof database.insert === 'function') {
    database.insert('vat_rule_results', {
      id: crypto.randomUUID(),
      source_type: sourceType,
      source_id: sourceId,
      client_id: clientId,
      vat_period: vatPeriod,
      rule_key: 'compliance_score',
      rule_name: 'compliance_score',
      status: 'calculated',
      severity: 'info',
      message: 'Compliance score calculated with no active findings.',
      details: JSON.stringify({ complianceScore }),
      score: complianceScore,
      created_at: evaluatedAt,
      updated_at: evaluatedAt,
    });
  }
}

function invalidateVatPeriodSummary(database, clientId, vatPeriod) {
  if (!clientId || !vatPeriod || typeof database?.run !== 'function') return;
  database.run('DELETE FROM vat_period_summaries WHERE client_id = ? AND vat_period = ?', [
    clientId,
    vatPeriod,
  ]);
}

function getVatDocumentFindings(database, sourceType, documentId) {
  if (typeof database?.getAll !== 'function') {
    return [];
  }

  try {
    return database.getAll(
      `SELECT * FROM vat_rule_results
       WHERE source_type = ? AND source_id = ?
       ORDER BY created_at ASC`,
      [sourceType, documentId]
    );
  } catch {
    return [];
  }
}

function buildReceiptBaseCompliance(receipt, findings = []) {
  const apportionedInputAmount =
    Number(receipt.apportioned_input_amount) || Number(receipt.vat_amount) || 0;
  const blockedInputAmount = Number(receipt.blocked_input_amount) || 0;
  const nonClaimableApportionmentAmount =
    Number(receipt.non_claimable_apportionment_amount) || 0;
  const vatType = receipt.vat_type || 'standard';

  return {
    summary: {
      documentKind: receipt.document_kind || null,
      complianceScore: Number(receipt.compliance_score) || 0,
      supplyType: receipt.supply_type || null,
      supplyTypeReason: receipt.supply_type_reason || null,
      blockedInputAmount,
      apportionedInputAmount,
      nonClaimableApportionmentAmount,
      timeOfSupplyDate: receipt.time_of_supply_date || null,
      duplicateStatus: receipt.duplicate_status || 'clear',
    },
    findings,
    computed: {
      supplyType: receipt.supply_type || null,
      supplyTypeReason: receipt.supply_type_reason || null,
      blockedInputAmount,
      apportionedInputAmount,
      duplicateStatus: receipt.duplicate_status || 'clear',
      timeOfSupplyDate: receipt.time_of_supply_date || null,
      vat201: {
        standardRatedSuppliesExclVat: 0,
        zeroRatedSuppliesExclVat: 0,
        exemptSuppliesExclVat: 0,
        outputTax: 0,
        inputTax: vatType === 'capital' ? 0 : apportionedInputAmount,
        capitalInputTax: vatType === 'capital' ? apportionedInputAmount : 0,
      },
    },
    document: {
      direction: 'purchase',
      totalExclVat: Number(receipt.total_excl_vat) || 0,
      vatAmount: Number(receipt.vat_amount) || 0,
      vatType,
    },
  };
}

function buildSalesBaseCompliance(invoice, findings = []) {
  const supplyType = invoice.supply_type || 'standard';
  const totalExclVat = Number(invoice.total_excl_vat) || 0;
  const vatAmount = Number(invoice.vat_amount) || 0;

  return {
    summary: {
      documentKind: invoice.document_kind || null,
      complianceScore: Number(invoice.compliance_score) || 0,
      supplyType,
      supplyTypeReason: invoice.supply_type_reason || null,
      timeOfSupplyDate: invoice.time_of_supply_date || null,
      duplicateStatus: invoice.duplicate_status || 'clear',
    },
    findings,
    computed: {
      supplyType,
      supplyTypeReason: invoice.supply_type_reason || null,
      duplicateStatus: invoice.duplicate_status || 'clear',
      timeOfSupplyDate: invoice.time_of_supply_date || null,
      vat201: {
        standardRatedSuppliesExclVat: supplyType === 'standard' ? totalExclVat : 0,
        zeroRatedSuppliesExclVat: supplyType === 'zero' ? totalExclVat : 0,
        exemptSuppliesExclVat: supplyType === 'exempt' ? totalExclVat : 0,
        outputTax: supplyType === 'standard' ? vatAmount : 0,
        inputTax: 0,
        capitalInputTax: 0,
      },
    },
    document: {
      direction: 'sale',
      totalExclVat,
      vatAmount,
    },
  };
}

function buildEffectiveCompliance(database, documentType, documentId, baseCompliance) {
  const activeOverrides = getActiveDocumentOverrides(database, documentType, documentId);
  return {
    activeOverrides,
    effectiveCompliance: applyDocumentOverrides(baseCompliance, activeOverrides),
  };
}

function buildEffectiveComplianceDetail(database, documentType, documentId, baseCompliance) {
  const { activeOverrides, effectiveCompliance } = buildEffectiveCompliance(
    database,
    documentType,
    documentId,
    baseCompliance
  );
  const overrideHistory = getDocumentOverrideHistory(database, documentType, documentId);

  return {
    activeOverrides,
    overrideHistory,
    effectiveCompliance,
  };
}

function buildReceiptDetail(database, receipt) {
  const findings = getVatDocumentFindings(database, 'purchase_receipt', receipt.id);
  const baseCompliance = buildReceiptBaseCompliance(receipt, findings);
  const {
    activeOverrides,
    overrideHistory,
    effectiveCompliance,
  } = buildEffectiveComplianceDetail(database, 'purchase_receipt', receipt.id, baseCompliance);

  const detailReceipt = {
    ...receipt,
    findings,
    baseCompliance,
    effectiveCompliance,
    activeOverrides,
    overrideHistory,
  };

  return {
    receipt: detailReceipt,
    findings,
    baseCompliance,
    effectiveCompliance,
    activeOverrides,
    overrideHistory,
  };
}

function buildSalesDetail(database, invoice) {
  const findings = getVatDocumentFindings(database, 'sales_invoice', invoice.id);
  const baseCompliance = buildSalesBaseCompliance(invoice, findings);
  const {
    activeOverrides,
    overrideHistory,
    effectiveCompliance,
  } = buildEffectiveComplianceDetail(database, 'sales_invoice', invoice.id, baseCompliance);

  return {
    ...invoice,
    findings,
    baseCompliance,
    effectiveCompliance,
    activeOverrides,
    overrideHistory,
  };
}

function mapReceiptToPeriodSummaryInput(database, receipt) {
  const baseCompliance = buildReceiptBaseCompliance(receipt);
  const { effectiveCompliance } = buildEffectiveCompliance(
    database,
    'purchase_receipt',
    receipt.id,
    baseCompliance
  );

  return {
    id: receipt.id,
    status: receipt.status,
    summary: baseCompliance.summary,
    computed: baseCompliance.computed,
    effectiveSummary: effectiveCompliance.summary,
    effectiveComputed: effectiveCompliance.computed,
    effectiveVat201: effectiveCompliance.effectiveVat201,
  };
}

function mapSalesInvoiceToPeriodSummaryInput(database, invoice) {
  const baseCompliance = buildSalesBaseCompliance(invoice);
  const { effectiveCompliance } = buildEffectiveCompliance(
    database,
    'sales_invoice',
    invoice.id,
    baseCompliance
  );

  return {
    id: invoice.id,
    status: invoice.status,
    summary: baseCompliance.summary,
    computed: baseCompliance.computed,
    effectiveSummary: effectiveCompliance.summary,
    effectiveComputed: effectiveCompliance.computed,
    effectiveVat201: effectiveCompliance.effectiveVat201,
  };
}

function toPersistedPeriodSummary(summary, now) {
  return {
    id: `${summary.clientId}_${summary.period}`,
    client_id: summary.clientId,
    vat_period: summary.period,
    output_vat: Number(summary.totals?.outputVat) || 0,
    input_vat: Number(summary.totals?.inputVat) || 0,
    net_vat: Number(summary.netVat) || 0,
    filing_status: 'draft',
    summary_data: JSON.stringify({
      vat201: summary.vat201,
      totals: summary.totals,
      penaltyRisk: summary.penaltyRisk,
    }),
    compliance_score: Number(summary.complianceScore) || 0,
    penalty_risk_amount: Number(summary.penaltyRisk?.latePenalty) || 0,
    blocked_input_vat: Number(summary.totals?.blockedInputVat) || 0,
    apportioned_input_vat: Number(summary.totals?.apportionedInputVat) || 0,
    created_at: now,
    updated_at: now,
  };
}

function normalizeStoredPeriodSummary(row) {
  if (!row) return null;
  let summaryData = {};
  try {
    summaryData = JSON.parse(row.summary_data || '{}');
  } catch {
    summaryData = {};
  }

  return {
    clientId: row.client_id,
    period: row.vat_period,
    vat201: summaryData.vat201 || {},
    totals: summaryData.totals || {
      outputVat: Number(row.output_vat) || 0,
      inputVat: Number(row.input_vat) || 0,
      blockedInputVat: Number(row.blocked_input_vat) || 0,
      apportionedInputVat: Number(row.apportioned_input_vat) || 0,
    },
    netVat: Number(row.net_vat) || 0,
    complianceScore: Number(row.compliance_score) || 0,
    penaltyRisk: summaryData.penaltyRisk || {
      latePenalty: Number(row.penalty_risk_amount) || 0,
    },
  };
}

function buildAndPersistPeriodSummary(database, clientId, period, now) {
  const purchases = database.getAll(
    'SELECT * FROM vat_receipts WHERE client_id = ? AND vat_period = ?',
    [clientId, period]
  ).map(receipt => mapReceiptToPeriodSummaryInput(database, receipt));
  const sales = database.getAll(
    'SELECT * FROM vat_sales_invoices WHERE client_id = ? AND vat_period = ?',
    [clientId, period]
  ).map(invoice => mapSalesInvoiceToPeriodSummaryInput(database, invoice));

  const client = typeof database?.getOne === 'function'
    ? database.getOne(
      `SELECT penalty_interest_rate
       FROM clients WHERE id = ?`,
      [clientId]
    )
    : null;

  const summary = buildVatPeriodSummary({
    clientId,
    period,
    purchases,
    sales,
    clientSettings: client
      ? { penaltyInterestRate: Number(client.penalty_interest_rate) || 0 }
      : null,
    now: now.toISOString().slice(0, 10),
  });

  if (typeof database?.run === 'function') {
    const persisted = toPersistedPeriodSummary(summary, now.toISOString());
    database.run(
      `INSERT OR REPLACE INTO vat_period_summaries
       (id, client_id, vat_period, output_vat, input_vat, net_vat, filing_status,
        summary_data, compliance_score, penalty_risk_amount, blocked_input_vat,
        apportioned_input_vat, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        persisted.id,
        persisted.client_id,
        persisted.vat_period,
        persisted.output_vat,
        persisted.input_vat,
        persisted.net_vat,
        persisted.filing_status,
        persisted.summary_data,
        persisted.compliance_score,
        persisted.penalty_risk_amount,
        persisted.blocked_input_vat,
        persisted.apportioned_input_vat,
        persisted.created_at,
        persisted.updated_at,
      ]
    );
  }

  return summary;
}

/**
 * Parse a bank statement CSV, detecting common SA bank formats automatically.
 */
function parseBankCSV(csv) {
  const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return [];

  const header = lines[0]
    .split(',')
    .map(h => h.replace(/"/g, '').trim().toLowerCase());

  let dateIdx = -1, descIdx = -1, amountIdx = -1, refIdx = -1, debitIdx = -1, creditIdx = -1;
  let bankName = 'Unknown';

  header.forEach((h, i) => {
    if (h === 'date') dateIdx = i;
    if (h.includes('description') || h === 'transaction') descIdx = i;
    if (h === 'amount') amountIdx = i;
    if (h.includes('reference') || h === 'ref') refIdx = i;
    if (h === 'debit') debitIdx = i;
    if (h === 'credit') creditIdx = i;
  });

  // Detect bank by header pattern
  if (header.includes('transaction description')) bankName = 'Nedbank';
  else if (header.includes('reference') && header.includes('description')) bankName = 'ABSA';
  else if (header.includes('transaction') && (header.includes('debit') || header.includes('credit'))) bankName = 'Capitec';
  else if (header.includes('amount') && header.indexOf('amount') === 1) bankName = 'FNB';
  else if (header.includes('description') && header.includes('amount')) bankName = 'Standard Bank';

  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
    if (cols.length < 2) continue;

    const dateRaw = dateIdx >= 0 ? cols[dateIdx] : '';
    if (!dateRaw) continue;

    // Normalise date (various SA formats: DD/MM/YYYY, YYYY-MM-DD, DD Mon YYYY)
    let dateNorm = dateRaw;
    const dmy = dateRaw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) dateNorm = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

    const desc = descIdx >= 0 ? cols[descIdx] : '';

    let amount = 0;
    if (amountIdx >= 0) {
      amount = -Math.abs(parseFloat((cols[amountIdx] || '').replace(/[R,\s]/g, '')) || 0);
    } else if (debitIdx >= 0) {
      const debit = parseFloat((cols[debitIdx] || '').replace(/[R,\s]/g, '')) || 0;
      amount = debit > 0 ? -debit : 0;
    }

    const ref = refIdx >= 0 ? cols[refIdx] : '';
    const d = new Date(dateNorm);
    const period = !isNaN(d) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : null;

    transactions.push({ date: dateNorm, description: desc, amount, reference: ref, bankName, period });
  }

  return transactions;
}

function getCurrentVatPeriod(now = new Date()) {
  const period = getVatPeriod(now instanceof Date ? now : new Date(now));
  return period;
}

function loadReminderContext(database, clientId, period) {
  const receipts = database.getAll(
    'SELECT * FROM vat_receipts WHERE client_id = ? AND vat_period = ? ORDER BY invoice_date DESC, created_at DESC',
    [clientId, period]
  );
  const schedule = database.getOne(
    'SELECT * FROM vat_schedules WHERE client_id = ? AND period = ?',
    [clientId, period]
  );
  const reminderStateRows = database.getAll(
    'SELECT * FROM vat_reminder_state WHERE client_id = ? AND vat_period = ?',
    [clientId, period]
  );

  return { receipts, schedule, reminderStateRows };
}

function getHandlerNow(services = {}) {
  if (typeof services.now === 'function') return services.now();
  if (services.now instanceof Date) return services.now;
  return new Date();
}

export function getVatReminderClientIdsForPeriod(database, period) {
  const receiptRows = database.getAll(
    'SELECT DISTINCT client_id FROM vat_receipts WHERE vat_period = ?',
    [period]
  );
  const scheduleRows = database.getAll(
    'SELECT DISTINCT client_id FROM vat_schedules WHERE period = ?',
    [period]
  );

  return [...new Set(
    [...receiptRows, ...scheduleRows]
      .map(row => row?.client_id)
      .filter(Boolean)
  )];
}

function upsertReminderState(database, payload, now = new Date()) {
  const {
    clientId,
    period,
    ruleKey,
    action,
    snoozedUntil = null,
    conditionSignature = null,
  } = payload || {};

  if (!clientId || !period || !ruleKey) {
    throw new Error('clientId, period, and ruleKey are required');
  }

  const state = action === 'snoozed' ? 'snoozed' : 'dismissed';
  const updatedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const id = crypto.randomUUID();

  database.run(
    `INSERT INTO vat_reminder_state
      (id, client_id, vat_period, rule_key, state, snoozed_until, condition_signature, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(client_id, vat_period, rule_key) DO UPDATE SET
       state = excluded.state,
       snoozed_until = excluded.snoozed_until,
       condition_signature = excluded.condition_signature,
       updated_at = excluded.updated_at`,
    [id, clientId, period, ruleKey, state, snoozedUntil, conditionSignature, updatedAt]
  );

  return database.getOne(
    'SELECT * FROM vat_reminder_state WHERE client_id = ? AND vat_period = ? AND rule_key = ?',
    [clientId, period, ruleKey]
  );
}

export default function registerVatHandlers(ipcMain, services) {
  const { database, keychain } = services;

  // ── Receipts ──────────────────────────────────────────────────────────────

  /** List receipts for a client, optionally filtered by period / status */
  ipcMain.handle('vat:receipt:list', async (event, clientId, filters = {}) => {
    try {
      let sql = 'SELECT * FROM vat_receipts WHERE client_id = ?';
      const params = [clientId];
      if (filters.period) { sql += ' AND vat_period = ?'; params.push(filters.period); }
      if (filters.status && filters.status !== 'all') { sql += ' AND status = ?'; params.push(filters.status); }
      sql += ' ORDER BY invoice_date DESC, created_at DESC';
      return database.getAll(sql, params);
    } catch {
      return [];
    }
  });

  /** Global pending-receipt count across all clients — powers the sidebar badge. */
  ipcMain.handle('vat:receipt:pending-count', async () => {
    try {
      const row = database.getOne(
        "SELECT COUNT(*) AS c FROM vat_receipts WHERE status = 'pending'"
      );
      return { count: row?.c || 0 };
    } catch {
      return { count: 0 };
    }
  });

  ipcMain.handle('vat:reminders:get', async (event, clientId, period) => {
    try {
      if (!clientId || !period) return [];
      const context = loadReminderContext(database, clientId, period);
      return buildReminderCandidates({
        clientId,
        period,
        receipts: context.receipts,
        schedule: context.schedule,
        reminderStateRows: context.reminderStateRows,
        now: new Date(),
      });
    } catch {
      return [];
    }
  });

  ipcMain.handle('vat:reminder:update-state', async (event, payload) => {
    try {
      const reminderState = upsertReminderState(database, payload, new Date());
      return { success: true, reminderState };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('vat:reminders:count', async () => {
    try {
      const period = getCurrentVatPeriod(getHandlerNow(services));
      if (!period) return { count: 0 };

      const clientIds = getVatReminderClientIdsForPeriod(database, period);

      const count = clientIds.reduce((total, clientId) => {
        const context = loadReminderContext(database, clientId, period);
        const reminders = buildReminderCandidates({
          clientId,
          period,
          receipts: context.receipts,
          schedule: context.schedule,
          reminderStateRows: context.reminderStateRows,
          now: new Date(),
        });
        return total + reminders.length;
      }, 0);

      return { count };
    } catch {
      return { count: 0 };
    }
  });

  /** Get a single receipt by ID */
  ipcMain.handle('vat:receipt:get', async (event, id) => {
    try {
      const receipt = database.getOne('SELECT * FROM vat_receipts WHERE id = ?', [id]);
      if (!receipt) return null;
      return buildReceiptDetail(database, receipt).receipt;
    } catch {
      return null;
    }
  });

  ipcMain.handle('vat:document:overrides:get', async (event, documentType, documentId) => {
    try {
      const normalizedDocumentType = normalizeVatOverrideDocumentType(documentType);
      return {
        success: true,
        overrides: getActiveDocumentOverrides(database, normalizedDocumentType, documentId),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('vat:document:override:save', async (event, payload) => {
    try {
      const normalizedDocumentType = normalizeVatOverrideDocumentType(
        payload?.documentType ?? payload?.document_type
      );
      const override = saveDocumentOverride(database, {
        ...payload,
        documentType: normalizedDocumentType,
      });
      const documentScope = getVatOverrideDocumentScope(
        database,
        normalizedDocumentType,
        payload?.documentId ?? payload?.document_id
      );
      invalidateVatPeriodSummary(database, documentScope?.client_id, documentScope?.vat_period);
      return { success: true, override };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('vat:document:override:clear', async (event, payload) => {
    try {
      const normalizedDocumentType = normalizeVatOverrideDocumentType(
        payload?.documentType ?? payload?.document_type
      );
      const override = clearDocumentOverride(database, {
        ...payload,
        documentType: normalizedDocumentType,
      });
      if (!override) {
        return { success: false, error: 'No active override found for the document.' };
      }
      const documentScope = getVatOverrideDocumentScope(
        database,
        normalizedDocumentType,
        payload?.documentId ?? payload?.document_id
      );
      invalidateVatPeriodSummary(database, documentScope?.client_id, documentScope?.vat_period);
      return { success: true, override };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('vat:document:override:history', async (event, documentType, documentId) => {
    try {
      const normalizedDocumentType = normalizeVatOverrideDocumentType(documentType);
      return {
        success: true,
        history: getDocumentOverrideHistory(database, normalizedDocumentType, documentId),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('vat:receipt:compliance:get', async (event, id) => {
    try {
      const receipt = database.getOne('SELECT * FROM vat_receipts WHERE id = ?', [id]);
      if (!receipt) {
        return {
          receipt: null,
          findings: [],
          baseCompliance: null,
          effectiveCompliance: null,
          activeOverrides: [],
          overrideHistory: [],
        };
      }

      return buildReceiptDetail(database, receipt);
    } catch {
      return {
        receipt: null,
        findings: [],
        baseCompliance: null,
        effectiveCompliance: null,
        activeOverrides: [],
        overrideHistory: [],
      };
    }
  });

  /** Create or update a receipt (upsert) */
  ipcMain.handle('vat:receipt:save', async (event, data) => {
    try {
      const isNew = !data.id;
      const id = data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const vatPeriod = data.vat_period || getVatPeriod(data.invoice_date);
      const compliance = evaluatePurchaseReceiptCompliance(database, {
        ...data,
        id,
      });
      const complianceFields = buildReceiptComplianceFields(compliance, now);
      const mathsValid = (() => {
        const n = Number(data.total_excl_vat) || 0;
        const v = Number(data.vat_amount) || 0;
        const g = Number(data.total_incl_vat) || 0;
        return g > 0 ? (Math.abs(n + v - g) <= 0.02 ? 1 : 0) : 1;
      })();
      const vatNumberValid = data.supplier_vat_number
        ? (validateVatNumberFormat(data.supplier_vat_number) ? 1 : 0)
        : null;
      const flags = data.flags || computeFlags(data);

      const record = {
        id,
        client_id: data.client_id,
        capture_method: data.capture_method || 'manual',
        image_path: data.image_path || null,
        supplier_name: data.supplier_name || null,
        supplier_vat_number: data.supplier_vat_number || null,
        supplier_address: data.supplier_address || null,
        invoice_number: data.invoice_number || null,
        invoice_date: data.invoice_date || null,
        total_incl_vat: Number(data.total_incl_vat) || 0,
        vat_amount: Number(data.vat_amount) || 0,
        total_excl_vat: Number(data.total_excl_vat) || 0,
        line_items: serializeLineItems(data.line_items),
        vat_number_valid: vatNumberValid,
        maths_valid: mathsValid,
        ai_confidence: data.ai_confidence != null ? Number(data.ai_confidence) : null,
        flags: JSON.stringify(Array.isArray(flags) ? flags : []),
        expense_category: data.expense_category || 'General',
        vat_type: data.vat_type || 'standard',
        vat_period: vatPeriod,
        status: data.status || 'pending',
        review_notes: data.review_notes || null,
        bank_transaction_id: data.bank_transaction_id || null,
        is_reconciled: data.is_reconciled ? 1 : 0,
        updated_at: now,
        ...complianceFields,
      };

      if (!isNew) {
        const setClauses = Object.keys(record)
          .filter(k => k !== 'id' && k !== 'client_id' && k !== 'created_at')
          .map(k => `${k} = ?`).join(', ');
        const vals = Object.keys(record)
          .filter(k => k !== 'id' && k !== 'client_id' && k !== 'created_at')
          .map(k => record[k]);
        vals.push(id);
        database.run(`UPDATE vat_receipts SET ${setClauses} WHERE id = ?`, vals);
      } else {
        record.created_at = now;
        database.insert('vat_receipts', record);
      }

      persistRuleResults(database, {
        sourceType: 'purchase_receipt',
        sourceId: id,
        clientId: data.client_id,
        vatPeriod,
        findings: compliance.findings,
        evaluatedAt: now,
        complianceScore: compliance.summary.complianceScore,
      });
      invalidateVatPeriodSummary(database, data.client_id, vatPeriod);

      return { success: true, id, compliance };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  /** Delete a receipt */
  ipcMain.handle('vat:receipt:delete', async (event, id) => {
    try {
      const existing = database.getOne('SELECT client_id, vat_period FROM vat_receipts WHERE id = ?', [id]);
      database.run('DELETE FROM vat_receipts WHERE id = ?', [id]);
      database.run('DELETE FROM vat_rule_results WHERE source_type = ? AND source_id = ?', ['purchase_receipt', id]);
      invalidateVatPeriodSummary(database, existing?.client_id, existing?.vat_period);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  /** Update status (pending/reviewed/approved/rejected/query) */
  ipcMain.handle('vat:receipt:update-status', async (event, id, status, notes) => {
    try {
      const now = new Date().toISOString();
      const existing = database.getOne('SELECT client_id, vat_period FROM vat_receipts WHERE id = ?', [id]);
      database.run(
        'UPDATE vat_receipts SET status = ?, review_notes = ?, reviewed_at = ?, updated_at = ? WHERE id = ?',
        [status, notes || null, now, now, id]
      );
      invalidateVatPeriodSummary(database, existing?.client_id, existing?.vat_period);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  /** Bulk update status for multiple receipts */
  ipcMain.handle('vat:receipt:bulk-status', async (event, ids, status) => {
    try {
      const now = new Date().toISOString();
      const receipts = database.getAll(
        `SELECT id, client_id, vat_period FROM vat_receipts
         WHERE id IN (${ids.map(() => '?').join(', ')})`,
        ids
      );
      const placeholders = ids.map(() => '?').join(', ');
      database.run(
        `UPDATE vat_receipts SET status = ?, reviewed_at = ?, updated_at = ? WHERE id IN (${placeholders})`,
        [status, now, now, ...ids]
      );
      receipts.forEach(receipt => invalidateVatPeriodSummary(database, receipt.client_id, receipt.vat_period));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── Image Import ─────────────────────────────────────────────────────────

  /** Open file picker, copy image to userData/vat-receipts/, return the local path */
  ipcMain.handle('vat:receipt:import-image', async () => {
    try {
      const { dialog, app, BrowserWindow } = await import('electron');
      const win = BrowserWindow.getFocusedWindow();
      const result = await dialog.showOpenDialog(win, {
        title: 'Select Receipt / Invoice Image',
        filters: [
          { name: 'Images & PDFs', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });
      if (result.canceled || !result.filePaths.length) {
        return { success: false, cancelled: true };
      }
      const sourcePath = result.filePaths[0];
      const destDir = path.join(app.getPath('userData'), 'vat-receipts');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const ext = path.extname(sourcePath);
      const destName = `${crypto.randomUUID()}${ext}`;
      const destPath = path.join(destDir, destName);
      fs.copyFileSync(sourcePath, destPath);
      return { success: true, imagePath: destPath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── AI OCR Extraction ────────────────────────────────────────────────────

  /**
   * Send a receipt image to Claude Vision API and extract structured invoice data.
   * Returns { success, extracted } or { success: false, error }.
   */
  ipcMain.handle('vat:receipt:extract', async (event, imagePath) => {
    try {
      const apiKey = keychain.getApiKey('claude');
      if (!apiKey) throw new Error('Claude API key not configured. Go to Settings to add it.');
      if (!fs.existsSync(imagePath)) throw new Error('Image file not found: ' + imagePath);

      const ext = path.extname(imagePath).toLowerCase().slice(1);
      const mediaTypeMap = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg',
        png: 'image/png', gif: 'image/gif', webp: 'image/webp',
      };
      if (!mediaTypeMap[ext] && ext !== 'pdf') {
        throw new Error(`Unsupported image type: .${ext}`);
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mediaType = mediaTypeMap[ext] || 'image/jpeg';

      const extractionPrompt = `You are an expert South African bookkeeper and OCR specialist.
Analyse this receipt/invoice image and extract the following fields:

1. supplier_name: The business/company name on the receipt
2. supplier_vat_number: The VAT number (10 digits, starts with 4)
3. supplier_address: Full address if visible
4. invoice_number: Invoice or receipt number
5. invoice_date: Date in YYYY-MM-DD format
6. total_incl_vat: Total amount including VAT in ZAR (number only, no currency symbol)
7. vat_amount: VAT amount in ZAR (number only)
8. total_excl_vat: Total amount excluding VAT in ZAR (number only)
9. line_items: Array of {description, qty, unitPrice, lineTotal}
10. confidence: Your confidence in the extraction (0.0 to 1.0)

If a field is not visible or unclear, set it to null.
If only total_incl_vat is visible, calculate:
  total_excl_vat = total_incl_vat / 1.15
  vat_amount = total_incl_vat - total_excl_vat

Respond ONLY with valid JSON — no markdown fences, no explanation, just the JSON object.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64Image },
                },
                { type: 'text', text: extractionPrompt },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Claude API error (${response.status}): ${errBody}`);
      }

      const apiData = await response.json();
      const rawText = apiData.content?.[0]?.text || '{}';
      const cleaned = rawText
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '').trim();

      const extracted = JSON.parse(cleaned);

      // Normalize .confidence → .ai_confidence so computeFlags can fire low_confidence.
      const flags = computeFlags({ ...extracted, ai_confidence: extracted.confidence });

      // Duplicate check (same invoice_number + supplier_name already in DB)
      if (extracted.invoice_number && extracted.supplier_name) {
        const dup = database.getOne(
          'SELECT id FROM vat_receipts WHERE invoice_number = ? AND supplier_name = ?',
          [extracted.invoice_number, extracted.supplier_name]
        );
        if (dup) flags.push('duplicate_suspected');
      }

      const compliance = evaluatePurchaseReceiptCompliance(database, {
        ...extracted,
        flags,
      });

      return {
        success: true,
        extracted: {
          ...extracted,
          flags,
          compliance_score: compliance.summary.complianceScore,
          compliance,
        },
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('vat:sales:list', async (event, clientId, filters = {}) => {
    try {
      let sql = 'SELECT * FROM vat_sales_invoices WHERE client_id = ?';
      const params = [clientId];
      if (filters.period) {
        sql += ' AND vat_period = ?';
        params.push(filters.period);
      }
      if (filters.status && filters.status !== 'all') {
        sql += ' AND status = ?';
        params.push(filters.status);
      }
      sql += ' ORDER BY invoice_date DESC, created_at DESC';
      return database.getAll(sql, params);
    } catch {
      return [];
    }
  });

  ipcMain.handle('vat:sales:get', async (event, id) => {
    try {
      const invoice = database.getOne('SELECT * FROM vat_sales_invoices WHERE id = ?', [id]);
      if (!invoice) return null;
      return buildSalesDetail(database, invoice);
    } catch {
      return null;
    }
  });

  ipcMain.handle('vat:sales:save', async (event, data) => {
    try {
      const isNew = !data.id;
      const id = data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const vatPeriod = data.vat_period || getVatPeriod(data.invoice_date);
      const compliance = evaluateSalesInvoiceCompliance(database, {
        ...data,
        id,
      });

      const record = {
        id,
        client_id: data.client_id,
        document_type: data.document_type || 'tax_invoice',
        customer_name: data.customer_name || null,
        customer_vat_number: data.customer_vat_number || null,
        customer_address: data.customer_address || null,
        invoice_number: data.invoice_number || null,
        invoice_date: data.invoice_date || null,
        payment_date: data.payment_date || null,
        total_incl_vat: Number(data.total_incl_vat) || 0,
        vat_amount: Number(data.vat_amount) || 0,
        total_excl_vat: Number(data.total_excl_vat) || 0,
        line_items: serializeLineItems(data.line_items),
        vat_period: vatPeriod,
        document_kind: compliance.summary.documentKind || null,
        supply_type: compliance.summary.supplyType || null,
        supply_type_reason: compliance.summary.supplyTypeReason || null,
        time_of_supply_date: compliance.summary.timeOfSupplyDate || null,
        duplicate_status: compliance.summary.duplicateStatus || 'clear',
        compliance_score: Number(compliance.summary.complianceScore) || 0,
        status: data.status || 'pending',
        review_notes: data.review_notes || null,
        rules_evaluated_at: now,
        updated_at: now,
      };

      if (!isNew) {
        const setClauses = Object.keys(record)
          .filter(key => key !== 'id' && key !== 'client_id' && key !== 'created_at')
          .map(key => `${key} = ?`)
          .join(', ');
        const values = Object.keys(record)
          .filter(key => key !== 'id' && key !== 'client_id' && key !== 'created_at')
          .map(key => record[key]);
        values.push(id);
        database.run(`UPDATE vat_sales_invoices SET ${setClauses} WHERE id = ?`, values);
      } else {
        record.created_at = now;
        database.insert('vat_sales_invoices', record);
      }

      persistRuleResults(database, {
        sourceType: 'sales_invoice',
        sourceId: id,
        clientId: data.client_id,
        vatPeriod,
        findings: compliance.findings,
        evaluatedAt: now,
        complianceScore: compliance.summary.complianceScore,
      });
      invalidateVatPeriodSummary(database, data.client_id, vatPeriod);

      return { success: true, id, compliance };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('vat:sales:delete', async (event, id) => {
    try {
      const existing = database.getOne('SELECT * FROM vat_sales_invoices WHERE id = ?', [id]);
      database.run('DELETE FROM vat_sales_invoices WHERE id = ?', [id]);
      database.run('DELETE FROM vat_rule_results WHERE source_type = ? AND source_id = ?', ['sales_invoice', id]);
      invalidateVatPeriodSummary(database, existing?.client_id, existing?.vat_period);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('vat:sales:update-status', async (event, id, status, notes) => {
    try {
      const now = new Date().toISOString();
      const existing = database.getOne('SELECT * FROM vat_sales_invoices WHERE id = ?', [id]);
      database.run(
        'UPDATE vat_sales_invoices SET status = ?, review_notes = ?, reviewed_at = ?, updated_at = ? WHERE id = ?',
        [status, notes || null, now, now, id]
      );
      invalidateVatPeriodSummary(database, existing?.client_id, existing?.vat_period);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ── SARS VAT Verification ────────────────────────────────────────────────

  ipcMain.handle('vat:verify-vat', async (event, vatNumber) => {
    try {
      const clean = (vatNumber || '').replace(/\s/g, '');
      if (!validateVatNumberFormat(clean)) {
        return { valid: false, vendorName: null, reason: 'Invalid format — must be 10 digits starting with 4' };
      }
      // Check local cache first
      const cached = database.getOne(
        'SELECT * FROM vat_verified_vendors WHERE vat_number = ?', [clean]
      );
      if (cached) {
        return { valid: !!cached.is_valid, vendorName: cached.vendor_name, cached: true };
      }
      // Attempt SARS live lookup — gracefully degrade if unavailable
      try {
        const resp = await fetch(
          `https://secure.sarsefiling.co.za/vatvendorsearch/api?vatNumber=${clean}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (resp.ok) {
          const result = await resp.json();
          const valid = result?.registrationStatus === 'Active';
          const vendorName = result?.tradingName || result?.name || null;
          database.run(
            'INSERT OR REPLACE INTO vat_verified_vendors (vat_number, vendor_name, is_valid, verified_at) VALUES (?, ?, ?, ?)',
            [clean, vendorName, valid ? 1 : 0, new Date().toISOString()]
          );
          return { valid, vendorName };
        }
      } catch {
        // SARS endpoint unavailable — return inconclusive
      }
      return { valid: null, vendorName: null, reason: 'SARS verification unavailable — result inconclusive' };
    } catch (e) {
      return { valid: null, vendorName: null, reason: e.message };
    }
  });

  // ── Bank Statement Import ────────────────────────────────────────────────

  ipcMain.handle('vat:bank:import', async (event, clientId) => {
    try {
      const { dialog, BrowserWindow } = await import('electron');
      const win = BrowserWindow.getFocusedWindow();
      const result = await dialog.showOpenDialog(win, {
        title: 'Import Bank Statement (CSV)',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile'],
      });
      if (result.canceled || !result.filePaths.length) {
        return { success: false, cancelled: true };
      }
      const csv = fs.readFileSync(result.filePaths[0], 'utf-8');
      const transactions = parseBankCSV(csv);
      let imported = 0;
      for (const txn of transactions) {
        try {
          database.run(
            `INSERT OR IGNORE INTO vat_bank_transactions
             (id, client_id, txn_date, description, amount, reference, bank_name, statement_period, imported_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              crypto.randomUUID(), clientId,
              txn.date, txn.description, txn.amount,
              txn.reference || null, txn.bankName || 'Unknown',
              txn.period || null, new Date().toISOString(),
            ]
          );
          imported++;
        } catch { /* skip duplicate rows */ }
      }
      // Auto-match by amount + date proximity
      autoMatchTransactions(database, clientId);
      return { success: true, imported };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('vat:bank:list', async (event, clientId, filters = {}) => {
    try {
      let sql = 'SELECT * FROM vat_bank_transactions WHERE client_id = ?';
      const params = [clientId];
      if (filters.period) { sql += ' AND statement_period = ?'; params.push(filters.period); }
      if (filters.matched !== undefined) {
        sql += ' AND is_matched = ?';
        params.push(filters.matched ? 1 : 0);
      }
      sql += ' ORDER BY txn_date DESC';
      return database.getAll(sql, params);
    } catch {
      return [];
    }
  });

  /** Manually match / unmatch a bank transaction to a receipt */
  ipcMain.handle('vat:bank:match', async (event, txnId, receiptId) => {
    try {
      if (receiptId) {
        database.run(
          'UPDATE vat_bank_transactions SET matched_receipt_id = ?, is_matched = 1 WHERE id = ?',
          [receiptId, txnId]
        );
        database.run(
          'UPDATE vat_receipts SET bank_transaction_id = ?, is_reconciled = 1, updated_at = ? WHERE id = ?',
          [txnId, new Date().toISOString(), receiptId]
        );
      } else {
        const txn = database.getOne('SELECT * FROM vat_bank_transactions WHERE id = ?', [txnId]);
        if (txn?.matched_receipt_id) {
          database.run(
            'UPDATE vat_receipts SET bank_transaction_id = NULL, is_reconciled = 0 WHERE id = ?',
            [txn.matched_receipt_id]
          );
        }
        database.run(
          'UPDATE vat_bank_transactions SET matched_receipt_id = NULL, is_matched = 0 WHERE id = ?',
          [txnId]
        );
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── VAT Schedule ─────────────────────────────────────────────────────────

  ipcMain.handle('vat:schedule:generate', async (event, clientId, period) => {
    try {
      const receipts = database.getAll(
        'SELECT * FROM vat_receipts WHERE client_id = ? AND vat_period = ?',
        [clientId, period]
      );
      const approved = receipts.filter(r => r.status === 'approved');
      const pending = receipts.filter(r => r.status === 'pending');
      const flagged = receipts.filter(r => {
        try { return JSON.parse(r.flags || '[]').length > 0; } catch { return false; }
      });

      const inputStandard = approved
        .filter(r => r.vat_type === 'standard' || r.vat_type === 'zero')
        .reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);
      const inputCapital = approved
        .filter(r => r.vat_type === 'capital')
        .reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);
      const inputTotal = inputStandard + inputCapital;
      const periodDates = getPeriodDates(period);
      const scheduleId = `${clientId}_${period}`;

      database.run(
        `INSERT OR REPLACE INTO vat_schedules
         (id, client_id, period, period_start, period_end, status,
          input_vat_standard, input_vat_capital, input_vat_total,
          output_vat_standard, output_vat_total, net_vat,
          receipt_count, approved_count, pending_count, flagged_count,
          updated_at)
         VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?)`,
        [
          scheduleId, clientId, period, periodDates.start, periodDates.end,
          inputStandard, inputCapital, inputTotal,
          -inputTotal,
          receipts.length, approved.length, pending.length, flagged.length,
          new Date().toISOString(),
        ]
      );
      return { success: true, scheduleId };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('vat:schedule:get', async (event, clientId, period) => {
    try {
      const scheduleId = `${clientId}_${period}`;
      const schedule = database.getOne('SELECT * FROM vat_schedules WHERE id = ?', [scheduleId]);
      const receipts = database.getAll(
        `SELECT * FROM vat_receipts WHERE client_id = ? AND vat_period = ?
         ORDER BY expense_category ASC, invoice_date ASC`,
        [clientId, period]
      );
      return { schedule: schedule || null, receipts };
    } catch {
      return { schedule: null, receipts: [] };
    }
  });

  ipcMain.handle('vat:period-summary:get', async (event, clientId, period) => {
    try {
      if (!clientId || !period) return null;
      const existing = database.getOne(
        'SELECT * FROM vat_period_summaries WHERE client_id = ? AND vat_period = ?',
        [clientId, period]
      );
      if (existing) return normalizeStoredPeriodSummary(existing);
      return buildAndPersistPeriodSummary(database, clientId, period, getHandlerNow(services));
    } catch {
      return null;
    }
  });

  // ── Dashboard (practice-wide overview) ──────────────────────────────────

  ipcMain.handle('vat:dashboard:get', async (event, period) => {
    try {
      const now = getHandlerNow(services);
      const effectivePeriod = period || getCurrentVatPeriod(now);
      if (!effectivePeriod) return { period: null, clients: [], summary: {} };

      const pd = getPeriodDates(effectivePeriod);
      const periodEndDate = new Date(pd.end + 'T23:59:59');
      const daysUntilClose = Math.ceil((periodEndDate - now) / (1000 * 60 * 60 * 24));

      // All clients that have any VAT activity for this period
      const clientIds = getVatReminderClientIdsForPeriod(database, effectivePeriod);

      // Also include clients that have bank transactions in the period
      const bankClientRows = database.getAll(
        `SELECT DISTINCT client_id FROM vat_bank_transactions
         WHERE txn_date >= ? AND txn_date <= ?`,
        [pd.start, pd.end]
      );
      bankClientRows.forEach(r => {
        if (r.client_id && !clientIds.includes(r.client_id)) clientIds.push(r.client_id);
      });

      // Fetch client details
      const clientMap = {};
      if (clientIds.length > 0) {
        const placeholders = clientIds.map(() => '?').join(',');
        const clientRows = database.getAll(
          `SELECT id, name, vat_number FROM clients WHERE id IN (${placeholders})`,
          clientIds
        );
        clientRows.forEach(c => { clientMap[c.id] = c; });
      }

      let totalReceipts = 0, totalPending = 0, totalApproved = 0, totalFlagged = 0;
      let totalInputVat = 0, totalPurchases = 0;
      let totalBankTxns = 0, totalBankMatched = 0;
      let clientsWithWork = 0;

      const clients = clientIds.map(cid => {
        const client = clientMap[cid] || { id: cid, name: cid, vat_number: null };
        const periodSummaryRow = database.getOne(
          'SELECT * FROM vat_period_summaries WHERE client_id = ? AND vat_period = ?',
          [cid, effectivePeriod]
        );
        const periodSummary = periodSummaryRow
          ? normalizeStoredPeriodSummary(periodSummaryRow)
          : buildAndPersistPeriodSummary(database, cid, effectivePeriod, now);

        // Receipt stats
        const rStats = database.getOne(
          `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
            SUM(CASE WHEN status = 'query' THEN 1 ELSE 0 END) AS query,
            SUM(CASE WHEN flags != '[]' AND flags IS NOT NULL AND status != 'approved' THEN 1 ELSE 0 END) AS flagged,
            SUM(CASE WHEN status = 'approved' THEN vat_amount ELSE 0 END) AS input_vat,
            SUM(CASE WHEN status = 'approved' THEN total_incl_vat ELSE 0 END) AS purchases
          FROM vat_receipts WHERE client_id = ? AND vat_period = ?`,
          [cid, effectivePeriod]
        ) || {};

        // Schedule status
        const schedule = database.getOne(
          'SELECT * FROM vat_schedules WHERE client_id = ? AND period = ?',
          [cid, effectivePeriod]
        );
        let scheduleStatus = 'missing';
        if (schedule) {
          const latestApproved = database.getOne(
            `SELECT MAX(updated_at) AS latest FROM vat_receipts
             WHERE client_id = ? AND vat_period = ? AND status = 'approved'`,
            [cid, effectivePeriod]
          );
          scheduleStatus = (latestApproved?.latest && latestApproved.latest > schedule.updated_at)
            ? 'stale' : 'current';
        }

        // Bank reconciliation
        const bStats = database.getOne(
          `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN is_matched = 1 THEN 1 ELSE 0 END) AS matched
          FROM vat_bank_transactions WHERE client_id = ? AND txn_date >= ? AND txn_date <= ?`,
          [cid, pd.start, pd.end]
        ) || {};

        // Reminder count
        let reminderCount = 0;
        try {
          const ctx = loadReminderContext(database, cid, effectivePeriod);
          const reminders = buildReminderCandidates({
            clientId: cid, period: effectivePeriod,
            receipts: ctx.receipts, schedule: ctx.schedule,
            reminderStateRows: ctx.reminderStateRows, now,
          });
          reminderCount = reminders.length;
        } catch { /* non-fatal */ }

        // Urgency
        const pending = rStats.pending || 0;
        const flagged = rStats.flagged || 0;
        const hasOutstandingWork = pending > 0 || flagged > 0 || (rStats.query || 0) > 0 || scheduleStatus !== 'current';
        let urgency = 'clear';
        if (hasOutstandingWork && daysUntilClose <= 7) urgency = 'high';
        else if (hasOutstandingWork && daysUntilClose <= 14) urgency = 'medium';
        else if (hasOutstandingWork) urgency = 'low';

        if (hasOutstandingWork) clientsWithWork++;

        const clientInputVat = Number(periodSummary?.totals?.inputVat) || 0;
        totalReceipts += rStats.total || 0;
        totalPending += pending;
        totalApproved += rStats.approved || 0;
        totalFlagged += flagged;
        totalInputVat += clientInputVat;
        totalPurchases += rStats.purchases || 0;
        totalBankTxns += bStats.total || 0;
        totalBankMatched += bStats.matched || 0;

        return {
          id: client.id,
          name: client.name,
          vatNumber: client.vat_number,
          receipts: {
            total: rStats.total || 0, pending, approved: rStats.approved || 0,
            rejected: rStats.rejected || 0, query: rStats.query || 0, flagged,
          },
          schedule: { status: scheduleStatus, updatedAt: schedule?.updated_at || null },
          bank: { total: bStats.total || 0, matched: bStats.matched || 0 },
          reminders: reminderCount,
          inputVat: clientInputVat,
          totalPurchases: rStats.purchases || 0,
          complianceScore: periodSummary?.complianceScore || 0,
          penaltyRisk: Number(periodSummary?.penaltyRisk?.latePenalty) || 0,
          blockedInputVat: Number(periodSummary?.totals?.blockedInputVat) || 0,
          apportionedInputVat: Number(periodSummary?.totals?.apportionedInputVat) || 0,
          urgency,
        };
      });

      // Sort: high urgency first
      const urgencyOrder = { high: 0, medium: 1, low: 2, clear: 3 };
      clients.sort((a, b) => (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4));

      const complianceSummary = database.getOne(
        `SELECT
          AVG(compliance_score) AS average_compliance_score,
          SUM(penalty_risk_amount) AS total_penalty_risk,
          SUM(blocked_input_vat) AS blocked_input_vat,
          SUM(apportioned_input_vat) AS apportioned_input_vat
         FROM vat_period_summaries
         WHERE vat_period = ?`,
        [effectivePeriod]
      ) || {};

      return {
        period: effectivePeriod,
        periodLabel: (() => {
          const [y, m] = effectivePeriod.split('-').map(Number);
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          return `${months[m - 1]}/${months[m]} ${y}`;
        })(),
        periodEnd: pd.end,
        daysUntilClose,
        clients,
        summary: {
          totalClients: clients.length,
          clientsWithWork,
          totalReceipts, totalPending, totalApproved, totalFlagged,
          totalInputVat, totalPurchases,
          averageComplianceScore:
            Number(complianceSummary.average_compliance_score ?? complianceSummary.compliance_score) || 0,
          totalPenaltyRisk:
            Number(complianceSummary.total_penalty_risk ?? complianceSummary.penalty_risk_amount) || 0,
          totalBlockedInputVat: Number(complianceSummary.blocked_input_vat) || 0,
          totalApportionedInputVat: Number(complianceSummary.apportioned_input_vat) || 0,
          reconciliationRate: totalBankTxns > 0 ? totalBankMatched / totalBankTxns : null,
          daysUntilClose,
        },
      };
    } catch (e) {
      return { period: null, clients: [], summary: {}, error: e.message };
    }
  });

  // ── Excel Export ─────────────────────────────────────────────────────────

  ipcMain.handle('vat:export:excel', async (event, clientId, period) => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const { dialog, BrowserWindow } = await import('electron');
      const win = BrowserWindow.getFocusedWindow();

      const client = database.getOne('SELECT * FROM clients WHERE id = ?', [clientId]);
      const receipts = database.getAll(
        `SELECT * FROM vat_receipts WHERE client_id = ? AND vat_period = ?
         ORDER BY invoice_date ASC`,
        [clientId, period]
      );
      const approved = receipts.filter(r => r.status === 'approved');

      const wb = new ExcelJS.Workbook();
      wb.creator = 'AME Pro Workstation';
      wb.created = new Date();

      // Colour palette matching spec
      const NAVY = '1B4F72';
      const WHITE = 'FFFFFF';
      const LIGHT_GREY = 'F2F2F2';

      function headerStyle(ws, row) {
        row.eachCell(cell => {
          cell.font = { bold: true, color: { argb: WHITE } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
          cell.alignment = { horizontal: 'center' };
          cell.border = {
            bottom: { style: 'thin', color: { argb: '000000' } },
          };
        });
      }

      // ─ Sheet 1: Summary ─
      const summary = wb.addWorksheet('VAT Schedule Summary');
      summary.columns = [
        { key: 'label', width: 35 },
        { key: 'value', width: 28 },
      ];
      const sumTitle = summary.addRow(['AME VAT Schedule — Input Tax Summary', '']);
      sumTitle.font = { bold: true, size: 13, color: { argb: NAVY } };
      summary.mergeCells('A1:B1');
      summary.addRow([]);
      summary.addRow(['Client', client?.name || clientId]);
      summary.addRow(['VAT Number', client?.vat_number || 'N/A']);
      summary.addRow(['Period', period]);
      const pd = getPeriodDates(period);
      summary.addRow(['Period Start', pd.start]);
      summary.addRow(['Period End', pd.end]);
      summary.addRow([]);
      const hdr = summary.addRow(['Description', 'Amount (ZAR)']);
      headerStyle(summary, hdr);

      const totalExcl = approved.reduce((s, r) => s + (Number(r.total_excl_vat) || 0), 0);
      const totalVat = approved.reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);
      const totalIncl = approved.reduce((s, r) => s + (Number(r.total_incl_vat) || 0), 0);
      const stdVat = approved.filter(r => r.vat_type === 'standard').reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);
      const capVat = approved.filter(r => r.vat_type === 'capital').reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);

      const fmt = v => Number(v.toFixed(2));
      summary.addRow(['Total Receipts', receipts.length]);
      summary.addRow(['Approved Receipts', approved.length]);
      summary.addRow(['Pending / Unreviewed', receipts.filter(r => r.status === 'pending').length]);
      summary.addRow([]);
      summary.addRow(['Total Purchases (Excl VAT) — Field 14', fmt(totalExcl)]);
      summary.addRow(['Input VAT — Standard Rated — Field 15', fmt(stdVat)]);
      summary.addRow(['Input VAT — Capital Goods — Field 16', fmt(capVat)]);
      const totRow = summary.addRow(['Total Input VAT Claimable', fmt(totalVat)]);
      totRow.font = { bold: true };
      totRow.getCell(2).font = { bold: true, color: { argb: '27AE60' } };
      summary.addRow(['Total Purchases (Incl VAT)', fmt(totalIncl)]);

      // Number format column B
      summary.getColumn('B').numFmt = '#,##0.00';

      // ─ Sheet 2: Receipt Detail ─
      const detail = wb.addWorksheet('Receipt Detail');
      detail.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Supplier', key: 'supplier', width: 32 },
        { header: 'Supplier VAT No.', key: 'vatNo', width: 18 },
        { header: 'Invoice No.', key: 'invoiceNo', width: 18 },
        { header: 'Category', key: 'category', width: 18 },
        { header: 'VAT Type', key: 'vatType', width: 12 },
        { header: 'Excl VAT', key: 'excl', width: 14 },
        { header: 'VAT Amount', key: 'vat', width: 14 },
        { header: 'Incl VAT', key: 'incl', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Flags', key: 'flags', width: 30 },
      ];
      headerStyle(detail, detail.getRow(1));

      receipts.forEach((r, idx) => {
        const row = detail.addRow({
          date: r.invoice_date || '',
          supplier: r.supplier_name || '',
          vatNo: r.supplier_vat_number || '',
          invoiceNo: r.invoice_number || '',
          category: r.expense_category || '',
          vatType: r.vat_type || '',
          excl: Number(r.total_excl_vat) || 0,
          vat: Number(r.vat_amount) || 0,
          incl: Number(r.total_incl_vat) || 0,
          status: r.status,
          flags: (() => { try { return JSON.parse(r.flags || '[]').join(', '); } catch { return ''; } })(),
        });
        if (idx % 2 === 1) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREY } };
          });
        }
        // Colour status cell
        const statusCell = row.getCell('status');
        const colours = { approved: '27AE60', rejected: 'E74C3C', pending: 'F39C12', query: '3498DB' };
        if (colours[r.status]) {
          statusCell.font = { bold: true, color: { argb: colours[r.status] } };
        }
      });

      // Totals row
      const totDetail = detail.addRow({
        date: '', supplier: 'TOTALS', vatNo: '', invoiceNo: '', category: '', vatType: '',
        excl: fmt(totalExcl), vat: fmt(totalVat), incl: fmt(totalIncl), status: '', flags: '',
      });
      totDetail.font = { bold: true };
      totDetail.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D6EAF8' } };

      ['excl', 'vat', 'incl'].forEach(k => {
        detail.getColumn(k).numFmt = '#,##0.00';
      });

      // Save file
      const saveResult = await dialog.showSaveDialog(win, {
        title: 'Export VAT Schedule',
        defaultPath: `VAT_Schedule_${(client?.name || clientId).replace(/[/\\?%*:|"<>]/g, '_')}_${period}.xlsx`,
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
      });
      if (saveResult.canceled || !saveResult.filePath) return { success: false, cancelled: true };
      await wb.xlsx.writeFile(saveResult.filePath);
      return { success: true, filePath: saveResult.filePath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
}

// ── Auto-match helper ────────────────────────────────────────────────────────

/**
 * Try to auto-match unmatched bank transactions to unreconciled receipts
 * by amount (within R1 tolerance) and date (within 2 days).
 */
function autoMatchTransactions(database, clientId) {
  const unmatched = database.getAll(
    'SELECT * FROM vat_bank_transactions WHERE client_id = ? AND is_matched = 0',
    [clientId]
  );
  const unreconciled = database.getAll(
    `SELECT * FROM vat_receipts WHERE client_id = ? AND is_reconciled = 0 AND status != 'rejected'`,
    [clientId]
  );

  for (const txn of unmatched) {
    const txnAmt = Math.abs(Number(txn.amount));
    const txnDate = new Date(txn.txn_date);
    if (isNaN(txnDate)) continue;

    for (const receipt of unreconciled) {
      const rAmt = Number(receipt.total_incl_vat);
      const rDate = new Date(receipt.invoice_date);
      if (isNaN(rDate)) continue;
      const dayDiff = Math.abs((txnDate - rDate) / (1000 * 60 * 60 * 24));
      if (Math.abs(txnAmt - rAmt) <= 1 && dayDiff <= 2) {
        database.run(
          'UPDATE vat_bank_transactions SET matched_receipt_id = ?, is_matched = 1 WHERE id = ?',
          [receipt.id, txn.id]
        );
        database.run(
          'UPDATE vat_receipts SET bank_transaction_id = ?, is_reconciled = 1 WHERE id = ?',
          [txn.id, receipt.id]
        );
        break;
      }
    }
  }
}
