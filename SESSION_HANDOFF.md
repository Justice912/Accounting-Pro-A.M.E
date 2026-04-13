# AME VAT Capture — Session Handoff

**Date:** 2026-04-13  
**Repo:** https://github.com/Justice912/Accounting-Pro-A.M.E  
**Local clone:** C:/Projects/Accounting-Pro-AME  
**Last commit:** f27e805 (main branch, pushed to GitHub)

---

## What Was Built

The `AME VAT Capture` feature was reviewed against the original build spec and completely rebuilt as a tab in the `Accounting-Pro-AME` Electron desktop app. Codex had only built a basic 183-line manual VAT entry stub — everything else was missing.

### Architecture Decision
The spec called for Firebase + Vercel + PWA + WhatsApp. The app is actually an **Electron desktop app** with SQLite. All spec features were adapted:

| Spec | Electron Equivalent |
|------|---------------------|
| Firebase Firestore | SQLite via better-sqlite3 |
| Firebase Storage | Local filesystem `userData/vat-receipts/` |
| Vercel Serverless | Electron IPC handlers (`electron/ipc/`) |
| Claude Vision API | Called from `vat-handlers.js` (main process only) |
| PWA / WhatsApp | Out of scope for desktop |

---

## Files Created / Modified

### New Files
- `electron/ipc/vat-handlers.js` — All VAT IPC handlers
- `CLAUDE.md` — Project review brief (Electron-adapted)

### Modified Files
- `electron/services/database.js` — Added 4 new tables + indexes
- `electron/preload.js` — Added 16 `vatXxx` IPC methods
- `electron/main.js` — Registered `registerVatHandlers`
- `src/pages/VATCapture.jsx` — Complete replacement (4-tab dashboard)

---

## Database Tables Added (database.js)

```sql
vat_receipts         -- core receipt storage with AI-extracted fields, status, flags
vat_bank_transactions -- imported bank CSV transactions
vat_schedules        -- auto-generated VAT201 schedules per client/period
vat_verified_vendors -- SARS VAT number verification cache
```

---

## IPC Handlers (vat-handlers.js)

| Handler | Description |
|---------|-------------|
| `vat:receipt:list` | List receipts for client, filtered by period/status |
| `vat:receipt:get` | Get single receipt by ID |
| `vat:receipt:save` | Create or update receipt (upsert) |
| `vat:receipt:delete` | Delete receipt |
| `vat:receipt:update-status` | Set status + review notes |
| `vat:receipt:bulk-status` | Bulk status update |
| `vat:receipt:import-image` | File picker → copy to userData/vat-receipts/ |
| `vat:receipt:extract` | Claude Vision OCR → structured JSON |
| `vat:verify-vat` | SARS VAT vendor check (with graceful degradation) |
| `vat:bank:import` | Parse SA bank CSV (FNB/Std Bank/Nedbank/ABSA/Capitec) |
| `vat:bank:list` | List bank transactions |
| `vat:bank:match` | Link/unlink bank txn ↔ receipt |
| `vat:schedule:generate` | Build VAT schedule from approved receipts |
| `vat:schedule:get` | Get schedule + receipts for period |
| `vat:export:excel` | Two-sheet Excel export via ExcelJS |

---

## VATCapture.jsx — Tab Structure

**Top bar:** Client selector (dropdown) + Period selector + Tab navigation  
**Summary cards:** Total / Pending / Approved / Flagged / Input VAT / Total Purchases

### Tab 1: Receipts
- Sortable table: Date, Supplier, Invoice No., Total Incl., VAT, Status, VAT# badge, Flags
- Quick actions per row: Approve, Reject, Delete
- Bulk select + bulk approve
- Detail side-panel (right half): receipt image + extracted data side-by-side
- Inline editing, status buttons, AI confidence bar
- Keyboard shortcuts: `A`=Approve, `R`=Reject, `Q`=Query, `Esc`=Close

### Tab 2: Capture (AI)
- File picker → image preview
- "Extract with AI" → Claude Vision OCR
- Editable review form (all extracted fields)
- SARS VAT verification badge
- Flag warnings (low confidence, VAT mismatch, etc.)
- Save to receipts

### Tab 3: VAT Schedule
- Generate button → reads approved receipts
- VAT201 field mapping (Field 14/15/16)
- Grouped by expense category with totals
- Reconciliation status
- Export to Excel (.xlsx)

### Tab 4: Bank Reconciliation
- Import SA bank CSV (FNB, Std Bank, Nedbank, ABSA, Capitec)
- Auto-match by amount + date (within R1, 2-day window)
- Filter: All / Matched / Unmatched
- Manual link/unlink
- Unmatched receipts "chase list"

---

## Bug Fixed (Last Commit)

**Problem:** Blank page when opening VAT Capture tab  
**Root cause:** React 18 unmounts component tree on unhandled promise rejections from `useEffect`. All async IPC calls (`loadReceipts`, `loadBankTxns`, `loadSchedule`, etc.) had no `try-catch`.  
**Fix:** Added `try-catch` + `api?.method` existence guards to every async IPC call. Errors now fail gracefully with empty state instead of crashing React.

---

## Known Gaps vs. Original Spec (by design)
- WhatsApp capture channel — requires separate server, not in desktop app
- PWA / offline queue — N/A for Electron
- Multi-tenant Firebase Auth — single-user desktop; `client_id` provides isolation
- Magic link auth — N/A for desktop
- Vercel deployment — app packaged as `.exe/.dmg` via electron-builder

---

## Next Steps / Remaining Work
- Test full flow end-to-end (image → OCR → approve → schedule → export)
- Add `.env.example` for Claude API key instructions
- Consider adding receipt count badge to sidebar VAT Capture button
- WhatsApp integration would need a separate Node.js server module
- Smart reminders (spec Section 4.8) not yet built

---

## Dev Commands
```bash
cd C:/Projects/Accounting-Pro-AME
npm run dev          # Electron dev mode
npm run build        # Production build (electron-vite)
npm run package:win  # Package as .exe
```

**Important:** After any preload.js change, fully restart Electron (not just HMR).  
The app stores its SQLite database at: `%APPDATA%/ame-pro-workstation/database.sqlite`
