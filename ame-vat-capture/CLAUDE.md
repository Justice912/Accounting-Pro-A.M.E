# AME VAT Capture

## Project Purpose
AI-powered receipt capture and VAT automation for SA SME accounting clients.
Clients photograph receipts (WhatsApp/PWA), AI extracts invoice data,
system builds VAT schedules automatically for accountant review.

## Tech Stack (STRICT - DO NOT CHANGE)
- React 18 + Vite (NO TypeScript, functional components ONLY)
- Tailwind CSS (NO CSS modules, NO styled-components)
- Firebase: Firestore, Auth, Storage
- Vercel: hosting + serverless functions (/api/ directory)
- Claude API: receipt OCR via Vision API (serverless only)
- WhatsApp Business API via WATI/Twilio

## Architecture Rules
- API keys ONLY in Vercel env vars, NEVER in frontend code
- All AI calls go through Vercel serverless, NEVER from browser
- Firebase Security Rules enforce multi-tenant isolation
- Images stored in Firebase Storage, never base64 in Firestore
- All currency in ZAR, all VAT at 15% unless overridden

## Review Checklist (Check every PR)
1. No TypeScript files (.ts, .tsx) anywhere
2. No class components
3. No API keys or secrets in frontend code
4. No direct Claude/Anthropic API calls from browser
5. Firestore security rules updated if schema changes
6. All amounts use number type, never strings
7. VAT calculations: excl + vat = incl (within R0.02 tolerance)
8. Dates in ISO format (YYYY-MM-DD) in Firestore
9. Error boundaries on all route-level components
10. Loading states on all async operations
11. Mobile-responsive PWA, desktop-first dashboard

## Firestore Path Convention
firms/{firmId}/clients/{clientId}/receipts/{receiptId}
firms/{firmId}/clients/{clientId}/bankTransactions/{txnId}
firms/{firmId}/clients/{clientId}/vatSchedules/{periodId}
firms/{firmId}/verifiedVendors/{vatNumber}

## SA-Specific Rules
- VAT number: 10 digits, starts with 4
- VAT rate: 15% (since 1 April 2018)
- VAT periods: Category B = bi-monthly (Jan/Feb, Mar/Apr...)
- Currency: ZAR, symbol R, format R #,##0.00
- SARS VAT vendor verification endpoint may change - degrade gracefully

## Component Naming
- Pages: PascalCase in src/pages/ (e.g., Dashboard.jsx, Login.jsx)
- Components: PascalCase in src/components/{domain}/ (e.g., ReceiptCard.jsx)
- Hooks: camelCase with 'use' prefix in src/hooks/ (e.g., useReceipts.js)
- Services: camelCase in src/services/ (e.g., firebaseService.js)
- Utils: camelCase in src/utils/ (e.g., vatCalculations.js)

## Build Phases (current status)
- [x] Phase 1: Project scaffolding & auth
- [x] Phase 2: Firestore schema & client management
- [ ] Phase 3: PWA receipt capture
- [ ] Phase 4: AI receipt extraction
- [ ] Phase 5: Accountant dashboard & receipt review
- [ ] Phase 6: VAT schedule & export
- [ ] Phase 7: Bank statement reconciliation
- [ ] Phase 8: WhatsApp integration
- [ ] Phase 9: SARS VAT verification & reminders
- [ ] Phase 10: Polish, performance & deployment
