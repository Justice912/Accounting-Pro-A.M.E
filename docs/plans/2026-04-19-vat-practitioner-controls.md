# VAT Practitioner Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add practitioner-facing VAT controls by exposing client VAT assumptions in Client Manager, adding targeted document overrides for both purchase and sales workflows, and preserving an auditable override history while keeping VAT totals approval-gated.

**Architecture:** Build a small main-process override subsystem next to the existing VAT rules engine. The rules engine continues to produce the base evaluation, a new override service derives the effective evaluation, and the renderer only consumes normalized IPC responses plus small view-model helpers for display logic. This phase is intentionally stacked on top of the current `codex/vat-rules-engine-compliance` branch head.

**Tech Stack:** Electron main-process services, `better-sqlite3`, React 18, Vite, Tailwind, Node built-in test runner (`node --test --test-isolation=none`), JavaScript ES modules.

---

## Implementation Notes

- Work in `C:\Users\HP\Accounting-Pro-A.M.E\.worktrees\vat-practitioner-controls`
- Keep logic out of `VATCapture.jsx` and `VATSales.jsx` except for state wiring and rendering
- Prefer extending the existing test files when the new behavior clearly belongs there
- Use the repo’s current test style: Node tests for services/handlers and small view-model helper tests for renderer logic
- Keep every override change auditable; never mutate or delete history rows
- Keep totals approval-gated all the way through period summary calculations
- Important environment note:
  - Node tests use the Node ABI for `better-sqlite3`
  - Electron preview uses the Electron ABI for `better-sqlite3`
  - If you run a live Electron smoke test with `electron-builder install-app-deps`, rerun `npm.cmd rebuild better-sqlite3` before rerunning Node test suites

### Task 1: Lock the schema for practitioner controls

**Files:**
- Modify: `electron/services/database.js`
- Modify: `tests/electron/vat-compliance-schema.test.js`

**Step 1: Write the failing schema test**

Extend `tests/electron/vat-compliance-schema.test.js` to assert that `ensureVatComplianceSchema` now creates:

- `vat_document_overrides`
- `vat_document_override_history`

Also assert core columns for the new tables such as:

- `document_type`
- `document_id`
- `override_type`
- `override_value_json`
- `reason`
- `created_by`
- `cleared_at`
- `event_type`
- `previous_value_json`
- `next_value_json`

**Step 2: Run test to verify it fails**

Run:

```powershell
node --test --test-isolation=none tests/electron/vat-compliance-schema.test.js
```

Expected: FAIL because the override tables do not exist yet.

**Step 3: Write minimal implementation**

In `electron/services/database.js`:

- extend `ensureVatComplianceSchema(database = getDb())`
- create `vat_document_overrides`
- create `vat_document_override_history`
- add useful indexes such as:
  - `(document_type, document_id)`
  - unique active override key on `(document_type, document_id, override_type)`

Do not add speculative workflow-state tables in this phase.

**Step 4: Run test to verify it passes**

Run:

```powershell
node --test --test-isolation=none tests/electron/vat-compliance-schema.test.js
```

Expected: PASS

**Step 5: Commit**

```powershell
git add electron/services/database.js tests/electron/vat-compliance-schema.test.js
git commit -m "feat(vat): add practitioner override schema"
```

### Task 2: Build the override service and lock its behavior

**Files:**
- Create: `electron/services/vat-document-overrides.js`
- Create: `tests/electron/vat-document-overrides.test.js`

**Step 1: Write the failing service tests**

Create tests for the service behaviors that matter most:

- save an active override with a required reason
- clear an override while preserving history
- reject unknown override types
- reject invalid enum values
- reject negative numeric override values
- apply targeted overrides to a base compliance summary

Use a focused API such as:

```js
saveDocumentOverride(database, payload)
clearDocumentOverride(database, payload)
getActiveDocumentOverrides(database, documentType, documentId)
getDocumentOverrideHistory(database, documentType, documentId)
applyDocumentOverrides(baseEvaluation, overrides)
```

**Step 2: Run tests to verify they fail**

Run:

```powershell
node --test --test-isolation=none tests/electron/vat-document-overrides.test.js
```

Expected: FAIL because the service file and functions do not exist yet.

**Step 3: Write minimal implementation**

In `electron/services/vat-document-overrides.js`:

- define the allowed override types:
  - `supply_type`
  - `duplicate_status`
  - `input_tax_block`
  - `claimable_vat_amount`
  - `output_vat_amount`
- centralize payload validation
- store the active override row
- append every create/update/clear action to history
- implement `applyDocumentOverrides` so the returned effective evaluation includes:
  - updated summary fields
  - active overrides
  - a stable `effectiveVat201` contribution shape

Keep this service deterministic and free of renderer dependencies.

**Step 4: Run tests to verify they pass**

Run:

```powershell
node --test --test-isolation=none tests/electron/vat-document-overrides.test.js
```

Expected: PASS

**Step 5: Commit**

