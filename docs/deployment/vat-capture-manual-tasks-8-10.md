# VAT Capture — Remaining Manual Deployment Tasks (8–10)

These are the **manual** cloud-console tasks that cannot be completed from this repository alone.

## Task 8 — Firebase + Vercel environment setup (one-time)

1. Create Firebase project:
   - Open <https://console.firebase.google.com>
   - **Add project** (e.g. `ame-vat-capture`)
   - Disable Google Analytics
2. Enable Firestore:
   - Firebase Console → **Build** → **Firestore Database** → **Create database**
   - Start in **Test mode**
   - Region: `europe-west1`
3. Enable Storage:
   - Firebase Console → **Build** → **Storage** → **Get started**
   - Start in **Test mode**
4. Register Web App + collect config:
   - Project settings (gear) → **General** → **Your apps** → **Add app** → **Web**
   - Copy `firebaseConfig` values
5. Set Vercel environment variables (Project → Settings → Environment Variables):

| Variable | Value source |
|---|---|
| `VITE_FIREBASE_API_KEY` | `firebaseConfig.apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `firebaseConfig.authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `firebaseConfig.projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `firebaseConfig.storageBucket` |
| `VITE_FIREBASE_APP_ID` | `firebaseConfig.appId` |
| `ANTHROPIC_API_KEY` | Anthropic Console API key |

6. Redeploy in Vercel:
   - Push a commit, or
   - Vercel dashboard → **Deployments** → **Redeploy**

## Task 9 — Firestore composite indexes

1. Open the deployed app in browser.
2. Open DevTools Console.
3. For each Firestore error with text like:
   - `The query requires an index. You can create it here: <URL>`
4. Open the URL and create the index.
5. Wait for index build completion (typically 1–5 minutes each).

## Task 10 — End-to-end verification on live URL

Verify all four VAT Capture tabs work in production:

- Receipts
- Capture (AI)
- VAT Schedule
- Bank Reconciliation

Suggested smoke test:

1. Upload/import a sample receipt.
2. Run OCR extraction (Capture tab).
3. Save and validate VAT fields.
4. Generate VAT schedule.
5. Import bank transactions and run match flow.
6. Confirm no console errors remain.
