function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
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
