# AME VAT Capture

AI-powered receipt capture and VAT automation for AME Business Accountants.

> Phase 1 scaffold — auth shell only. See [CLAUDE.md](./CLAUDE.md) for the full architecture brief and phase checklist.

## Local development

```bash
cd ame-vat-capture
cp .env.example .env       # then fill in your Firebase project values
npm install
npm run dev
```

The app boots at http://localhost:5173.

### Firebase prerequisites

1. Create a Firebase project (or reuse an existing one).
2. Enable **Authentication** providers: Email/Password and Email link (passwordless).
3. Add `localhost` and your Vercel domain under **Authentication → Settings → Authorized domains**.
4. Enable **Firestore** (start in test mode while developing — security rules land in Phase 2).
5. Enable **Storage** (test mode for now).
6. Copy the web app config into `.env`.

## Deploy to Vercel

1. Import this subfolder as a Vercel project. Set the **Root Directory** to `ame-vat-capture/`.
2. Add every variable from `.env.example` in the Vercel dashboard. **`ANTHROPIC_API_KEY` and `WHATSAPP_*` must NOT be prefixed with `VITE_`.**
3. Push to `main` — Vercel builds with `npm run build` and serves `dist/` plus `/api/*` serverless functions.
4. Visit `/api/health` after deploy to confirm the function runtime is wired up.

## Phase status

- [x] **Phase 1** — Project scaffolding & auth
- [ ] Phase 2 — Firestore schema & client management
- [ ] Phase 3 — PWA receipt capture
- [ ] Phase 4 — AI receipt extraction
- [ ] Phase 5 — Accountant dashboard & receipt review
- [ ] Phase 6 — VAT schedule & export
- [ ] Phase 7 — Bank statement reconciliation
- [ ] Phase 8 — WhatsApp integration
- [ ] Phase 9 — SARS VAT verification & reminders
- [ ] Phase 10 — Polish, performance & deployment
