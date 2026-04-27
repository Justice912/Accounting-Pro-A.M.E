# VAT Practitioner Controls Design

**Date:** 2026-04-19  
**Status:** Approved for planning  
**Scope:** Current Electron VAT app, practitioner settings, targeted overrides, audit trail

---

## Goal

Add practitioner-facing controls on top of the new VAT compliance engine so accountants can maintain client VAT assumptions, apply structured document overrides, and preserve an auditable history without weakening the advisory-first model.

## Product Decisions

- This phase extends the current Electron VAT application rather than creating a separate workflow subsystem
- Client VAT assumptions live inside the existing `ClientManager` flow
- Override behavior is `targeted`, not finding-by-finding and not freeform whole-document suppression
- Overrides are `approval-gated`
  - review screens show the effective overridden outcome immediately
  - VAT totals, period summaries, reminders, and VAT201 outputs only use the override once the document is `approved`
- The same override model applies to both:
  - purchase documents in `VAT Capture`
  - sales documents in `VAT Sales`

## Architecture

This phase should add a lightweight `practitioner controls` layer on top of the existing compliance stack.

Recommended structure:

- `ClientManager`
  Extended to edit VAT assumptions already used by the rules engine
- `electron/services/vat-document-overrides.js`
  New main-process helper for reading, writing, clearing, and applying structured overrides
- `electron/services/vat-rules-engine.js`
  Continues to produce the base evaluation
- `electron/services/vat-period-summary.js`
  Uses overridden results only for approved documents
- `electron/ipc/vat-handlers.js`
  Exposes narrow override and effective-compliance IPC methods
- React pages remain presentation-focused and do not contain override business rules

The important distinction is:

- `base evaluation`
  Raw engine result with no practitioner intervention
- `effective evaluation`
  Base result after applying any active targeted overrides

The UI may show both states for review transparency, but period-level outputs should only consume the effective result when the document is approved.

## Supported Controls

### Client VAT assumptions

Add a `VAT Settings` section inside the current client management modal with:

- `VAT registered`
- `VAT category`
- `Has mixed supplies`
- `Apportionment ratio`
- `Penalty interest rate`

These fields are practitioner-maintained assumptions used by the rules engine and period summaries.

### Targeted document overrides

Supported override types for v1:

- `supply_type`
  Change the effective VAT treatment to `standard`, `zero`, or `exempt`
- `duplicate_status`
  Mark a document as `clear`, `probable`, `duplicate`, or `suspected`
- `input_tax_block`
  Override blocked versus allowed input treatment on purchase documents
- `claimable_vat_amount`
  Set an explicit effective claimable VAT amount on purchase documents
- `output_vat_amount`
  Set an explicit effective output VAT amount on sales documents

Every override must capture:

- `reason`
- `created_by` or reviewer identity where available
- `timestamp`

A later override of the same type replaces the active override for computation, but history is preserved.

Users must also be able to `clear` an override, which restores the engine-derived result and writes a history event.

## User Experience

### Client Manager

Extend the existing modal with a dedicated `VAT Settings` section below core client fields.

The section should use:

- toggles for boolean assumptions
- simple selects for categories
- numeric entry for percentages and rates
- short helper text for mixed supplies, apportionment, and penalty assumptions

The goal is to keep VAT assumptions in the same place as the rest of client administration.

### VAT Capture

Add a `Practitioner Overrides` card to the existing compliance panel.

It should show:

- active overrides
- effective values
- reason
- applied timestamp
- actions for `Add Override`, `Edit`, `Clear`, and `View History`

When the document is not approved, show a note that the override will affect totals only after approval.

### VAT Sales

Mirror the same override panel pattern in `VAT Sales` so the review experience stays consistent across purchases and sales.

The available override fields should be tailored by document type:

- purchases: input block and claimable VAT controls
- sales: output VAT override support

### Override history

Each document should expose a small chronological history view with entries such as:

- `Supply type changed from standard to zero`
- `Duplicate status cleared`
- `Claimable VAT changed from R150.00 to R0.00`

Each entry must show:

- previous value
- next value
- reason
- actor
- timestamp

### Visual distinction

The UI should clearly distinguish:

- engine-derived compliance output
- practitioner-applied override state

Use a subtle but explicit treatment such as:

- neutral/slate styling for engine results
- blue-accent badges or panels for active overrides

This preserves the advisory-first positioning and makes reviewability obvious.

## Data Model

### Client assumptions

This phase should surface the following client fields in the UI:

- `vat_registered`
- `vat_category`
- `has_mixed_supplies`
- `apportionment_ratio`
- `penalty_interest_rate`

### Active override table

Add `vat_document_overrides` for current active override state.

Suggested fields:

- `id`
- `document_type`
- `document_id`
- `override_type`
- `override_value_json`
- `reason`
- `created_by`
- `created_at`
- `cleared_at`
- `cleared_by`

This table supports fast reads of the currently effective override state.

### Override history table

Add `vat_document_override_history` as an append-only audit log.

Suggested fields:

- `id`
- `document_type`
- `document_id`
- `override_type`
- `event_type`
- `previous_value_json`
- `next_value_json`
- `reason`
- `actor`
- `created_at`

Use this table for displayable history and later audit support.

## Computation Flow

1. The current rules engine computes the base compliance result.
2. The override service loads active overrides for the document.
3. The service applies supported overrides to derive:
   - `effective summary`
   - `effective VAT201 contribution`
   - `active overrides`
4. The renderer receives both the document and its effective compliance context.
5. The period summary layer applies this rule:
   - pending/query/rejected documents use the base result for totals
   - approved documents use the effective overridden result

This keeps review flexible without allowing draft overrides to silently distort VAT totals.

## IPC Surface

Recommended new handlers:

- `vat:document:overrides:get(documentType, documentId)`
- `vat:document:override:save(payload)`
- `vat:document:override:clear(payload)`
- `vat:document:override:history(documentType, documentId)`

Existing receipt and sales detail loaders should also return effective compliance information so the renderer does not need to reconstruct override state on its own.

## Guardrails

- Only supported override types are accepted
- All save and clear actions require a reason
- Override payloads are validated in the main process
- Numeric override values must be valid and non-negative
- Enum overrides must use allowed values only
- Clearing an override restores engine behavior instead of nulling computed fields
- If an override cannot be parsed, it should be ignored for computation, logged, and must not break the document review experience

## Testing

This phase should add coverage for:

- schema creation of the override tables
- override-service application of targeted overrides to base compliance
- handler tests for save, get, clear, and history behavior
- period summary behavior proving:
  - pending overridden documents do not affect VAT totals
  - approved overridden documents do affect VAT totals
- renderer behavior for:
  - Client Manager VAT settings
  - override panel rendering
  - required reason validation
  - history display

## Non-Goals

This phase does not include:

- a full reviewer queue or multi-stage approval system
- finding-level override editing for every rule result
- automatic filing submission
- silent hard-stop compliance enforcement
- practice-wide override administration screens

## Outcome

The result should be a practical practitioner-control layer that makes the new VAT compliance engine usable in real accounting workflows:

- client assumptions become editable
- accountant judgement becomes structured and auditable
- VAT totals remain controlled by approval state
- later filing workflow work gains a clean foundation instead of inventing override behavior ad hoc
