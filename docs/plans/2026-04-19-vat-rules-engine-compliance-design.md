# VAT Rules Engine and Compliance Design

**Date:** 2026-04-19
**Status:** Approved for planning
**Scope:** Current Electron VAT app, purchase and sales workflows, advisory-first

---

## Goal

Adapt the April 2026 VAT Capture v2 specification onto the existing Electron + SQLite application by adding a full South African VAT rules engine, compliance scoring, a separate sales-invoice workflow, period-level VAT201 mapping, and compliance-focused UI surfaces without rewriting the product into a Firebase/Vercel web app.

## Product Decisions

- The attached web-first specification is being adapted onto the current Electron desktop app
- The rules engine covers both purchase/input VAT and sales/output VAT from the start
- Approval remains `advisory-first`, not hard-stop by default
- Sales/output VAT uses a separate workflow rather than forcing a unified document refactor immediately
- The rules engine targets full-spec legal coverage from day one:
  - Section 20 validation
  - Section 21 adjustment note validation
  - supply classification
  - input tax blocking
  - time of supply
  - apportionment
  - duplicate detection
  - penalty risk
  - compliance scoring
  - VAT201 mapping

## Architecture

The compliance subsystem should live in the Electron main process next to the SQLite VAT data and existing VAT handlers.

Recommended structure:

- `electron/services/vat-rules-engine.js`
  Main orchestration layer for document evaluation
- `electron/services/vat-period-summary.js`
  Aggregates evaluated documents into period-level VAT201 and compliance outputs
- `electron/ipc/vat-handlers.js`
  Thin IPC layer that saves documents, invokes the rules engine, persists results, and returns normalized UI data
- React pages stay presentation-oriented and consume persisted compliance outputs through preload methods

The current purchase flow remains anchored in `vat_receipts`. A new `vat_sales_invoices` workflow handles output VAT documents. Both document types feed the same rules engine and the same period-summary layer.

The rules engine must be deterministic and explicit. It should produce:

- structured findings with section references
- computed VAT treatment
- document-level compliance score
- blocked and apportioned VAT values
- duplicate signals
- VAT201 contribution hints
- advisory messages for the practitioner

The engine is not a replacement for professional judgement. It highlights likely issues, explains them, and supports explicit overrides.

## Data Model

The current schema needs to evolve from simple receipt flags into normalized compliance results.

### Existing purchase document table

Keep `vat_receipts` as the purchase-side table, but extend it with richer compliance fields such as:

- `document_kind`
- `has_text_tax_invoice`
- `recipient_name`
- `recipient_vat_number`
- `recipient_address`
- `supply_type`
- `supply_type_reason`
- `time_of_supply_date`
- `time_of_supply_reason`
- `duplicate_status`
- `blocked_input_amount`
- `blocked_input_reason`
- `apportioned_input_amount`
- `compliance_score`
- `rules_version`
- `rules_evaluated_at`
- `override_state`

### New sales table

Add `vat_sales_invoices` for output VAT documents with mirrored commercial and compliance fields, including:

- customer and recipient details
- invoice and adjustment-note details
- supply values
- VAT values
- document type
- supply classification
- time of supply
- duplicate status
- compliance score
- review status and override metadata

### Rule results table

Add `vat_rule_results` as a normalized store of findings for both purchases and sales.

Each row should include:

- `document_id`
- `document_table`
- `rule_key`
- `section_ref`
- `severity`
- `status`
- `message`
- `computed_value`
- `expected_value`
- `override_reason`
- timestamps

This is more robust than continuing to overload a `flags` JSON array once the compliance logic grows deeper.

### Period summary table

Add `vat_period_summaries` for persisted period-level outputs such as:

- input VAT totals
- output VAT totals
- blocked input totals
- apportioned adjustments
- zero-rated totals
- exempt totals
- duplicate exclusions
- penalty estimate
- compliance score
- counts by severity and status
- VAT201 field mappings

### Client VAT settings

Extend client storage with VAT settings needed for full-spec calculations:

- `vat_registered`
- `vat_category`
- `has_mixed_supplies`
- `apportionment_ratio`
- `industry`
- optional firm or client-level filing assumptions where needed

## Rules Engine Coverage

### Section 20 invoice validation

Validate full versus abridged tax invoice requirements using the `R5,000` threshold and return structured findings for:

- missing tax invoice wording
- missing supplier details
- missing recipient details where required
- VAT number format
- invoice number presence
- date validity
- line item completeness
- VAT math consistency

### Section 21 debit and credit note validation

