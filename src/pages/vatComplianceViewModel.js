function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function toZAR(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

const OVERRIDE_TYPE_DEFINITIONS = {
  supply_type: {
    label: 'Supply type',
    kind: 'enum',
    documentTypes: ['purchase_receipt', 'sales_invoice'],
    values: {
      standard: 'Standard',
      zero: 'Zero',
      exempt: 'Exempt',
    },
  },
  duplicate_status: {
    label: 'Duplicate status',
    kind: 'enum',
    documentTypes: ['purchase_receipt', 'sales_invoice'],
    values: {
      clear: 'Clear',
      probable: 'Probable',
      duplicate: 'Duplicate',
      suspected: 'Suspected',
      exact: 'Exact',
    },
  },
  input_tax_block: {
    label: 'Input tax block',
    kind: 'enum',
    documentTypes: ['purchase_receipt'],
    values: {
      blocked: 'Blocked',
      allowed: 'Allowed',
    },
  },
  claimable_vat_amount: {
    label: 'Claimable VAT amount',
    kind: 'number',
    documentTypes: ['purchase_receipt'],
  },
  output_vat_amount: {
    label: 'Output VAT amount',
    kind: 'number',
    documentTypes: ['sales_invoice'],
  },
};

function getOverrideDefinition(overrideType) {
  return OVERRIDE_TYPE_DEFINITIONS[overrideType] || null;
}

function formatOverrideValue(overrideType, value) {
  const definition = getOverrideDefinition(overrideType);
  if (!definition) return String(value ?? '—');
  if (definition.kind === 'number') return toZAR(value);
  return definition.values?.[value] || String(value ?? '—');
}

function titleCaseWords(value) {
  return String(value || '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatHistoryTitle(overrideType, eventType) {
  const label = getOverrideDefinition(overrideType)?.label || titleCaseWords(overrideType);
  if (eventType === 'clear') return `${label} cleared`;
  if (eventType === 'update') return `${label} changed`;
  return `${label} added`;
}

export function getAllowedOverrideTypes(documentType) {
  return Object.entries(OVERRIDE_TYPE_DEFINITIONS)
    .filter(([, definition]) => definition.documentTypes.includes(documentType))
    .map(([value, definition]) => ({
      value,
      label: definition.label,
      kind: definition.kind,
      options: definition.values
        ? Object.entries(definition.values).map(([optionValue, optionLabel]) => ({
          value: optionValue,
          label: optionLabel,
        }))
        : [],
    }));
}

export function groupFindingsBySeverity(findings = []) {
  return findings.reduce((groups, finding) => {
    const severity = String(finding?.severity || 'advisory').toLowerCase();
    if (severity === 'critical') {
      groups.critical.push(finding);
    } else if (severity === 'warning') {
      groups.warning.push(finding);
    } else {
      groups.advisory.push(finding);
    }
    return groups;
  }, {
    critical: [],
    warning: [],
    advisory: [],
  });
}

export function getComplianceTone(score = 0, criticalCount = 0) {
  if (criticalCount > 0) {
    return {
      level: 'critical',
      label: 'Critical review needed',
      badgeClass: 'bg-rose-100 text-rose-700',
      panelClass: 'border-rose-200 bg-rose-50',
    };
  }

  if (Number(score) < 70) {
    return {
      level: 'warning',
      label: 'Review recommended',
      badgeClass: 'bg-amber-100 text-amber-700',
      panelClass: 'border-amber-200 bg-amber-50',
    };
  }

  return {
    level: 'good',
    label: 'Advisory-first clear',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    panelClass: 'border-emerald-200 bg-emerald-50',
  };
}

export function getSalesInvoiceDraft(clientId) {
  return {
    client_id: clientId,
    document_type: 'tax_invoice',
    status: 'pending',
    invoice_date: todayIsoDate(),
    invoice_number: '',
    customer_name: '',
    customer_vat_number: '',
    customer_address: '',
    total_excl_vat: 0,
    vat_amount: 0,
    total_incl_vat: 0,
    review_notes: '',
    line_items: [],
  };
}

export function validateOverrideDraft(draft = {}) {
  const errors = {};
  const overrideType = String(draft.overrideType || draft.override_type || '').trim();
  const definition = getOverrideDefinition(overrideType);
  const value = draft.value ?? draft.overrideValue ?? draft.override_value;
  const reason = String(draft.reason || '').trim();

  if (!definition) {
    errors.overrideType = 'Select an override type.';
  }

  if (!reason) {
    errors.reason = 'Reason is required.';
  }

  if (definition?.kind === 'number') {
    if (value == null || String(value).trim() === '') {
      errors.value = 'Value is required.';
    } else if (!Number.isFinite(Number(value)) || Number(value) < 0) {
      errors.value = 'Enter a valid non-negative amount.';
    }
  } else if (definition?.kind === 'enum' && !String(value || '').trim()) {
    errors.value = 'Value is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatActiveOverride(override = {}) {
  const overrideType = override.override_type || override.overrideType;
  const value = override.override_value ?? override.overrideValue ?? override.override_value_json;

  return {
    label: getOverrideDefinition(overrideType)?.label || titleCaseWords(overrideType),
    value: formatOverrideValue(overrideType, value),
    reason: override.reason || 'No reason recorded.',
    meta: override.created_by || override.createdBy || 'Practitioner',
    timestamp: override.created_at || override.createdAt || null,
  };
}

export function formatOverrideHistoryEntry(entry = {}) {
  const overrideType = entry.override_type || entry.overrideType;
  const previousValue = entry.previous_value ?? entry.previousValue;
  const nextValue = entry.next_value ?? entry.nextValue;
  const eventType = entry.event_type || entry.eventType || 'create';

  const description = eventType === 'clear'
    ? `${formatOverrideValue(overrideType, previousValue)} -> Engine result`
    : previousValue == null
      ? `Set to ${formatOverrideValue(overrideType, nextValue)}`
      : `${formatOverrideValue(overrideType, previousValue)} -> ${formatOverrideValue(overrideType, nextValue)}`;

  return {
    title: formatHistoryTitle(overrideType, eventType),
    description,
    reason: entry.reason || 'No reason recorded.',
    meta: entry.actor || 'Practitioner',
    timestamp: entry.created_at || entry.createdAt || null,
  };
}

export function getOverrideApprovalNote(status) {
  if (status === 'approved') {
    return 'Approved overrides already flow into VAT totals and VAT201 outputs.';
  }
  return 'Overrides update the effective review outcome now and affect VAT totals only after approval.';
}
