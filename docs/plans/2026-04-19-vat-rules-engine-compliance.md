# VAT Rules Engine and Compliance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full South African VAT rules engine, compliance scoring, a separate sales-invoice workflow, and VAT201-ready period summaries to the current Electron VAT app.

**Architecture:** Keep legal and compliance logic in pure Electron services backed by SQLite, then expose the evaluated results through narrow IPC handlers to the existing React VAT pages. Preserve the current purchase-side `vat_receipts` flow, add a parallel `vat_sales_invoices` workflow, and aggregate both into persisted period summaries and VAT201 preview data.

**Tech Stack:** Electron IPC, better-sqlite3, React 18, Vite, Tailwind, Node built-in test runner (`node --test`), JavaScript ES modules, ExcelJS for existing export flows.

---

## Preflight

- Create a dedicated worktree from `main` before implementation.
- Current live `main` is ahead at `a17468d` with the VAT practice dashboard already merged.
- Smart reminders are on `codex/vat-smart-reminders` at `c2d9f81`. If reminder integration is still desired for this feature, merge or cherry-pick that branch into the execution worktree before Task 9.
- If `C:\Users\HP\Accounting-Pro-A.M.E\node_modules\.bin\electron-vite.cmd` is missing, run `npm.cmd install` before build verification.
- Use `@test-driven-development` for every code task.
- Use `@verification-before-completion` before claiming the subsystem is complete.
- Do not stage unrelated workspace files such as existing handoff docs, generated `out/`, or other user changes.

### Task 1: Add the compliance schema foundation

**Files:**
- Modify: `electron/services/database.js`
- Create: `tests/electron/vat-compliance-schema.test.js`

**Step 1: Write the failing test**

Create a schema test that locks the new compliance tables and client VAT settings.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { ensureVatComplianceSchema } from '../../electron/services/database.js';