For adjustment notes, validate:

- correct document wording
- original invoice reference
- adjustment reason
- corrected or adjusted amounts

### Supply classification

Classify purchase and sales line items into:

- standard-rated
- zero-rated
- exempt
- capital where relevant for input reporting

Every classification should carry a stored reason so the accountant can see why the engine suggested it.

### Input tax blocker

For purchase documents, detect blocked or partially claimable input VAT under Section 17(2), including:

- entertainment
- motor car restrictions
- non-taxable or private use
- later support for deemed supply style adjustments

### Time of supply

For both purchase and sales documents, derive the VAT period using invoice date as the primary driver, then compare against matched payment data where available. Conflicts should create advisory findings rather than silently rewrite history.

### Apportionment

For mixed-supply clients, apply the stored apportionment ratio and separate:

- gross input VAT
- blocked input VAT
- apportioned claimable input VAT
- non-claimable residual

### Duplicate detection

Detect exact, probable, and suspicious duplicates across purchase and sales workflows and exclude duplicates from VAT201 totals unless overridden.

### Penalty risk

At period level, estimate filing and payment exposure using stored deadlines and period outputs. These values must be presented as advisory estimates, not definitive SARS calculations.

### Compliance scoring

Compute a transparent score at:

- document level
- client-period level
- practice-wide VAT dashboard level

The score must be explainable from findings rather than opaque.

### VAT201 mapping

The engine and summary layer should assign documents into deterministic VAT201 buckets so later reporting and preview screens do not recalculate logic differently in multiple places.

## User Experience

### VAT Capture

Upgrade the existing purchase review experience with a compliance section that shows:

- compliance score
- grouped findings by severity
- supply type and reason
- blocked input VAT
- apportioned input VAT
- duplicate status
- time-of-supply outcome
- override controls and override history

### Sales workflow

Add a dedicated sales-invoice workspace as a separate VAT page or route rather than overloading purchase receipt screens.

This workflow should provide:

- sales document list
- detail and edit panel
- document type handling for invoices, debit notes, and credit notes
- output VAT treatment visibility
- compliance findings and score
- approval and override flow aligned with purchases

### Compliance dashboard

Extend the current VAT dashboard or add a dedicated compliance view that surfaces:

- purchase score
- sales score
- overall period score
- blocked input totals
- apportioned adjustments
- duplicate counts
- top recurring compliance failures
- estimated penalty exposure
- period status and deadline pressure

### VAT201 preview

Add a structured preview that shows:

- VAT201 field groupings
- purchase and sales contributions
- blocked and apportioned adjustments
- duplicate exclusions
- drill-down to contributing documents

### Smart reminders integration

The smart reminders feature should eventually read compliance state too, for example:

- unresolved critical findings
- duplicate documents awaiting action
- missing sales workflow review in an active period
- periods near deadline with unresolved compliance issues

## Advisory-First Rules of Engagement

- The engine always evaluates documents
- The engine never silently changes legal treatment without surfacing the reason
- Accountants remain able to approve documents
- Material disagreements should support override notes
- The UI must distinguish between:
  - extracted or entered facts
  - computed treatment
  - accountant overrides

This distinction is essential for trust, reviewability, and later audit support.

## Delivery Strategy

The safest rollout is layered:

1. extend schema and persistence
2. build the pure rules engine with comprehensive tests
3. wire purchase documents into the engine
4. add the sales workflow
5. build period summaries and VAT201 preview logic
6. surface compliance outputs in the UI
7. connect reminders and dashboard aggregation

This keeps legal logic testable before renderer complexity is introduced.

## Risks and Mitigations

### Over-automation risk

Mitigation:

- advisory-first behavior
- override capture
- legal references stored with findings
- no autonomous filing or silent hard stops

### Purchase-shaped legacy assumptions

Mitigation:

- separate sales workflow instead of rushed document unification
- shared rules engine contract across both tables
- period summaries as the common aggregation layer

### Full-spec scope instability

Mitigation:

- sequence work through strict test gates
- keep the rules engine pure and highly covered
- isolate renderer logic in small view-model helpers where possible

### Drift from attached web spec

Mitigation:

- adapt the business rules and UX intent
- explicitly reject the Firebase/Vercel architecture assumptions
- keep Electron + SQLite as the implementation foundation

## Out of Scope for This Design

- migrating the product to Firebase, Firestore, or Vercel
- replacing practitioner judgement with automatic filing decisions
- adding WhatsApp intake in the same phase as the rules engine
- rebuilding the whole VAT app into a new frontend stack
