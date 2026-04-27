import crypto from 'crypto';

const OVERRIDE_DEFINITIONS = {
  supply_type: {
    kind: 'enum',
    values: new Set(['standard', 'zero', 'exempt']),
  },
  duplicate_status: {
    kind: 'enum',
    values: new Set(['clear', 'probable', 'duplicate', 'suspected', 'exact']),
  },
  input_tax_block: {
    kind: 'enum',
    values: new Set(['blocked', 'allowed']),
  },
  claimable_vat_amount: {
    kind: 'number',
  },
  output_vat_amount: {
    kind: 'number',
  },
};

const OVERRIDE_PRIORITY = {
  supply_type: 1,
  duplicate_status: 2,
  input_tax_block: 3,
  claimable_vat_amount: 4,
  output_vat_amount: 5,
};

function normalizeRequiredString(value, fieldName) {
  const normalized = value == null ? '' : String(value).trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalized;
}

function normalizeOptionalString(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function roundAmount(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function normalizeOverrideType(value) {
  const overrideType = normalizeRequiredString(value, 'overrideType');
  if (!OVERRIDE_DEFINITIONS[overrideType]) {
    throw new Error(`Unsupported override type: ${overrideType}`);
  }
  return overrideType;
}

function normalizeOverrideValue(overrideType, value) {
  const definition = OVERRIDE_DEFINITIONS[overrideType];
  if (!definition) {
    throw new Error(`Unsupported override type: ${overrideType}`);
  }

  if (definition.kind === 'enum') {
    const normalized = normalizeRequiredString(value, 'override value').toLowerCase();
    if (!definition.values.has(normalized)) {
      throw new Error(`Invalid override value for ${overrideType}.`);
    }
    return normalized;
  }

  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error(`Numeric override values must be valid and non-negative.`);
  }
  return roundAmount(normalized);
}

function parseStoredJson(value) {
  if (value == null || value === '') return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Failed to parse VAT document override JSON.', error);
    return undefined;
  }
}

function serializeOverrideValue(value) {
  return JSON.stringify(value);
}

function getOne(database, sql, params = []) {
  if (typeof database?.getOne === 'function') {
    return database.getOne(sql, params);
  }
  return database.prepare(sql).get(...(Array.isArray(params) ? params : [params]));
}

function getAll(database, sql, params = []) {
  if (typeof database?.getAll === 'function') {
    return database.getAll(sql, params);
  }
  return database.prepare(sql).all(...(Array.isArray(params) ? params : [params]));
}

function run(database, sql, params = []) {
  if (typeof database?.run === 'function') {
    return database.run(sql, params);
  }
  return database.prepare(sql).run(...(Array.isArray(params) ? params : [params]));
}