```powershell
git add electron/services/vat-document-overrides.js tests/electron/vat-document-overrides.test.js
git commit -m "feat(vat): add document override service"
```

### Task 3: Wire override IPC and effective document detail loading

**Files:**
- Modify: `electron/ipc/vat-handlers.js`
- Modify: `electron/preload.js`
- Create: `tests/electron/vat-override-handlers.test.js`

**Step 1: Write the failing handler tests**

Create handler tests for:

- `vat:document:overrides:get`
- `vat:document:override:save`
- `vat:document:override:clear`
- `vat:document:override:history`

Also assert that receipt and sales detail responses expose effective compliance data rather than raw base findings only.

Example expectations:

```js
assert.equal(result.success, true);
assert.equal(result.override.override_type, 'supply_type');
assert.equal(result.history.length, 2);
assert.equal(detail.effectiveCompliance.summary.supplyType, 'zero');
```

**Step 2: Run tests to verify they fail**

Run:

```powershell
node --test --test-isolation=none tests/electron/vat-override-handlers.test.js
```

Expected: FAIL because the handlers and preload methods do not exist yet.

**Step 3: Write minimal implementation**

In `electron/ipc/vat-handlers.js`:

- import the override service helpers
- register the four override IPC handlers
- update purchase receipt detail loaders to include:
  - `baseCompliance`
  - `effectiveCompliance`
  - `activeOverrides`
  - `overrideHistory` where appropriate
- update sales detail loaders with the same shape

In `electron/preload.js` expose:

- `vatGetDocumentOverrides(documentType, documentId)`
- `vatSaveDocumentOverride(payload)`
- `vatClearDocumentOverride(payload)`
- `vatGetDocumentOverrideHistory(documentType, documentId)`

Keep naming consistent with the existing VAT preload methods.

**Step 4: Run tests to verify they pass**

Run:

```powershell
node --test --test-isolation=none tests/electron/vat-override-handlers.test.js
```

Expected: PASS

**Step 5: Commit**

```powershell
git add electron/ipc/vat-handlers.js electron/preload.js tests/electron/vat-override-handlers.test.js
git commit -m "feat(vat): add override IPC handlers"
```

### Task 4: Apply approval-gated overrides to period summaries and dashboard totals

**Files:**
- Modify: `electron/services/vat-period-summary.js`
- Modify: `electron/ipc/vat-handlers.js`
- Modify: `tests/electron/vat-period-summary.test.js`
- Modify: `tests/electron/vat-compliance-dashboard.test.js`

**Step 1: Write the failing summary tests**

Add tests proving:

- a pending purchase with a claimable VAT override does **not** change period totals
- an approved purchase with the same override **does** change period totals
- an approved sales invoice with an output VAT override changes output VAT totals
- dashboard aggregates reflect the approved effective totals

**Step 2: Run tests to verify they fail**

Run:

```powershell
node --test --test-isolation=none tests/electron/vat-period-summary.test.js tests/electron/vat-compliance-dashboard.test.js
```

Expected: FAIL because period summary logic currently uses only stored base values.

**Step 3: Write minimal implementation**

In `electron/services/vat-period-summary.js`:

- prefer effective overridden values for `approved` documents only
- fall back to base computed values for non-approved documents

In `electron/ipc/vat-handlers.js`:

- update the receipt and sales mapping helpers that feed summary generation
- ensure they load active overrides before building the period summary inputs

Do not change approval semantics in this phase.

**Step 4: Run tests to verify they pass**

Run:

```powershell
node --test --test-isolation=none tests/electron/vat-period-summary.test.js tests/electron/vat-compliance-dashboard.test.js
```

Expected: PASS

**Step 5: Commit**

```powershell
git add electron/services/vat-period-summary.js electron/ipc/vat-handlers.js tests/electron/vat-period-summary.test.js tests/electron/vat-compliance-dashboard.test.js
git commit -m "feat(vat): apply approval-gated overrides to summaries"
```

### Task 5: Surface client VAT assumptions in Client Manager

**Files:**
- Modify: `src/components/clients/ClientManager.jsx`
- Modify: `electron/ipc/client-handlers.js`
- Create: `src/components/clients/clientVatSettingsViewModel.js`
- Create: `tests/electron/client-vat-settings-handlers.test.js`
- Create: `tests/src/pages/vat-practitioner-controls-view-model.test.js`

**Step 1: Write the failing tests**

Create handler tests proving `client:create` and `client:update` accept and persist:

- `vat_registered`
- `vat_category`
- `has_mixed_supplies`
- `apportionment_ratio`
- `penalty_interest_rate`

Create small view-model tests for helper logic such as:

- default VAT settings draft values
- boolean and numeric normalization
- preserving existing settings from a client record

**Step 2: Run tests to verify they fail**

Run:

```powershell
node --test --test-isolation=none tests/electron/client-vat-settings-handlers.test.js tests/src/pages/vat-practitioner-controls-view-model.test.js
```

