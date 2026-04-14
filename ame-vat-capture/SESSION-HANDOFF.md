# AME VAT Capture — Session Handoff

> Resume document for the next Claude Code session. Read this + `CLAUDE.md` before doing anything.

## Project context

- **Product:** AME VAT Capture — AI-powered receipt capture & VAT automation for AME Business Accountants (SA).
- **Location:** `C:/Users/HP/Accounting-Pro-A.M.E/ame-vat-capture/` (subfolder inside the existing `Accounting-Pro-A.M.E` Electron repo, kept independent from the parent app).
- **Repo:** https://github.com/Justice912/Accounting-Pro-A.M.E
- **Spec:** Full build spec (Sections 1–10) provided by the user. Phase plan lives in `CLAUDE.md` and `README.md`. The full spec was pasted in chat — re-request it from the user if the next session needs the exact field names.

## Architectural decision (locked)

The user chose **Option 2 — subfolder inside the existing repo** (not a sibling repo, not integrated into the Electron app). The two products share a git history but no code. The Electron "AME Pro AI Workstation" at the repo root is a separate, unrelated product — do not import from it, do not modify it as part of VAT Capture work.

## Hard stack constraints (from spec — DO NOT CHANGE)

- React 18 + Vite — **NO TypeScript**, functional components only
- Tailwind CSS — no CSS modules, no styled-components
- Firebase: Firestore + Auth + Storage
- Vercel: hosting + `/api/*` serverless functions
- Claude Vision API for OCR (serverless only, never from browser)
- WhatsApp via WATI or Twilio (abstract behind a service layer so provider is swappable)
- ZAR currency, 15% VAT default, SARS-compliant outputs

If a Phase 2+ task seems to need TypeScript, class components, or a different backend — stop and re-read the spec. The constraints are non-negotiable.

## Phase status

| Phase | Status | Notes |
|------|--------|-------|
| 1. Scaffolding & auth | ✅ Done | Build green, `vite build` passes |
| 2. Firestore schema & client management | ✅ Done | Rules + service + hook + form + list page, build green (70 modules) |
| 3. PWA receipt capture | ⏭ Next | Camera capture + Storage upload + pending receipts queue |
| 4. AI receipt extraction | Pending | `/api/extract-receipt.js` + Claude Vision |
| 5. Accountant dashboard | Pending | |
| 6. VAT schedule + export | Pending | |
| 7. Bank reconciliation | Pending | |
| 8. WhatsApp integration | Pending | |
| 9. SARS verification + reminders | Pending | |
| 10. Polish + deploy | Pending | |

## What Phase 1 delivered

```
ame-vat-capture/
├── api/health.js                          # serverless smoke test
├── public/                                 # PWA icons go here
├── src/
│   ├── App.jsx                             # Router with all routes wired
│   ├── main.jsx                            # AuthProvider + BrowserRouter
│   ├── index.css                           # Tailwind + .btn-primary / .input / .card
│   ├── config/firebase.js                  # Firebase init from VITE_* env vars
│   ├── contexts/AuthContext.jsx            # email/password + magic link flows
│   ├── components/
│   │   ├── auth/ProtectedRoute.jsx         # redirects to /login, optional role gate
│   │   ├── common/Spinner.jsx
│   │   └── dashboard/DashboardLayout.jsx   # sidebar + topbar + <Outlet />
│   └── pages/
│       ├── Login.jsx                       # accountant/client mode toggle
│       ├── MagicLinkCallback.jsx
│       ├── Dashboard.jsx                   # placeholder
│       ├── Clients.jsx                     # placeholder ← Phase 2 lands here
│       ├── Receipts.jsx                    # placeholder
│       ├── VatSchedules.jsx                # placeholder
│       ├── Reconciliation.jsx              # placeholder
│       ├── Capture.jsx                     # client PWA placeholder
│       ├── Placeholder.jsx                 # shared phase-tagged stub
│       └── NotFound.jsx
├── .env.example                            # all env vars documented
├── CLAUDE.md                               # review brief (Section 7)
├── README.md                               # local dev + Vercel deploy steps
├── package.json
├── postcss.config.js
├── tailwind.config.js                      # brand colours from Section 6.1
├── vite.config.js                          # vite-plugin-pwa configured
└── vercel.json                             # SPA rewrites + serverless runtime
```

**Build verification:** `npm run build` → `✓ built in 3.97s`, 66 modules, PWA service worker generated. Zero errors.

## Empty directories ready for content

`src/components/{capture,receipts,vat,clients,reconciliation}/`, `src/hooks/`, `src/services/`, `src/utils/` — all created during scaffolding, currently empty.