function insert(database, table, data) {
  if (typeof database?.insert === 'function') {
    const id = database.insert(table, data);
    return data.id || id;
  }

  const id = data.id || crypto.randomUUID();
  const payload = { ...data, id };
  const columns = Object.keys(payload);
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map((column) => payload[column]);
  database.prepare(
    `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
  ).run(...values);
  return id;
}

function readActiveOverride(database, documentType, documentId, overrideType) {
  return getOne(database, `
    SELECT *
    FROM vat_document_overrides
    WHERE document_type = ?
      AND document_id = ?
      AND override_type = ?
      AND cleared_at IS NULL
  `, [documentType, documentId, overrideType]);
}

function toActiveOverride(row) {
  if (!row) return null;
  const overrideValue = parseStoredJson(row.override_value_json);
  return {
    ...row,
    override_value: overrideValue,
  };
}

function toHistoryEntry(row) {
  if (!row) return null;
  return {
    ...row,
    previous_value: parseStoredJson(row.previous_value_json),
    next_value: parseStoredJson(row.next_value_json),
  };
}

function appendHistory(database, {
  documentType,
  documentId,
  overrideType,
  eventType,
  previousValueJson = null,
  nextValueJson = null,
  reason,
  actor = null,
  createdAt,
}) {
  insert(database, 'vat_document_override_history', {
    id: crypto.randomUUID(),
    document_type: documentType,
    document_id: documentId,
    override_type: overrideType,
    event_type: eventType,
    previous_value_json: previousValueJson,
    next_value_json: nextValueJson,
    reason,
    actor,
    created_at: createdAt,
  });
}

function buildSavePayload(payload = {}) {
  const documentType = normalizeRequiredString(
    payload.documentType ?? payload.document_type,
    'documentType'
  );
  const documentId = normalizeRequiredString(payload.documentId ?? payload.document_id, 'documentId');
  const overrideType = normalizeOverrideType(payload.overrideType ?? payload.override_type);
  const reason = normalizeRequiredString(payload.reason, 'Reason');
  const createdBy = normalizeOptionalString(payload.createdBy ?? payload.created_by);
  const createdAt = normalizeOptionalString(payload.createdAt ?? payload.created_at)
    || new Date().toISOString();
  const overrideValue = normalizeOverrideValue(
    overrideType,
    payload.value ?? payload.overrideValue ?? payload.override_value
  );

  return {
    documentType,
    documentId,
    overrideType,
    overrideValue,
    overrideValueJson: serializeOverrideValue(overrideValue),
    reason,
    createdBy,
    createdAt,
  };
}

function buildClearPayload(payload = {}) {
  return {
    documentType: normalizeRequiredString(
      payload.documentType ?? payload.document_type,
      'documentType'
    ),
    documentId: normalizeRequiredString(payload.documentId ?? payload.document_id, 'documentId'),
    overrideType: normalizeOverrideType(payload.overrideType ?? payload.override_type),
    reason: normalizeRequiredString(payload.reason, 'Reason'),
    clearedBy: normalizeOptionalString(payload.clearedBy ?? payload.cleared_by),
    clearedAt: normalizeOptionalString(payload.clearedAt ?? payload.cleared_at)
      || new Date().toISOString(),
  };
}

function createStableVat201(vat201 = {}) {
  return {
    standardRatedSuppliesExclVat: roundAmount(vat201.standardRatedSuppliesExclVat),
    zeroRatedSuppliesExclVat: roundAmount(vat201.zeroRatedSuppliesExclVat),
    exemptSuppliesExclVat: roundAmount(vat201.exemptSuppliesExclVat),
    outputTax: roundAmount(vat201.outputTax),
    inputTax: roundAmount(vat201.inputTax),
    capitalInputTax: roundAmount(vat201.capitalInputTax),
  };
}

function inferDirection(baseEvaluation = {}, effectiveVat201) {
  if (baseEvaluation?.document?.direction) {
    return baseEvaluation.document.direction;
  }

  const hasSalesContribution = (
    effectiveVat201.standardRatedSuppliesExclVat > 0
    || effectiveVat201.zeroRatedSuppliesExclVat > 0
    || effectiveVat201.exemptSuppliesExclVat > 0
    || effectiveVat201.outputTax > 0
  );
  if (hasSalesContribution) return 'sale';
  return 'purchase';
}

function inferTotalExclVat(baseEvaluation = {}, effectiveVat201) {
  if (Number.isFinite(Number(baseEvaluation?.document?.totalExclVat))) {
    return roundAmount(baseEvaluation.document.totalExclVat);
  }

  return roundAmount(
    effectiveVat201.standardRatedSuppliesExclVat
    + effectiveVat201.zeroRatedSuppliesExclVat
    + effectiveVat201.exemptSuppliesExclVat
  );
}

function inferOutputVatAmount(baseEvaluation = {}, effectiveVat201) {
  if (Number.isFinite(Number(baseEvaluation?.document?.vatAmount))) {
    return roundAmount(baseEvaluation.document.vatAmount);
  }
  return roundAmount(effectiveVat201.outputTax);
}

function inferPurchaseVatAmount(baseEvaluation = {}, summary = {}, effectiveVat201) {
  if (Number.isFinite(Number(baseEvaluation?.document?.vatAmount))) {
    return roundAmount(baseEvaluation.document.vatAmount);
  }

  const summaryTotal = (
    Number(summary.blockedInputAmount)
    + Number(summary.apportionedInputAmount)
    + Number(summary.nonClaimableApportionmentAmount)
  );
  if (summaryTotal > 0) {
    return roundAmount(summaryTotal);
  }

  return roundAmount(effectiveVat201.inputTax + effectiveVat201.capitalInputTax);
}

function setPurchaseContribution(effectiveVat201, vatType, amount) {
  const normalized = roundAmount(amount);
  if (vatType === 'capital') {
    effectiveVat201.inputTax = 0;
    effectiveVat201.capitalInputTax = normalized;
    return;
  }

  effectiveVat201.inputTax = normalized;
  effectiveVat201.capitalInputTax = 0;
}

function normalizeOverrideForApply(override, index) {
  const overrideType = override?.overrideType ?? override?.override_type;
  if (!OVERRIDE_DEFINITIONS[overrideType]) return null;

  let overrideValue;
  if (Object.prototype.hasOwnProperty.call(override || {}, 'overrideValue')) {
    overrideValue = override.overrideValue;
  } else if (Object.prototype.hasOwnProperty.call(override || {}, 'override_value')) {
    overrideValue = override.override_value;
  } else {
    overrideValue = parseStoredJson(override?.override_value_json);
  }

  if (overrideValue === undefined) {
    return null;
  }

  try {
    const normalizedValue = normalizeOverrideValue(overrideType, overrideValue);
    return {
      ...override,
      override_type: overrideType,
      override_value: normalizedValue,
      sort_order: OVERRIDE_PRIORITY[overrideType] || 99,
      sort_created_at: override?.created_at ?? override?.createdAt ?? '',
      sort_index: index,
    };
  } catch (error) {
    console.warn('Ignoring invalid VAT document override during apply.', error);
    return null;
  }
}

function sortOverrides(overrides = []) {
  return overrides
    .map(normalizeOverrideForApply)
    .filter(Boolean)
    .sort((left, right) => {
      if (left.sort_order !== right.sort_order) {
        return left.sort_order - right.sort_order;
      }
      if (left.sort_created_at !== right.sort_created_at) {
        return left.sort_created_at.localeCompare(right.sort_created_at);
      }
      if ((left.override_type || '') !== (right.override_type || '')) {
        return String(left.override_type).localeCompare(String(right.override_type));
      }
      return left.sort_index - right.sort_index;
    })
    .map(({ sort_order, sort_created_at, sort_index, ...override }) => override);
}

export function saveDocumentOverride(database, payload) {
  const {
    documentType,
    documentId,
    overrideType,
    overrideValue,
    overrideValueJson,
    reason,
    createdBy,
    createdAt,
  } = buildSavePayload(payload);

  const existing = readActiveOverride(database, documentType, documentId, overrideType);
  if (existing) {
    run(database, `
      UPDATE vat_document_overrides
      SET override_value_json = ?,
          reason = ?,
          created_by = ?,
          created_at = ?,
          cleared_at = NULL,
          cleared_by = NULL
      WHERE id = ?
    `, [overrideValueJson, reason, createdBy, createdAt, existing.id]);

    appendHistory(database, {
      documentType,
      documentId,
      overrideType,
      eventType: 'update',
      previousValueJson: existing.override_value_json,
      nextValueJson: overrideValueJson,
      reason,
      actor: createdBy,
      createdAt,
    });
  } else {
    insert(database, 'vat_document_overrides', {
      id: crypto.randomUUID(),
      document_type: documentType,
      document_id: documentId,
      override_type: overrideType,
      override_value_json: overrideValueJson,
      reason,
      created_by: createdBy,
      created_at: createdAt,
      cleared_at: null,
      cleared_by: null,
    });

    appendHistory(database, {
      documentType,
      documentId,
      overrideType,
      eventType: 'create',
      previousValueJson: null,
      nextValueJson: overrideValueJson,
      reason,
      actor: createdBy,
      createdAt,
    });
  }

  return toActiveOverride(readActiveOverride(database, documentType, documentId, overrideType))
    || {
      document_type: documentType,
      document_id: documentId,
      override_type: overrideType,
      override_value: overrideValue,
      reason,
      created_by: createdBy,
      created_at: createdAt,
    };
}

export function clearDocumentOverride(database, payload) {
  const {
    documentType,
    documentId,
    overrideType,
    reason,
    clearedBy,
    clearedAt,
  } = buildClearPayload(payload);

  const existing = readActiveOverride(database, documentType, documentId, overrideType);
  if (!existing) {
    return null;
  }

  run(database, `
    UPDATE vat_document_overrides
    SET cleared_at = ?,
        cleared_by = ?
    WHERE id = ?
  `, [clearedAt, clearedBy, existing.id]);

  appendHistory(database, {
    documentType,
    documentId,
    overrideType,
    eventType: 'clear',
    previousValueJson: existing.override_value_json,
    nextValueJson: null,
    reason,
    actor: clearedBy,
    createdAt: clearedAt,
  });

  return toActiveOverride(getOne(database, `
    SELECT *
    FROM vat_document_overrides
    WHERE id = ?
  `, [existing.id]));
}

export function getActiveDocumentOverrides(database, documentType, documentId) {
  const normalizedDocumentType = normalizeRequiredString(documentType, 'documentType');
  const normalizedDocumentId = normalizeRequiredString(documentId, 'documentId');
  return getAll(database, `
    SELECT *
    FROM vat_document_overrides
    WHERE document_type = ?
      AND document_id = ?
      AND cleared_at IS NULL
    ORDER BY override_type ASC, created_at ASC, id ASC
  `, [normalizedDocumentType, normalizedDocumentId]).map(toActiveOverride);
}

export function getDocumentOverrideHistory(database, documentType, documentId) {
  const normalizedDocumentType = normalizeRequiredString(documentType, 'documentType');
  const normalizedDocumentId = normalizeRequiredString(documentId, 'documentId');
  return getAll(database, `
    SELECT *
    FROM vat_document_override_history
    WHERE document_type = ?
      AND document_id = ?
    ORDER BY created_at ASC, rowid ASC
  `, [normalizedDocumentType, normalizedDocumentId]).map(toHistoryEntry);
}

export function applyDocumentOverrides(baseEvaluation = {}, overrides = []) {
  const summary = { ...(baseEvaluation.summary || {}) };
  const effectiveVat201 = createStableVat201(baseEvaluation?.computed?.vat201);
  const computed = {
    ...(baseEvaluation.computed || {}),
    vat201: effectiveVat201,
  };
  const activeOverrides = sortOverrides(overrides);
  const direction = inferDirection(baseEvaluation, effectiveVat201);
  const totalExclVat = inferTotalExclVat(baseEvaluation, effectiveVat201);
  const outputVatAmount = inferOutputVatAmount(baseEvaluation, effectiveVat201);
  const purchaseVatAmount = inferPurchaseVatAmount(baseEvaluation, summary, effectiveVat201);
  const vatType = baseEvaluation?.document?.vatType || 'standard';

  for (const override of activeOverrides) {
    const overrideType = override.override_type;
    const overrideValue = override.override_value;

    if (overrideType === 'supply_type') {
      summary.supplyType = overrideValue;
      summary.supplyTypeReason = `Practitioner override set supply type to ${overrideValue}.`;
      computed.supplyType = overrideValue;
      computed.supplyTypeReason = summary.supplyTypeReason;

      if (direction === 'sale') {
        effectiveVat201.standardRatedSuppliesExclVat = 0;
        effectiveVat201.zeroRatedSuppliesExclVat = 0;
        effectiveVat201.exemptSuppliesExclVat = 0;

        if (overrideValue === 'zero') {
          effectiveVat201.zeroRatedSuppliesExclVat = totalExclVat;
          effectiveVat201.outputTax = 0;
        } else if (overrideValue === 'exempt') {
          effectiveVat201.exemptSuppliesExclVat = totalExclVat;
          effectiveVat201.outputTax = 0;
        } else {
          effectiveVat201.standardRatedSuppliesExclVat = totalExclVat;
          effectiveVat201.outputTax = outputVatAmount;
        }
      }
      continue;
    }

    if (overrideType === 'duplicate_status') {
      summary.duplicateStatus = overrideValue;
      computed.duplicateStatus = overrideValue;
      continue;
    }

    if (direction !== 'purchase' && (overrideType === 'input_tax_block' || overrideType === 'claimable_vat_amount')) {
      continue;
    }

    if (direction !== 'sale' && overrideType === 'output_vat_amount') {
      continue;
    }

    if (overrideType === 'input_tax_block') {
      if (overrideValue === 'blocked') {
        summary.blockedInputAmount = purchaseVatAmount;
        summary.apportionedInputAmount = 0;
        summary.nonClaimableApportionmentAmount = 0;
        computed.blockedInputAmount = purchaseVatAmount;
        computed.apportionedInputAmount = 0;
        setPurchaseContribution(effectiveVat201, vatType, 0);
      } else {
        summary.blockedInputAmount = 0;
        summary.apportionedInputAmount = purchaseVatAmount;
        summary.nonClaimableApportionmentAmount = 0;
        computed.blockedInputAmount = 0;
        computed.apportionedInputAmount = purchaseVatAmount;
        setPurchaseContribution(effectiveVat201, vatType, purchaseVatAmount);
      }
      continue;
    }

    if (overrideType === 'claimable_vat_amount') {
      const claimableAmount = roundAmount(overrideValue);
      summary.blockedInputAmount = Math.max(0, roundAmount(purchaseVatAmount - claimableAmount));
      summary.apportionedInputAmount = claimableAmount;
      summary.nonClaimableApportionmentAmount = 0;
      computed.blockedInputAmount = summary.blockedInputAmount;
      computed.apportionedInputAmount = claimableAmount;
      setPurchaseContribution(effectiveVat201, vatType, claimableAmount);
      continue;
    }

    if (overrideType === 'output_vat_amount') {
      effectiveVat201.outputTax = roundAmount(overrideValue);
    }
  }

  return {
    ...baseEvaluation,
    summary,
    computed,
    activeOverrides,
    effectiveVat201: createStableVat201(effectiveVat201),
  };
}
