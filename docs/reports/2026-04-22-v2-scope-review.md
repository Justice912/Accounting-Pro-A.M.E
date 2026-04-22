# AME VAT Capture v2.0 Scope Review (2026-04-22)

## Executive Summary
- The current codebase is primarily an **Electron + SQLite workstation** implementation.
- The shared v2.0 document describes a **Firebase + Vercel + serverless + PWA + WhatsApp** architecture.
- Result: several requested v2.0 items are present functionally, but not always in the exact prescribed stack.

## What is already present
- VAT capture dashboard with receipts, schedule, bank reconciliation, reminders.
- AI extraction flow routed through main-process handlers.
- VAT schedule generation and Excel export flow.
- Reminder system (in-app) with dismiss/snooze state and tests.

## Main architecture gaps vs v2.0 scope
1. **Data layer mismatch**
   - v2.0 requires Firestore + Storage; implementation uses SQLite + local files.
2. **Serverless API mismatch**
   - v2.0 requires `/api/*` Vercel routes with auth checks; implementation primarily uses Electron IPC handlers.
3. **Auth model mismatch**
   - v2.0 requires Firebase Auth and firm multi-tenancy rules.
4. **Client PWA + WhatsApp channel**
   - v2.0 requires client capture PWA and webhook ingestion.

## Deployment status interpretation
- Vercel can deploy the current **web Vite bundle** (`build:ci`), but this does not deploy the Electron runtime.
- If updates remain preview/draft, the likely issue is branch/project linkage or CI deploy token setup, not code compilation.

## Actions added in this PR
- Added GitHub Actions workflow for Vercel preview + production deployment.
- Added deployment guide and troubleshooting checklist.
- Added a deploy readiness check script (`npm run deploy:check`).

## Recommendation
- Decide one clear product lane before further development:
  1. **Electron-first lane** (desktop app, no Vercel serverless requirement), or
  2. **Spec-strict v2.0 lane** (Firebase + Vercel + API routes + PWA).
- Running both lanes in one repo is possible, but requires explicit boundaries and CI pipelines.
