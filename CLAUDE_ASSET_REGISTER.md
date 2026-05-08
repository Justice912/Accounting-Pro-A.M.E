# Asset Register — User & Developer Guide

The Asset Register tab is a full IFRS / SA-tax fixed-asset module: cost, accounting depreciation, SARS Wear & Tear, deferred tax, disposals, and Excel-exportable reports. Claude in the sidebar can read, add, dispose, and report on assets through tools.

---

## What it does

| Capability | Where |
| --- | --- |
| Per-asset record (cost, supplier, depreciation method, useful life, residual, tax section, GL accounts) | **Assets** sub-tab → "New asset" form |
| Monthly accounting depreciation schedule per asset, per year | **Depreciation** sub-tab |
| SARS Wear & Tear schedule per section per year | **Tax W&T** sub-tab |
| Deferred tax computation per asset (temporary difference × 27%) | **Deferred Tax** sub-tab |
| Disposal capture with IFRS gain/loss and SARS recoupment/CGT/scrapping allowance | "Dispose" button on each asset |
| Six canned reports, all date-range filterable, exportable to Excel | **Reports** sub-tab |
| Agentic operation through Claude (list, get, add, dispose, run reports) | Claude sidebar |

---

## Tax sections supported

The engine ships with the most common SARS Wear & Tear sections. Each section has a per-year allowance table and a flag for whether year-1 is pro-rated by months of use.

| Section | Description | Schedule |
| --- | --- | --- |
| `s11e_general_5yr` | General wear & tear (default for furniture/fittings) | 20/20/20/20/20, year-1 apportioned |
| `s11e_computers_3yr` | Computers per Practice Note 19 | 33⅓/33⅓/33⅓, year-1 apportioned |
| `s11e_vehicles_5yr` | Light passenger vehicles | 20/20/20/20/20, year-1 apportioned |
| `s12C_4yr` | New plant & machinery used in manufacture | 40/20/20/20, **year 1 not apportioned** |
| `s12C_used_5yr` | Used plant & machinery | 20/20/20/20/20, year 1 not apportioned |
| `s12B_3yr` | Renewable energy | 50/30/20, year 1 not apportioned |
| `s12E_sbc` | SBC accelerated allowance | 50/30/20, year 1 not apportioned |
| `s13quin_commercial` | Commercial buildings | 5% straight-line over 20 years |
| `s13sex_residential` | Residential buildings | 5% straight-line over 20 years |
| `none` | No tax depreciation (land, financial instruments) | — |

If the SARS Practice Note 19 rate for a specific asset differs from the default, override `useful_life_months` on the accounting side; the tax allowance is driven by the section, not the accounting life.

---

## Deferred tax

For every asset:
- **Carrying amount** = `cost − accumulated accounting depreciation`
- **Tax base** = `cost − cumulative SARS allowances claimed`
- **Temporary difference** = `Carrying amount − Tax base`
- **Deferred tax** = `Temporary difference × 27%`
  - **Positive** → deferred tax **liability** (book value > tax base; tax payable in future)
  - **Negative** → deferred tax **asset** (tax base > book value; future tax saving)

The Deferred Tax sub-tab shows totals at the top and per-asset rows underneath. Excel export from the Reports tab gives a static snapshot for AFS support.

---

## Disposals

When you click **Dispose** on an asset:

| Calculation | Formula |
| --- | --- |
| **IFRS gain/(loss)** | `proceeds − NBV at disposal date` |
| **Tax recoupment** (s8(4)(a)) | `min(proceeds, cost) − tax base`, capped at allowances claimed |
| **Capital gain** (CGT) | `max(proceeds − cost, 0)` |
| **Scrapping allowance** (s11(o)) | `max(tax base − proceeds, 0)` |

The disposal modal shows live previews of all four. After confirmation the asset stays on the register flagged as **disposed**, and is excluded from active depreciation but still appears in deferred-tax and historical reports.

---

## Reports

All reports filter by a from/to date range and export to `.xlsx` via the existing ExcelJS dependency.

1. **Asset listing (snapshot)** — current state of every asset with cost, NBV, tax base, status.
2. **Movement schedule (period)** — opening NBV → additions → depreciation → disposals → closing NBV. AFS note 8.
3. **Depreciation by asset (period)** — period charge, cumulative-to-end, NBV at end.
4. **Disposals (period)** — every disposal in the range with IFRS gain/loss and full SARS calc.
5. **Deferred tax summary (asof to-date)** — same as the Deferred Tax sub-tab but for an arbitrary asof date.
6. **Roll-up by category** — totals per category for class disclosures.

---

## Claude sidebar tools

The sidebar gets six new tools so you can drive the register in natural language:

| Tool | Use case |
| --- | --- |
| `list_assets` | "Show me all my computers" / "List disposed assets this year" |
| `get_asset` | "What's the carrying amount of MV-001?" |
| `add_asset` | "Add a new Toyota Hilux acquired 2026-01-15 for R450,000 with R67,500 VAT" |
| `dispose_asset` | "Dispose MV-001 on 2026-04-30 for R200,000" |
| `unset_disposal` | "Undo the disposal of MV-001" |
| `run_asset_report` | "Show me the asset movement schedule for this financial year" / "What's our total deferred tax?" |

`add_asset` requires only `name`, `acquisition_date`, and `cost_excl_vat`. Everything else falls back to: `category="Computers & IT Equipment"`, 5-year straight-line, s11(e) general, no residual. Override any of those on the asset form afterwards.

---

## Storage

Assets persist to `localStorage["accounting-assets"]` as a JSON array. Each asset belongs to a `companyId` and only shows on the register of that company. Clearing browser data wipes the register.

---

## Files

```
src/utils/assetCalculations.js                  ← Pure calc engine (no React)
src/pages/AssetRegister.jsx                     ← Page with 5 sub-tabs + modals
src/components/ClaudeSidebar/toolRegistry.js    ← +6 asset tools
src/components/ClaudeSidebar/systemPrompt.js    ← Updated tool list
CLAUDE_ASSET_REGISTER.md                        ← This guide
```

Wired into `src/App_remote.jsx`: a new `assets` state + `saveAssets()` persister, the `assets` tab in the navigation array, and `<AssetRegister />` rendered when `activeTab === 'assets'`. The `<ClaudeAppBridge />` exposes `assets` and `saveAssets` so the sidebar tools can read/write.

---

## What's next (not yet shipped)

These were called out in the original request as nice-to-haves and are easy follow-ups:

- Bulk CSV import / Excel template download.
- Per-asset photo upload (base64 → localStorage; or wire to existing VAT receipts storage).
- Auto-create asset draft from a Banking tab transaction.
- Component depreciation (split a single asset into components with separate lives).
- Mid-life impairment / revaluation.
- Per-company tax rate (currently hardcoded to 27% per the user's preference).
- IFRS revaluation model (currently cost model only).