test('ensureVatComplianceSchema creates compliance tables and client VAT settings columns', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      vat_number TEXT
    );
    CREATE TABLE vat_receipts (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      invoice_date TEXT,
      vat_period TEXT,
      status TEXT
    );
  `);

  ensureVatComplianceSchema(db);

  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name
  `).all().map(row => row.name);
  const clientColumns = db.prepare(`PRAGMA table_info('clients')`).all().map(row => row.name);

  assert.ok(tables.includes('vat_sales_invoices'));
  assert.ok(tables.includes('vat_rule_results'));
  assert.ok(tables.includes('vat_period_summaries'));
  assert.ok(clientColumns.includes('vat_category'));
  assert.ok(clientColumns.includes('vat_registered'));
  assert.ok(clientColumns.includes('has_mixed_supplies'));
  assert.ok(clientColumns.includes('apportionment_ratio'));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none tests/electron/vat-compliance-schema.test.js`

Expected: FAIL because `ensureVatComplianceSchema` is not exported yet.

**Step 3: Write minimal implementation**

In `electron/services/database.js`:

- export a new `ensureVatComplianceSchema(database = getDb())` helper
- create:
  - `vat_sales_invoices`
  - `vat_rule_results`
  - `vat_period_summaries`
- add client VAT setting columns if missing:
  - `vat_category`
  - `vat_registered`
  - `has_mixed_supplies`
  - `apportionment_ratio`
  - `penalty_interest_rate`
- call `ensureVatComplianceSchema(db)` during initialization after the core schema runs

Use SQL along these lines:

```js
database.exec(`
  CREATE TABLE IF NOT EXISTS vat_sales_invoices (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id),
    document_type TEXT DEFAULT 'tax_invoice',
    customer_name TEXT,
    customer_vat_number TEXT,
    customer_address TEXT,
    invoice_number TEXT,
    invoice_date TEXT,
    payment_date TEXT,
    total_incl_vat REAL DEFAULT 0,
    vat_amount REAL DEFAULT 0,
    total_excl_vat REAL DEFAULT 0,
    supply_type TEXT,
    supply_type_reason TEXT,
    time_of_supply_date TEXT,
    time_of_supply_reason TEXT,
    duplicate_status TEXT DEFAULT 'clear',
    compliance_score REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    review_notes TEXT,
    rules_version TEXT,
    rules_evaluated_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
```

**Step 4: Run test to verify it passes**

Run: `node --test --test-isolation=none tests/electron/vat-compliance-schema.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add electron/services/database.js tests/electron/vat-compliance-schema.test.js
git commit -m "feat(vat): add compliance schema foundation"
```

### Task 2: Create the pure rules engine core for Section 20, Section 21, and supply classification

**Files:**
- Create: `electron/services/vat-rules-engine.js`
- Create: `tests/electron/vat-rules-engine.test.js`

**Step 1: Write the failing test**

Add core rules-engine tests for purchase invoices, adjustment notes, and classification.

```js
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
    lineItems: [{ description: 'Office chairs', quantity: 2, totalExcl: 5000, vatAmount: 750, totalIncl: 5750 }],
  });

  assert.equal(result.summary.documentKind, 'full_tax_invoice');
  assert.ok(result.findings.some(f => f.ruleKey === 'section20_recipient_name' && f.severity === 'critical'));
  assert.ok(result.findings.some(f => f.ruleKey === 'section20_recipient_vat_number' && f.severity === 'critical'));
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
    lineItems: [{ description: 'Returned stock', quantity: 1, totalExcl: 1000, vatAmount: 150, totalIncl: 1150 }],
  });

  assert.ok(result.findings.some(f => f.ruleKey === 'section21_original_invoice_reference' && f.severity === 'critical'));
});

test('evaluateVatDocument classifies brown bread as zero rated with a reason', () => {
  const result = evaluateVatDocument({
    documentTable: 'vat_sales_invoices',
    direction: 'sale',
    documentType: 'tax_invoice',
    totalInclVat: 1000,
    invoiceNumber: 'INV-200',
    invoiceDate: '2026-04-18',
    lineItems: [{ description: 'Brown bread loaves', quantity: 10, totalExcl: 1000, vatAmount: 0, totalIncl: 1000 }],
  });

  assert.equal(result.summary.supplyType, 'zero');
  assert.match(result.summary.supplyTypeReason, /brown bread/i);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none tests/electron/vat-rules-engine.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

**Step 3: Write minimal implementation**

Create `electron/services/vat-rules-engine.js` with a pure entry point:

```js
export function evaluateVatDocument(input) {
  const normalized = normalizeVatDocument(input);
  const findings = [
    ...validateSection20(normalized),
    ...validateSection21(normalized),
  ];
  const classification = classifySupply(normalized);

  return {
    summary: {
      documentKind: normalized.documentKind,
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
```

Also implement:

- `normalizeVatDocument(input)`
- `validateSection20(document)`
- `validateSection21(document)`
- `classifySupply(document)`

Keep the first version pure and database-free.

**Step 4: Run test to verify it passes**

Run: `node --test --test-isolation=none tests/electron/vat-rules-engine.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add electron/services/vat-rules-engine.js tests/electron/vat-rules-engine.test.js
git commit -m "feat(vat): add core rules engine validation"
```

### Task 3: Add blockers, time of supply, apportionment, duplicate detection, penalty risk, and compliance scoring

**Files:**
- Modify: `electron/services/vat-rules-engine.js`
- Modify: `tests/electron/vat-rules-engine.test.js`

**Step 1: Write the failing tests**

Add tests for the advanced rules and scoring.

```js
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
    lineItems: [{ description: 'Client dinner entertainment', quantity: 1, totalExcl: 1000, vatAmount: 150, totalIncl: 1150 }],
  });

  assert.equal(result.summary.blockedInputAmount, 150);
  assert.ok(result.findings.some(f => f.ruleKey === 'section17_entertainment_block'));
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
    lineItems: [{ description: 'Shared admin costs', quantity: 1, totalExcl: 1000, vatAmount: 150, totalIncl: 1150 }],
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
    lineItems: [{ description: 'Consulting fee', quantity: 1, totalExcl: 2000, vatAmount: 300, totalIncl: 2300 }],
  });

  assert.ok(result.findings.some(f => f.ruleKey === 'time_of_supply_period_conflict'));
  assert.equal(result.summary.timeOfSupplyDate, '2026-03-30');
});
```

**Step 2: Run tests to verify they fail**

Run: `node --test --test-isolation=none tests/electron/vat-rules-engine.test.js`

Expected: FAIL because the new fields and findings are not implemented yet.

**Step 3: Write minimal implementation**

Extend `electron/services/vat-rules-engine.js` with:

- `checkInputTaxBlocks(document)`
- `calculateTimeOfSupply(document)`
- `calculateApportionment(document, clientSettings)`
- `detectDuplicateStatus(document, context)`
- `calculatePenaltyRisk(periodContext)`
- `scoreCompliance(findings)`

Make `evaluateVatDocument()` return:

```js
return {
  summary: {
    complianceScore,
    supplyType,
    blockedInputAmount,
    apportionedInputAmount,
    nonClaimableApportionmentAmount,
    timeOfSupplyDate,
    duplicateStatus,
  },
  findings,
  computed: {
    supplyType,
    timeOfSupplyDate,
    blockedInputAmount,
    apportionedInputAmount,
  },
  advisories,
};
```

**Step 4: Run tests to verify they pass**

Run: `node --test --test-isolation=none tests/electron/vat-rules-engine.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add electron/services/vat-rules-engine.js tests/electron/vat-rules-engine.test.js
git commit -m "feat(vat): add advanced compliance rules"
```

### Task 4: Build the period summary and VAT201 mapping service

**Files:**
- Create: `electron/services/vat-period-summary.js`
- Create: `tests/electron/vat-period-summary.test.js`
- Modify: `electron/services/vat-rules-engine.js`

**Step 1: Write the failing test**

Create a period-summary test that combines purchases and sales into VAT201-ready totals.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVatPeriodSummary } from '../../electron/services/vat-period-summary.js';

test('buildVatPeriodSummary maps purchases and sales into VAT201 totals', () => {
  const summary = buildVatPeriodSummary({
    clientId: 'client-1',
    period: '2026-03',
    purchases: [
      {
        id: 'p1',
        status: 'approved',
        summary: { blockedInputAmount: 0, apportionedInputAmount: 150, duplicateStatus: 'clear' },
        computed: { vat201: { inputTax: 150, capitalInputTax: 0 } },
      },
    ],
    sales: [
      {
        id: 's1',
        status: 'approved',
        summary: { duplicateStatus: 'clear' },
        computed: { vat201: { standardRatedSuppliesExclVat: 2000, outputTax: 300 } },
      },
    ],
  });

  assert.equal(summary.vat201.field1, 2000);
  assert.equal(summary.vat201.field1a, 300);
  assert.equal(summary.vat201.field12, 150);
  assert.equal(summary.netVat, 150);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none tests/electron/vat-period-summary.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

**Step 3: Write minimal implementation**

Create `electron/services/vat-period-summary.js` with:

- `buildVatPeriodSummary({ clientId, period, purchases, sales, clientSettings, now })`
- `toVat201Fields(summary)`

The summary should compute:

- output VAT totals
- input VAT totals
- blocked input totals
- apportioned totals
- duplicate exclusions
- compliance score
- estimated penalty risk
- VAT201 field map

Use a deterministic output shape:

```js
return {
  clientId,
  period,
  vat201: {
    field1,
    field1a,
    field2,
    field3,
    field12,
    field13,
  },
  totals: {
    outputVat,
    inputVat,
    blockedInputVat,
    apportionedInputVat,
  },
  netVat,
  complianceScore,
  penaltyRisk,
};
```

**Step 4: Run test to verify it passes**

Run: `node --test --test-isolation=none tests/electron/vat-period-summary.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add electron/services/vat-period-summary.js tests/electron/vat-period-summary.test.js electron/services/vat-rules-engine.js
git commit -m "feat(vat): add period summary and vat201 mapping"
```

### Task 5: Wire purchase receipts into persisted compliance results

**Files:**
- Modify: `electron/ipc/vat-handlers.js`
- Modify: `electron/preload.js`
- Modify: `electron/services/database.js`
- Create: `tests/electron/vat-receipt-compliance-handlers.test.js`

**Step 1: Write the failing test**

Add a handler-level test that ensures saving a purchase receipt persists compliance outputs.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import registerVatHandlers from '../../electron/ipc/vat-handlers.js';

test('vat:receipt:save persists compliance score and rule results', async () => {
  const inserts = [];
  const fakeDb = {
    insert(table, row) { inserts.push({ table, row }); },
    run() {},
    getOne() { return null; },
    getAll() { return []; },
  };
  const fakeIpc = { handlers: {}, handle(name, fn) { this.handlers[name] = fn; } };

  registerVatHandlers(fakeIpc, { database: fakeDb, keychain: {} });
  const result = await fakeIpc.handlers['vat:receipt:save']({}, {
    client_id: 'client-1',
    supplier_name: 'ABC Suppliers',
    supplier_vat_number: '4123456789',
    invoice_number: 'INV-1',
    invoice_date: '2026-04-18',
    total_excl_vat: 1000,
    vat_amount: 150,
    total_incl_vat: 1150,
  });

  assert.equal(result.success, true);
  assert.ok(inserts.some(x => x.table === 'vat_receipts' && typeof x.row.compliance_score === 'number'));
  assert.ok(inserts.some(x => x.table === 'vat_rule_results'));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none tests/electron/vat-receipt-compliance-handlers.test.js`