## Known gaps before Phase 1 can be tested in the browser

The user has NOT yet:
1. Created a Firebase project / pasted real `VITE_FIREBASE_*` values into `.env`
2. Enabled Email/Password + Email link auth providers in the Firebase console
3. Run `npm run dev` to manually verify the login flow
4. Deployed to Vercel

`npm install` was run successfully (~500 packages). Build passes. Sign-in cannot be tested without Firebase credentials.

## What Phase 2 delivered

```
ame-vat-capture/
├── firestore.rules                          # firm-level isolation; accountant vs client role gates
├── firestore.indexes.json                   # composite indexes for clients + receipts queries
├── firebase.json                            # Firebase CLI config (rules + storage + indexes)
├── storage.rules                            # receipts bucket, image/pdf + 10MB cap
└── src/
    ├── utils/validation.js                  # SA VAT/phone/reg number/email validators
    ├── services/clientService.js            # CRUD + onSnapshot at firms/{firmId}/clients
    ├── hooks/useClients.js                  # real-time clients hook
    ├── components/clients/ClientForm.jsx    # modal form with validation
    └── pages/Clients.jsx                    # list, search, show-inactive, edit, de/reactivate
```

**Membership model:** `firms/{firmId}/members/{uid}` with `{ role: 'accountant' | 'client', clientId? }`. Security rules depend on this doc existing before a user can read anything. When wiring live Firebase, the first thing to do after creating an accountant auth user is `setDoc(doc(db, 'firms/ame/members/{uid}'), { role: 'accountant' })` (manually in console or via a one-shot admin script).

**Deploy rules:** `firebase deploy --only firestore:rules,storage` once `firebase login` + `firebase use {project}` are set up. `firebase.json` points at `firestore.rules` and `storage.rules` in the repo root.

**Known limitation:** `useClients` currently runs unconditionally on mount — if the user's membership doc doesn't exist, Firestore will reject the snapshot and `error` will populate. That's acceptable until Phase 5 wires proper role-aware routing.

## Phase 3 — next session starting point

Per spec Section 8, Phase 2 = **Firestore Schema & Client Management**:

1. **Firestore security rules** — `firestore.rules` enforcing firm-level isolation per the schema in Section 3.2. Accountants read/write all data under their firm; clients only write to their own receipts subcollection and read their own client doc.
2. **`src/services/clientService.js`** — CRUD against `firms/{firmId}/clients/{clientId}` (see Section 3.1.2 for fields: businessName, tradingName, vatNumber, registrationNumber, contactPerson, phone, email, whatsappNumber, vatCategory, isActive, timestamps).
3. **`src/hooks/useClients.js`** — real-time `onSnapshot` listener on the clients collection.
4. **Replace `src/pages/Clients.jsx` placeholder** — list view with search, "Add client" button, edit/deactivate row actions.
5. **`src/components/clients/ClientForm.jsx`** — modal/drawer form with VAT number validation (10 digits, starts with 4) and South African phone format helpers.
6. **`firebase.json` + `firestore.indexes.json`** — for `firebase deploy --only firestore:rules` workflow. Document deploy in README.
7. **Acceptance test:** Accountant can create, edit, and deactivate clients. Data persists in Firestore. Other authenticated accountants in the same firm see the changes in real time.

**Use `DEFAULT_FIRM_ID` from `firebase.js`** for the firmId — it reads from `VITE_DEFAULT_FIRM_ID` (defaults to `'ame'`). Multi-firm support is out of scope for now.

## How to resume in the next session

1. User says "continue" or `/gsd:resume-work`
2. Read this file + `CLAUDE.md`
3. Confirm Phase 1 acceptance (ask user: "did you wire up Firebase and verify the login flow in a browser?"). If no — pause Phase 2 work that depends on real Firestore, build the rules + service layer + UI scaffolding, ask user to run smoke test before committing.
4. If yes — proceed with Phase 2 task list above.
5. Use `TaskCreate` to track Phase 2 subtasks (rules, service, hook, page, form, deploy config).

## Open questions for the user (ask at start of next session)

- Have you set up a Firebase project + pasted credentials into `.env`?
- Is there a logo / icon set I should drop into `public/` for the PWA manifest? (Currently references `/icon-192.png` and `/icon-512.png` which don't exist yet.)
- Should we commit Phase 1 to a branch and open a PR, or commit straight to `main`? (Nothing has been committed yet — `git status` will show all Phase 1 files as untracked.)
- Single-firm (just AME) or do you want multi-firm tenancy from day one? Current scaffold assumes single firm via `VITE_DEFAULT_FIRM_ID`.
