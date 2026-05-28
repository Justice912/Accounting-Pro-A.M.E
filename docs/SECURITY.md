# Security Hardening Notes — Web Deployment

This file documents the controls applied to the Vercel + Firebase web build.
The Electron desktop build does not use Firebase Auth, Vercel, or
`/api/*` — those paths apply only to the web bundle.

## Threat model recap

The web app exposes a static SPA on Vercel that talks to:

* Firebase Firestore + Storage (per-user data)
* `/api/extract-receipt` — Claude Vision OCR proxy (server-side key)
* `/api/claude` — Claude Messages streaming proxy (server-side key or BYOK)

Sensitive data: SARS VAT receipts, vendor names, financial totals, PII
captured from invoices.

## Controls

### 1. Firestore tenant isolation

`firestore.rules` enforces:

* `request.auth != null` on all reads and writes.
* `owner_uid == request.auth.uid` on every read / update / delete.
* `request.resource.data.owner_uid == request.auth.uid` on every create.
* `owner_uid` cannot be changed after creation.
* Default deny — anything not explicitly matched is denied.

The frontend (`src/api/webApi.js`) stamps `owner_uid` on every write and
adds `where('owner_uid', '==', uid)` to every collection query. Both
layers cooperate but the rules are the authoritative gatekeeper.

### 2. Authenticated server APIs

* `/api/extract-receipt` and `/api/claude` require
  `Authorization: Bearer <Firebase ID token>`.
* Tokens are verified server-side (`api/_lib/auth.js`) against Google's
  published JWKS, with full signature + iss + aud + exp + iat checks.
* `Content-Type` must be `application/json`.
* Per-user (uid) and per-IP sliding-window rate limits via
  `api/_lib/rateLimit.js`.
* Error responses are stable error codes — no upstream message leakage.

### 3. Removed legacy endpoints

The following endpoints were deleted because they accepted user-supplied
API keys without auth or rate limiting (open proxy risk):

* `api/ai/claude.js`
* `api/ai/openai.js`
* `api/ai/validate-key.js`

Frontend hooks were migrated to call the authenticated `/api/claude`
proxy. OpenAI support is temporarily disabled in `src/lib/aiProviders.js`
pending a replacement authenticated endpoint.

### 4. BYOK key storage

* Sidebar BYOK key: `sessionStorage` with a 30-minute TTL. Cleared on
  tab close, TTL expiry, or explicit Clear.
* Legacy header-dropdown key (`App_remote.jsx`): migrated from
  `localStorage` to `sessionStorage`; persistent copies are deleted on
  next load.
* The Settings panel warns the user that a pasted key is reachable by
  any script in the same origin and recommends the server-managed key
  on shared devices.

### 5. Security headers (Vercel)

`vercel.json` sets:

* `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY` (plus CSP `frame-ancestors 'none'`)
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy` blocking microphone / geolocation / FLoC
* `Cross-Origin-Opener-Policy: same-origin`
* `Content-Security-Policy`:
  * `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`
  * `connect-src` allowlists Firebase, Firestore, Identity Toolkit and
    Cloud Storage hosts
  * `script-src 'self' 'unsafe-inline'` — note: Vite-built apps inline
    small scripts; tighten by adding a hash-based nonce in a future pass
* `/api/*` paths additionally set `Cache-Control: no-store`.

## Required environment variables

Server (Vercel project → Settings → Environment Variables):

| Name                  | Purpose                                                     |
|-----------------------|-------------------------------------------------------------|
| `ANTHROPIC_API_KEY`   | Server-side Anthropic key used by `/api/claude` + extractor |
| `FIREBASE_PROJECT_ID` | Project id used for ID-token `aud` / `iss` validation       |

Client (Vite — must be prefixed `VITE_`):

| Name                          | Purpose                |
|-------------------------------|------------------------|
| `VITE_FIREBASE_API_KEY`       | Firebase web SDK       |
| `VITE_FIREBASE_AUTH_DOMAIN`   | Firebase Auth          |
| `VITE_FIREBASE_PROJECT_ID`    | Firestore + Storage    |
| `VITE_FIREBASE_STORAGE_BUCKET`| Storage bucket         |
| `VITE_FIREBASE_APP_ID`        | Firebase app id        |

## Deployment commands

```bash
# Firestore rules (one-time setup + on every change)
firebase deploy --only firestore:rules --project <your-project>

# Front-end + serverless functions
vercel deploy --prod
```

## Post-deploy verification

```bash
# 1. Unauthenticated request must be rejected:
curl -i -X POST https://<host>/api/extract-receipt \
  -H 'content-type: application/json' \
  -d '{"imageBase64":"AAAA","mimeType":"image/png"}'
# expect HTTP/2 401

curl -i -X POST https://<host>/api/claude \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"hi"}]}'
# expect HTTP/2 401

# 2. Removed endpoints must 404:
curl -i -X POST https://<host>/api/ai/openai      -d '{}'
curl -i -X POST https://<host>/api/ai/claude      -d '{}'
curl -i -X POST https://<host>/api/ai/validate-key -d '{}'
# expect HTTP/2 404

# 3. Security headers:
curl -sI https://<host>/ | grep -iE 'strict-transport|content-security|x-frame|referrer-policy|x-content-type-options'
```

Browser-side smoke checks:

* Open the app while signed out (or in private mode after wiping
  IndexedDB) — Firestore reads/writes should fail with permission
  denied until anon sign-in completes.
* Open DevTools → Application → Storage. There must be no `anthropic-api-key`
  in `localStorage`. It should appear in `sessionStorage` only after the
  user pastes one.