Expected: FAIL because `vat:receipt:save` does not persist compliance results yet.

**Step 3: Write minimal implementation**

In `electron/ipc/vat-handlers.js`:

- evaluate purchase documents during:
  - `vat:receipt:save`
  - `vat:receipt:extract`
- persist:
  - `compliance_score`
  - summary compliance fields on `vat_receipts`
  - normalized rows in `vat_rule_results`
- add `vat:receipt:compliance:get(id)` to fetch receipt + findings together

In `electron/preload.js`, expose:

```js
vatGetReceiptCompliance: (id) => ipcRenderer.invoke('vat:receipt:compliance:get', id),
```

**Step 4: Run test to verify it passes**

Run: `node --test --test-isolation=none tests/electron/vat-receipt-compliance-handlers.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add electron/ipc/vat-handlers.js electron/preload.js electron/services/database.js tests/electron/vat-receipt-compliance-handlers.test.js
git commit -m "feat(vat): persist purchase compliance results"
```

### Task 6: Add the sales-invoice backend and shared aggregation hooks

**Files:**
- Modify: `electron/ipc/vat-handlers.js`
- Modify: `electron/preload.js`
- Modify: `electron/services/database.js`
- Create: `tests/electron/vat-sales-handlers.test.js`

**Step 1: Write the failing test**

