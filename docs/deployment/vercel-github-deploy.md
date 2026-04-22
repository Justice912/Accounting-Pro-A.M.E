# Vercel + GitHub Deployment Guide (AME VAT Capture)

This repository contains an Electron desktop build **and** a Vite web build used for Vercel.
If deployments are stuck in draft/preview and not reaching production, use this checklist.

## 1) Verify what deploys to Vercel
- Vercel uses `npm run build:ci` (Vite static web output).
- Output directory is `dist/`.
- Entrypoint rewrite targets `index_accounting.html`.

## 2) Required Vercel project settings
In Vercel Project → Settings:
1. **Framework Preset**: Vite
2. **Build Command**: `npm run build:ci`
3. **Output Directory**: `dist`
4. **Production Branch**: `main`
5. **Node Version**: 20.x

If production branch is not `main`, pushes will stay as previews.

## 3) Required GitHub repository secrets
Add these secrets in GitHub repository settings:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

> `VERCEL_TOKEN` is required by the GitHub workflow added in `.github/workflows/vercel-deploy.yml`.

## 4) Run local readiness checks
```bash
npm run deploy:check
npm run build:ci
```

## 5) Understand preview vs production behavior
- Pull requests create **Preview** deployments.
- Pushes to `main` create **Production** deployments.
- If you merge PRs but production does not update, confirm:
  - branch really merged into `main`
  - Vercel project links to the same GitHub repo
  - no failed required checks in GitHub Actions

## 6) Common reasons updates stay in draft
1. PR merged into non-production branch.
2. Vercel project not linked to the same repository.
3. Missing `VERCEL_TOKEN` secret (CI can build but cannot deploy).
4. Build output not produced (`dist` missing due to build failure).
5. Environment variables missing in Vercel for selected environment.

## 7) Manual production deploy fallback
If automation fails, deploy manually from local machine:
```bash
npm i -g vercel
vercel login
vercel link
vercel pull --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```
