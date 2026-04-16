# VAT Smart Reminders Design

**Date:** 2026-04-16
**Status:** Approved for planning
**Scope:** VAT Capture only, in-app only

---

## Goal

Add VAT-specific smart reminders that help the practitioner finish review and schedule work for the currently selected client and VAT period without introducing OS notifications, background schedulers, or practice-wide task management.

## Product Decisions

- Scope is limited to `VAT Capture`
- Delivery is `in-app only`
- Users can `dismiss` or `snooze` reminders for the current VAT period
- Reminder logic is derived from live VAT data, not manually entered tasks
- v1 does not add a Settings page for reminder configuration

## Architecture

The feature uses computed reminders plus persisted reminder state.

On VAT Capture load, client change, period change, and VAT mutations, the app computes reminder candidates from live receipt and schedule data. Each reminder is keyed by `client_id + vat_period + rule_key`. The app persists only the user's interaction state for that reminder key, such as dismissal or a snooze timestamp.

A reminder is visible only when:

1. its rule condition is currently true
2. it is not dismissed for the current period and matching condition signature
3. it is not snoozed past the current time

If the underlying VAT condition becomes false, the reminder disappears naturally.

## Reminder Rules

### `pending_receipts`

Trigger when the selected client and period have one or more receipts with `status = pending`.

- Example message: `3 receipts still need review for Mar/Apr 2026.`
- Primary action: switch to the `Receipts` tab and filter to `pending`

### `flagged_receipts`

Trigger when one or more receipts in the selected client and period have one or more flags and are not yet approved.

- Example message: `2 receipts have issues to review, including low confidence or VAT mismatch.`
- Primary action: switch to the `Receipts` tab and focus the first flagged receipt

### `queried_receipts`

Trigger when one or more receipts in the selected client and period have `status = query`.

- Example message: `1 receipt is marked as query and still needs a decision.`
- Primary action: switch to the `Receipts` tab and filter to `query`

### `schedule_missing`

Trigger when at least one approved receipt exists for the selected period but no VAT schedule exists yet.

- Example message: `Approved receipts are ready, but this VAT schedule has not been generated yet.`
- Primary action: switch to the `VAT Schedule` tab

### `schedule_stale`

Trigger when a VAT schedule exists, but approved receipt data changed after the schedule was generated.

Recommended stale checks:

- any receipt in the period has `updated_at > schedule.updated_at`
- or live approved counts or totals no longer match the stored schedule summary

- Example message: `The VAT schedule is out of date and should be regenerated.`
- Primary action: switch to the `VAT Schedule` tab

### `period_closing`

Trigger when the current date is within the configured threshold before `period_end` and there is still outstanding work.

For v1, the threshold is `7 days` before the VAT period end date.

- Example message: `This VAT period closes in 5 days and there is still outstanding review work.`
- Primary action: stay contextual, usually `Receipts` or `VAT Schedule`

## UX

### VAT Capture Reminder Strip

Reminders appear as inline cards below the existing summary cards and above the active tab content.

Each reminder card includes:

- severity styling
- short title
- one-sentence message
- primary action button such as `Review`, `Open Schedule`, or `Regenerate`
- `Snooze` action
- `Dismiss for this period` action

Display behavior:

- show at most `3` reminder cards inline
- if more than 3 are active, show a compact overflow indicator such as `+2 more`

### Sidebar Signal

The existing `VAT Capture` sidebar entry should surface a reminder badge or count when active reminders exist. This does not replace the existing pending receipt badge.

### Tab Action Mapping

- `pending_receipts` -> `Receipts` tab with `statusFilter = pending`
- `queried_receipts` -> `Receipts` tab with `statusFilter = query`
- `flagged_receipts` -> `Receipts` tab with the first flagged receipt selected
- `schedule_missing` -> `VAT Schedule` tab
- `schedule_stale` -> `VAT Schedule` tab
- `period_closing` -> `VAT Schedule` tab if schedule work is outstanding, otherwise `Receipts`

## Snooze and Dismiss Semantics

### Snooze

Supported v1 options:

- `1 day`
- `3 days`
- `until period end`

Snooze state is stored per `client_id + vat_period + rule_key`.

### Dismiss

`Dismiss for this period` hides that reminder rule for the current VAT period only.

The same rule can appear in a later period if the condition happens again.

## Persistence Model

Add a `vat_reminder_state` table with one row per `client_id + vat_period + rule_key`.

Suggested columns:

- `id`
- `client_id`
- `vat_period`
- `rule_key`
- `state`
- `snoozed_until`
- `condition_signature`
- `updated_at`

### Condition Signatures

`condition_signature` prevents dismiss and snooze actions from suppressing materially new work forever.

Example:

- user dismisses `pending_receipts` when there are 3 pending items
- later new pending receipts are added
- the reminder signature changes
- the reminder can reappear during the same period

## Data Flow

The reminder computation should live in the main process alongside the VAT module and SQLite queries.

Recommended IPC surface:

- `vat:reminders:get(clientId, period)`
- `vat:reminder:update-state(payload)`
- `vat:reminders:count()`

The renderer should refresh reminders when:

- selected client changes
- selected period changes
- receipts reload
- a receipt is saved, updated, deleted, approved, rejected, or queried
- a schedule is loaded or regenerated

## Defaults

v1 defaults are hardcoded:

- reminders enabled
- period-closing threshold = `7 days`
- no Settings UI yet

## Failure Behavior

- reminder load failure must never block VAT Capture
- if reminder load fails, the strip stays hidden and the error is logged
- if dismiss or snooze fails, the reminder remains visible and the user gets a small toast
- malformed flags or missing schedule data should suppress only the affected reminder, not the whole page

## Testing Strategy

Focus on pure, deterministic rule computation first.

Cover:

- each reminder rule
- snoozed reminders staying hidden until expiry
- dismissed reminders staying hidden for the same condition signature
- signature changes causing reminders to reappear
- stale schedule detection after approved receipt edits
- period-closing threshold behavior
- renderer action mapping for tab and filter navigation

## Out of Scope for v1

- bank-reconciliation reminders
- practice-wide reminders outside VAT
- OS notifications
- background schedulers or cron-style scans
- filing-submission reminders after export
- per-flag reminder variants for every flag type
