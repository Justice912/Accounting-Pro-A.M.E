# AME Pro AI Workstation — Claude Code Review Brief

## Project Purpose
AI-powered desktop workstation for South African accounting practitioners.
The **VAT Capture** module enables clients to photograph receipts, have Claude AI
extract invoice data, and auto-build SARS-compliant VAT schedules for accountant review.

## Architecture (Electron Desktop App)
This is an **Electron** desktop app, NOT a web app or SaaS.
The original spec called for Firebase + Vercel — these have been adapted:

| Spec Component       | Electron Equivalent                             |
|----------------------|-------------------------------------------------|
| Firebase Firestore   | better-sqlite3 (SQLite) in userData/            |
| Firebase Storage     | Local filesystem — userData/vat-receipts/       |
| Vercel Serverless    | Electron IPC handlers in electron/ipc/          |
| Claude Vision API    | Called from electron/ipc/vat-handlers.js        |
| PWA / Service Worker | N/A — native desktop app                        |
| WhatsApp Webhook     | Out of scope for desktop — future server module |

## Tech Stack (STRICT — DO NOT CHANGE)
- React 18 + Vite (NO TypeScript, functional components ONLY, NO class components)
- Tailwind CSS (NO CSS modules, NO styled-components)
- SQLite via better-sqlite3 (database in electron/services/database.js)
- Electron IPC (electron/ipc/ handlers, exposed via electron/preload.js)
- Claude API: Vision OCR via vat-handlers.js ONLY — NEVER called from renderer
- ExcelJS for Excel export (already installed)

## Security Rules
- API keys stored via electron/services/keychain.js (OS keychain) — NEVER in code or .env files committed to git
- Claude API called ONLY from Electron main process (electron/ipc/) — never from renderer/src/
- All file I/O happens in main process — renderer receives paths, not raw file contents

## VAT Module — File Map
```
electron/ipc/vat-handlers.js           — All VAT IPC handlers (CRUD, AI, export, bank, compliance)
electron/services/database.js          — SQLite schema: vat_receipts, vat_bank_transactions,
                                         vat_schedules, vat_verified_vendors, vat_reminder_state,
                                         vat_compliance_results, vat_period_summaries,
                                         vat_sales_invoices, vat_document_overrides
electron/services/vat-rules-engine.js  — Core rules engine (S20, S21, S17(2), S9, S17(1), S39-40)
electron/services/vat-reminders.js     — Smart reminder rule engine
electron/services/vat-period-summary.js — Period aggregation and VAT201 field mapping
electron/services/vat-period-filters.js — Custom VAT period date range helpers
electron/services/vat-document-overrides.js — Practitioner override service
electron/preload.js                    — All vat* methods exposed to renderer
src/pages/VATCapture.jsx               — Purchase receipt capture (receipts, AI, schedule, bank tabs)
src/pages/VATSales.jsx                 — Sales invoice workflow
src/pages/VATDashboard.jsx             — Multi-client practice overview
src/pages/VAT201Preview.jsx            — VAT201 return preview with field drill-down
src/pages/vatComplianceViewModel.js    — Compliance view model (maps engine output to UI)
src/pages/vatPeriodViewModel.js        — Period selector and custom date range helpers
src/utils/vatRulesEngine.js            — Renderer-side rules engine (same API as electron/services)
src/components/vat/PractitionerOverridePanel.jsx — Override UI (accountant edits totals)
src/components/clients/ClientManager.jsx         — Client CRUD and VAT settings
src/components/clients/clientVatSettingsViewModel.js — Client VAT settings view model
```

## VAT Rules Engine API (electron/services/vat-rules-engine.js)
```js
evaluateVatDocument(input)           // → full compliance result (main entry point)
validateSection20(document)          // → S20 invoice requirement findings[]
validateSection21(document)          // → S21 debit/credit note findings[]
classifySupply(document)             // → { supplyType: 'standard'|'zero'|'exempt', reason }
checkInputTaxBlocks(document)        // → { blockedInputAmount, findings[] } S17(2) blocks
calculateTimeOfSupply(document)      // → { timeOfSupplyDate, findings[] } S9
calculateApportionment(doc, settings, blocked) // → { apportionedInputAmount, ... } S17(1)
detectDuplicateStatus(document, ctx) // → { duplicateStatus: 'exact'|'probable'|'near'|'clear', findings[] }
calculatePenaltyRisk(periodContext)  // → penalty/interest exposure S39-40
scoreCompliance(findings)            // → 0-100 compliance score
```

## Review Checklist (Check every PR touching VAT module)
1. No `.ts` or `.tsx` files anywhere
2. No class components — all functional with hooks
3. ANTHROPIC_API_KEY / Claude API never referenced in any file under `src/`
4. All Claude API calls in `electron/ipc/vat-handlers.js` only
5. All amounts stored as `REAL` (numbers), never strings
6. VAT maths: `total_excl_vat + vat_amount = total_incl_vat` within R0.02 tolerance
7. Dates stored as ISO strings `YYYY-MM-DD` in SQLite
8. VAT period format: `YYYY-MM` (first month of bi-monthly pair, e.g. `2026-03` = Mar/Apr)
9. Status transitions must be valid: pending → reviewed → approved | rejected | query
10. No receipt image data stored as base64 in SQLite — only file paths
11. Loading states on all async IPC calls
12. Error boundaries on route-level components
13. Supply classifier returns 'zero' for Schedule 1 foodstuffs, 'exempt' for S12 supplies
14. S17(2) blocker covers entertainment, motor cars, and private/non-taxable use
15. Duplicate detection covers exact, probable (7-day fuzzy), and near-duplicate cases
16. VAT Rules Engine functions have unit tests (tests/electron/vat-rules-engine.test.js)
17. S20 validation runs on every receipt/invoice before persistence
18. Practitioner overrides logged with timestamp and reason in vat_document_overrides

## Firestore→SQLite Path Convention (Adapted)
```
vat_receipts           WHERE client_id = ?   (replaces firms/{firmId}/clients/{clientId}/receipts)
vat_bank_transactions  WHERE client_id = ?
vat_schedules          WHERE id = '{clientId}_{period}'
vat_verified_vendors   WHERE vat_number = ?
```

## SA-Specific Rules
- VAT number: 10 digits, starts with 4 (regex: /^4\d{9}$/)
- VAT rate: 15% (since 1 April 2018)
- VAT periods Category B: bi-monthly Jan/Feb, Mar/Apr, May/Jun, Jul/Aug, Sep/Oct, Nov/Dec
  Period key = first month: 2026-01, 2026-03, 2026-05, etc.
- Currency: ZAR, formatted as R #,##0.00 via Intl.NumberFormat('en-ZA')
- SARS VAT vendor endpoint: https://secure.sarsefiling.co.za/vatvendorsearch/api
  → If unavailable, return { valid: null } — DO NOT return false

## Component Naming
- Pages: PascalCase in src/pages/ (VATCapture.jsx)
- IPC handlers: camelCase functions in electron/ipc/vat-handlers.js
- Helpers: camelCase in src/utils/ (vatCalculations.js if extracted)

## Known Gaps vs. Original Spec (by design for Electron)
- WhatsApp capture channel — requires separate server, not in desktop app
- PWA / offline queue — not applicable to Electron
- Multi-tenant firm isolation — single-user desktop; client_id provides isolation
- Magic link auth — Electron uses OS identity; no Firebase Auth
- Vercel deployment — app is packaged as .exe/.dmg via electron-builder