Add a backend test for sales-invoice CRUD and period-summary inclusion.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import registerVatHandlers from '../../electron/ipc/vat-handlers.js';

test('vat:sales:save stores a sales invoice and includes it in the period summary', async () => {
  const rows = { sales: [] };
  const fakeDb = {
    insert(table, row) {
      if (table === 'vat_sales_invoices') rows.sales.push(row);
      if (table === 'vat_rule_results') return;
    },
    run() {},
    getOne(sql) {
      if (sql.includes('FROM vat_period_summaries')) return null;
      return null;
    },
    getAll(sql) {
      if (sql.includes('FROM vat_sales_invoices')) return rows.sales;
      return [];
    },
  };
  const fakeIpc = { handlers: {}, handle(name, fn) { this.handlers[name] = fn; } };

  registerVatHandlers(fakeIpc, { database: fakeDb, keychain: {} });
  const save = await fakeIpc.handlers['vat:sales:save']({}, {
    client_id: 'client-1',
    customer_name: 'Customer A',
    invoice_number: 'SALE-1',
    invoice_date: '2026-04-18',
    total_excl_vat: 2000,
    vat_amount: 300,
    total_incl_vat: 2300,
  });

  assert.equal(save.success, true);
  assert.equal(rows.sales.length, 1);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none tests/electron/vat-sales-handlers.test.js`

Expected: FAIL because sales handlers are not registered yet.

**Step 3: Write minimal implementation**

In `electron/ipc/vat-handlers.js`, add:

- `vat:sales:list`
- `vat:sales:get`
- `vat:sales:save`
- `vat:sales:delete`
- `vat:sales:update-status`

All saves should:

- derive `vat_period`
- evaluate the document through `evaluateVatDocument()`
- persist `vat_rule_results`
- update or invalidate the relevant period summary

Expose in `electron/preload.js`:

```js
vatListSales: (clientId, filters) => ipcRenderer.invoke('vat:sales:list', clientId, filters),
vatGetSalesInvoice: (id) => ipcRenderer.invoke('vat:sales:get', id),
vatSaveSalesInvoice: (data) => ipcRenderer.invoke('vat:sales:save', data),
vatDeleteSalesInvoice: (id) => ipcRenderer.invoke('vat:sales:delete', id),
vatUpdateSalesInvoiceStatus: (id, status, notes) => ipcRenderer.invoke('vat:sales:update-status', id, status, notes),
```

**Step 4: Run test to verify it passes**

Run: `node --test --test-isolation=none tests/electron/vat-sales-handlers.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add electron/ipc/vat-handlers.js electron/preload.js electron/services/database.js tests/electron/vat-sales-handlers.test.js
git commit -m "feat(vat): add sales invoice backend"
```

### Task 7: Add renderer helpers, upgrade VAT Capture, and create the sales page

**Files:**
- Create: `src/pages/VATSales.jsx`
- Create: `src/pages/vatComplianceViewModel.js`
- Create: `tests/src/pages/vat-compliance-view-model.test.js`
- Modify: `src/pages/VATCapture.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/layout/Sidebar.jsx`

**Step 1: Write the failing test**

Add a renderer-side helper test for compliance grouping and sales action defaults.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  groupFindingsBySeverity,
  getComplianceTone,
  getSalesInvoiceDraft,
} from '../../../src/pages/vatComplianceViewModel.js';

test('groupFindingsBySeverity groups critical, warning, and advisory findings', () => {
  const grouped = groupFindingsBySeverity([
    { ruleKey: 'a', severity: 'warning' },
    { ruleKey: 'b', severity: 'critical' },
    { ruleKey: 'c', severity: 'advisory' },
  ]);

  assert.deepEqual(grouped.critical.map(x => x.ruleKey), ['b']);
  assert.deepEqual(grouped.warning.map(x => x.ruleKey), ['a']);
  assert.deepEqual(grouped.advisory.map(x => x.ruleKey), ['c']);
});

test('getSalesInvoiceDraft returns a tax-invoice sales skeleton', () => {
  const draft = getSalesInvoiceDraft('client-1');
  assert.equal(draft.client_id, 'client-1');
  assert.equal(draft.document_type, 'tax_invoice');
  assert.equal(draft.status, 'pending');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none tests/src/pages/vat-compliance-view-model.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

**Step 3: Write minimal implementation**

Create `src/pages/vatComplianceViewModel.js` with:

- `groupFindingsBySeverity(findings)`
- `getComplianceTone(score, criticalCount)`
- `getSalesInvoiceDraft(clientId)`

Then update the UI:

- `src/pages/VATCapture.jsx`
  - add a compliance panel to the receipt detail area
  - show compliance score, grouped findings, blocked/apportioned amounts, duplicate status, and time-of-supply output
- `src/pages/VATSales.jsx`
  - add list + detail review flow for sales invoices
  - use the same visual language as VAT Capture where possible
- `src/App.jsx`
  - register `/vat-sales`
- `src/components/layout/Sidebar.jsx`
  - add a VAT Sales entry

**Step 4: Run tests and build**

Run: `node --test --test-isolation=none tests/src/pages/vat-compliance-view-model.test.js`

Expected: PASS

Run: `npm.cmd run build`

Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/VATSales.jsx src/pages/vatComplianceViewModel.js tests/src/pages/vat-compliance-view-model.test.js src/pages/VATCapture.jsx src/App.jsx src/components/layout/Sidebar.jsx
git commit -m "feat(vat): add compliance ui and sales workflow"
```

### Task 8: Extend the practice dashboard and add VAT201 preview access

**Files:**
- Create: `src/pages/VAT201Preview.jsx`
- Create: `tests/electron/vat-compliance-dashboard.test.js`
- Modify: `electron/ipc/vat-handlers.js`
- Modify: `electron/preload.js`
- Modify: `src/pages/VATDashboard.jsx`
- Modify: `src/App.jsx`

**Step 1: Write the failing test**

Add a dashboard handler test that expects compliance and VAT201 summary data.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import registerVatHandlers from '../../electron/ipc/vat-handlers.js';

test('vat:dashboard:get includes compliance score and penalty risk from period summaries', async () => {
  const fakeDb = {
    getAll() { return []; },
    getOne(sql) {
      if (sql.includes('FROM vat_period_summaries')) {
        return {
          compliance_score: 82,
          penalty_risk_amount: 450,
          blocked_input_vat: 150,
          apportioned_input_vat: 90,
        };
      }
      return null;
    },
  };
  const fakeIpc = { handlers: {}, handle(name, fn) { this.handlers[name] = fn; } };

  registerVatHandlers(fakeIpc, { database: fakeDb, keychain: {}, now: new Date('2026-04-26T10:00:00Z') });
  const result = await fakeIpc.handlers['vat:dashboard:get']({}, '2026-03');

  assert.ok('averageComplianceScore' in result.summary);
  assert.ok('totalPenaltyRisk' in result.summary);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none tests/electron/vat-compliance-dashboard.test.js`

Expected: FAIL because the dashboard does not read period summaries yet.

**Step 3: Write minimal implementation**

In `electron/ipc/vat-handlers.js`:

- extend `vat:dashboard:get` to read `vat_period_summaries`
- add `vat:period-summary:get(clientId, period)`

In `electron/preload.js`, expose:

```js
vatGetPeriodSummary: (clientId, period) => ipcRenderer.invoke('vat:period-summary:get', clientId, period),
```

In the renderer:

- upgrade `src/pages/VATDashboard.jsx` with compliance-score and penalty-risk summary cards
- add a link into `src/pages/VAT201Preview.jsx`
- register `/vat-vat201-preview` or `/vat201-preview` in `src/App.jsx`

**Step 4: Run tests and build**

Run: `node --test --test-isolation=none tests/electron/vat-compliance-dashboard.test.js`

Expected: PASS

Run: `npm.cmd run build`

Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/VAT201Preview.jsx tests/electron/vat-compliance-dashboard.test.js electron/ipc/vat-handlers.js electron/preload.js src/pages/VATDashboard.jsx src/App.jsx
git commit -m "feat(vat): add compliance dashboard and vat201 preview"
```

### Task 9: Connect compliance state to reminders and final VAT review flows

**Files:**
- Modify: `electron/services/vat-reminders.js`
- Modify: `tests/electron/vat-reminders.test.js`
- Modify: `src/pages/VATCapture.jsx`
- Modify: `src/pages/VATDashboard.jsx`

**Step 1: Write the failing test**

Add a reminder test for unresolved critical compliance work.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReminderCandidates } from '../../electron/services/vat-reminders.js';

test('buildReminderCandidates returns a compliance-critical reminder when unresolved critical findings exist', () => {
  const reminders = buildReminderCandidates({
    clientId: 'client-1',
    period: '2026-03',
    receipts: [
      {
        id: 'r1',
        status: 'pending',
        flags: '[]',
        compliance_score: 35,
        critical_finding_count: 2,
        updated_at: '2026-04-24T08:00:00Z',
      },
    ],
    schedule: null,
    reminderStateRows: [],
    now: new Date('2026-04-26T10:00:00Z'),
    closingDays: 7,
  });

  assert.ok(reminders.some(r => r.ruleKey === 'critical_compliance_findings'));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test --test-isolation=none tests/electron/vat-reminders.test.js`

Expected: FAIL because that reminder rule does not exist yet.

**Step 3: Write minimal implementation**

If the execution branch already includes smart reminders:

- extend `electron/services/vat-reminders.js` with rules like:
  - `critical_compliance_findings`
  - `duplicate_documents`
  - `high_penalty_risk`
- map those to existing reminder UI patterns

If smart reminders have not been merged into the execution branch yet, do this first:

```bash
git cherry-pick c2d9f81
```

Then update `src/pages/VATCapture.jsx` and `src/pages/VATDashboard.jsx` to surface the new compliance-driven reminder actions naturally.

**Step 4: Run verification**

Run: `node --test --test-isolation=none tests/electron/vat-reminders.test.js tests/electron/vat-rules-engine.test.js tests/electron/vat-period-summary.test.js tests/electron/vat-sales-handlers.test.js tests/electron/vat-receipt-compliance-handlers.test.js tests/electron/vat-compliance-dashboard.test.js tests/src/pages/vat-compliance-view-model.test.js`

Expected: PASS

Run: `npm.cmd run build`

Expected: PASS

**Step 5: Commit**

```bash
git add electron/services/vat-reminders.js tests/electron/vat-reminders.test.js src/pages/VATCapture.jsx src/pages/VATDashboard.jsx
git commit -m "feat(vat): add compliance-driven reminder workflows"
```

## Manual Verification Checklist

After Task 9, run this smoke test in the app:

1. Open `VAT Capture` and save a purchase invoice missing required full-invoice fields.
2. Confirm the receipt shows critical Section 20 findings and a reduced compliance score.
3. Save a purchase receipt with entertainment keywords and confirm blocked input VAT is shown.
4. Save a mixed-supply purchase document and confirm apportioned claimable VAT is shown.
5. Open `VAT Sales`, save a standard-rated sales invoice, and confirm output VAT treatment is calculated.
6. Save a credit note without an original invoice reference and confirm Section 21 findings appear.
7. Open the VAT dashboard and confirm purchase, sales, compliance, and penalty-risk cards populate for the selected period.
8. Open the VAT201 preview and confirm purchase and sales documents drill into field totals correctly.
9. If smart reminders are present on the execution branch, confirm unresolved critical compliance findings create reminder cards and sidebar counts.
10. Export the VAT workbook and confirm totals still reconcile after the new compliance fields are present.

## Implementation Notes

- Keep the rules engine pure. Database writes and IPC shape belong outside `electron/services/vat-rules-engine.js`.
- Prefer new normalized tables over growing the legacy `flags` JSON further.
- Use exact legal references like `S20(4)` or `S17(2)` in stored findings.
- Continue treating currency as ZAR values in the current app's established numeric format unless the team explicitly decides to migrate to cents everywhere.
- Preserve existing VAT dashboard and VAT capture flows where possible; extend them rather than replacing them.

Plan complete and saved to `docs/plans/2026-04-19-vat-rules-engine-compliance.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