Expected: FAIL because client handlers do not currently accept the VAT fields and the helper file does not exist.

**Step 3: Write minimal implementation**

In `electron/ipc/client-handlers.js`:

- allow create/update for the VAT fields
- keep update whitelists explicit

In `src/components/clients/clientVatSettingsViewModel.js`:

- add helpers such as:
  - `getClientVatSettingsDraft(client)`
  - `normalizeClientVatSettingsInput(draft)`

In `src/components/clients/ClientManager.jsx`:

- add a `VAT Settings` section to the form
- keep it inside the existing modal
- use helper text for:
  - VAT registration
  - filing category
  - mixed supplies
  - apportionment ratio
  - penalty interest rate

Do not create a new standalone settings page.

**Step 4: Run tests to verify they pass**

Run:

```powershell
node --test --test-isolation=none tests/electron/client-vat-settings-handlers.test.js tests/src/pages/vat-practitioner-controls-view-model.test.js
```

Expected: PASS

**Step 5: Commit**

```powershell
git add src/components/clients/ClientManager.jsx src/components/clients/clientVatSettingsViewModel.js electron/ipc/client-handlers.js tests/electron/client-vat-settings-handlers.test.js tests/src/pages/vat-practitioner-controls-view-model.test.js
git commit -m "feat(vat): add client VAT settings controls"
```

### Task 6: Add practitioner override panels to VAT Capture and VAT Sales

**Files:**
- Create: `src/components/vat/PractitionerOverridePanel.jsx`
- Modify: `src/pages/VATCapture.jsx`
- Modify: `src/pages/VATSales.jsx`
- Modify: `src/pages/vatComplianceViewModel.js`
- Modify: `tests/src/pages/vat-practitioner-controls-view-model.test.js`

**Step 1: Write the failing renderer-helper tests**

Extend `tests/src/pages/vat-practitioner-controls-view-model.test.js` to cover:

- allowed override types per document type
- required reason validation
- formatting active overrides for display
- formatting history entries for display
- helper note for approval-gated behavior

**Step 2: Run tests to verify they fail**

Run:

```powershell
node --test --test-isolation=none tests/src/pages/vat-practitioner-controls-view-model.test.js
```

Expected: FAIL because the override display helpers do not exist yet.

**Step 3: Write minimal implementation**

In `src/pages/vatComplianceViewModel.js` or a small adjacent helper:

- add functions such as:
  - `getAllowedOverrideTypes(documentType)`
  - `validateOverrideDraft(draft)`
  - `formatOverrideHistoryEntry(entry)`

Create `src/components/vat/PractitionerOverridePanel.jsx` to render:

- active override rows
- `Add Override`
- `Edit`
- `Clear`
- `View History`

Wire this component into:

- `src/pages/VATCapture.jsx`
- `src/pages/VATSales.jsx`

Use the preload methods added in Task 3. Keep the pages responsible only for:

- loading document detail
- triggering save/clear actions
- refreshing the active document state after changes

**Step 4: Run tests to verify they pass**

Run:

```powershell
node --test --test-isolation=none tests/src/pages/vat-practitioner-controls-view-model.test.js
```

Expected: PASS

**Step 5: Commit**

```powershell
git add src/components/vat/PractitionerOverridePanel.jsx src/pages/VATCapture.jsx src/pages/VATSales.jsx src/pages/vatComplianceViewModel.js tests/src/pages/vat-practitioner-controls-view-model.test.js
git commit -m "feat(vat): add practitioner override panels"
```

## Final Verification

Run the focused automated suite:

```powershell
node --test --test-isolation=none tests/electron/vat-compliance-schema.test.js tests/electron/vat-document-overrides.test.js tests/electron/vat-override-handlers.test.js tests/electron/client-vat-settings-handlers.test.js tests/electron/vat-period-summary.test.js tests/electron/vat-compliance-dashboard.test.js tests/src/pages/vat-practitioner-controls-view-model.test.js tests/src/pages/vat-compliance-view-model.test.js
```

Expected: all tests pass.

Run the production build:

```powershell
npm.cmd run build
```

Expected: build passes.

Optional live smoke pass:

```powershell
& .\node_modules\.bin\electron-builder.cmd install-app-deps
npm.cmd run preview
```

Manual smoke checklist:

1. Open Client Manager and edit VAT settings for a client.
2. Save a purchase document and confirm the new assumptions are reflected in review output.
3. Apply a supply-type override in `VAT Capture` with a required reason.
4. Confirm the effective compliance panel updates immediately.
5. Confirm a pending overridden purchase does not change `VAT201 Preview`.
6. Approve the same purchase and confirm `VAT201 Preview` now reflects the override.
7. Open `VAT Sales`, apply an output-VAT override, and confirm the same approval-gated behavior.
8. Open override history and confirm create and clear events are visible.

If you ran the Electron smoke path and need to rerun Node tests afterward, restore the Node ABI build:

```powershell
npm.cmd rebuild better-sqlite3
```
