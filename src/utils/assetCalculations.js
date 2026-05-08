// Asset register calculation engine.
//
// Pure functions only — no React, no localStorage, no global state. Every
// helper takes the asset(s) and the period it cares about as arguments and
// returns numbers. This keeps the maths unit-testable and the same engine
// is used by the AssetRegister UI and by the Claude sidebar tools.
//
// Conventions:
// - All amounts are in ZAR, stored as numbers (REAL).
// - All dates are ISO strings 'YYYY-MM-DD'.
// - Months are zero-indexed inside Date but human-1-indexed in arguments.
// - "Asof date" means "as at the close of business on this date inclusive".
// - South African corporate tax rate fixed at 27% (since 1 April 2022).

export const COMPANY_TAX_RATE = 0.27;

// ---------- SARS Wear & Tear sections ----------
//
// Source: Income Tax Act + Practice Note 19. Numbers are deliberately
// conservative; if the practitioner has a SARS ruling that differs, they
// override usefulLifeYears on the asset and the engine respects that.
//
// year_pct: array where index 0 is year 1, index 1 is year 2, etc.
//           Sum should be 1.0 (full write-off over the life).
// apportion_year_one: if true, year 1 is pro-rated by months of use / 12;
//   if false (s12C/s12B/s12E), year 1 takes the full percentage even if
//   the asset was acquired part-way through the year.

export const TAX_SECTIONS = {
  none: {
    label: 'No tax depreciation',
    year_pct: [],
    apportion_year_one: true,
    note: 'Used for non-depreciable assets (land, financial instruments).',
  },
  s11e_general_5yr: {
    label: 's11(e) — General wear & tear (5 yr SL)',
    year_pct: [0.2, 0.2, 0.2, 0.2, 0.2],
    apportion_year_one: true,
    note: 'Default for furniture, fittings, and most office equipment.',
  },
  s11e_computers_3yr: {
    label: 's11(e) — Computers (3 yr SL)',
    year_pct: [1 / 3, 1 / 3, 1 / 3],
    apportion_year_one: true,
    note: 'Computers and computer equipment.',
  },
  s11e_vehicles_5yr: {
    label: 's11(e) — Motor vehicles (5 yr SL)',
    year_pct: [0.2, 0.2, 0.2, 0.2, 0.2],
    apportion_year_one: true,
    note: 'Light passenger vehicles per Practice Note 19.',
  },
  s12C_4yr: {
    label: 's12C — Plant & machinery (40/20/20/20)',
    year_pct: [0.4, 0.2, 0.2, 0.2],
    apportion_year_one: false,
    note: 'New or unused plant & machinery used in a process of manufacture.',
  },
  s12C_used_5yr: {
    label: 's12C — Used plant & machinery (5 yr SL)',
    year_pct: [0.2, 0.2, 0.2, 0.2, 0.2],
    apportion_year_one: false,
    note: 'Second-hand plant & machinery.',
  },
  s12B_3yr: {
    label: 's12B — Renewable energy (50/30/20)',
    year_pct: [0.5, 0.3, 0.2],
    apportion_year_one: false,
    note: 'Solar PV, wind, hydro and biomass equipment.',
  },
  s12E_sbc: {
    label: 's12E — SBC accelerated (50/30/20)',
    year_pct: [0.5, 0.3, 0.2],
    apportion_year_one: false,
    note: 'Plant brought into use by a Small Business Corporation.',
  },
  s13quin_commercial: {
    label: 's13quin — Commercial buildings (5%)',
    year_pct: Array(20).fill(0.05),
    apportion_year_one: true,
    note: 'New commercial buildings acquired on/after 1 April 2007.',
  },
  s13sex_residential: {
    label: 's13sex — Residential buildings (5%)',
    year_pct: Array(20).fill(0.05),
    apportion_year_one: true,
    note: 'New residential units, certain conditions apply.',
  },
};

// ---------- Asset categories (UI hints, not constraining) ----------
export const ASSET_CATEGORIES = [
  'Computers & IT Equipment',
  'Office Furniture & Fittings',
  'Office Equipment',
  'Motor Vehicles',
  'Plant & Machinery',
  'Tools & Equipment',
  'Buildings',
  'Land',
  'Leasehold Improvements',
  'Other',
];

export const DEPRECIATION_METHODS = [
  { value: 'straight-line', label: 'Straight-line' },
  { value: 'reducing-balance', label: 'Reducing balance' },
];

// ---------- Date helpers ----------

export function parseDate(s) {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(d) {
  if (!(d instanceof Date)) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Months between two dates, inclusive of the start month, returns at least
// 0. Used for usage-based pro-rata calculations.
export function monthsBetween(fromIso, toIso) {
  const a = parseDate(fromIso);
  const b = parseDate(toIso);
  if (!a || !b || b < a) return 0;
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
}

// Whole calendar months between two dates, exclusive of the end month.
// Used for monthly depreciation accrual.
export function monthsElapsed(fromIso, toIso) {
  const a = parseDate(fromIso);
  const b = parseDate(toIso);
  if (!a || !b || b < a) return 0;
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

// ---------- Accounting depreciation ----------

// Depreciable amount = cost (excl VAT) − residual value.
// Tax allowances are calculated on cost only (residual is ignored for SARS).
export function depreciableAmount(asset) {
  const cost = Number(asset.costExclVat) || 0;
  const residual = Number(asset.residualValue) || 0;
  return Math.max(0, cost - residual);
}

// Monthly depreciation for one asset. Both methods produce the same monthly
// charge over the asset's life — for reducing-balance we recompute against
// the diminishing carrying amount each month.
export function monthlyDepreciation(asset) {
  const lifeMonths = Math.max(1, Number(asset.usefulLifeMonths) || 0);
  if (asset.depreciationMethod === 'reducing-balance') {
    // Use the equivalent reducing-balance rate that fully writes off the
    // depreciable amount over the life: rate = 1 - (residual/cost)^(1/n)
    // For practical use we approximate by SL over the life when residual = 0.
    const cost = Number(asset.costExclVat) || 0;
    const residual = Number(asset.residualValue) || 0;
    if (cost <= 0) return 0;
    const annualRate = 1 - Math.pow(Math.max(residual, 1) / cost, 12 / lifeMonths);
    // Monthly equivalent of the annual rate.
    return Number.isFinite(annualRate) ? (cost * annualRate) / 12 : 0;
  }
  // Straight-line
  return depreciableAmount(asset) / lifeMonths;
}

// Total accounting depreciation accrued from the asset's depreciation start
// date up to (and including) the asof date. Capped at the depreciable
// amount so an asset is never written below its residual value.
export function accumulatedDepreciation(asset, asofIso) {
  const startIso = asset.depreciationStartDate || asset.acquisitionDate;
  const elapsed = monthsElapsed(startIso, asofIso);
  if (elapsed <= 0) return 0;

  if (asset.depreciationMethod === 'reducing-balance') {
    // Iterate month-by-month against carrying amount. Slow but correct, and
    // n is bounded by usefulLifeMonths so it's fine.
    const lifeMonths = Math.max(1, Number(asset.usefulLifeMonths) || 0);
    const cost = Number(asset.costExclVat) || 0;
    const residual = Number(asset.residualValue) || 0;
    const annualRate = 1 - Math.pow(Math.max(residual, 1) / Math.max(cost, 1), 12 / lifeMonths);
    let carrying = cost;
    let total = 0;
    const cap = Math.min(elapsed, lifeMonths);
    for (let i = 0; i < cap; i++) {
      const charge = (carrying * annualRate) / 12;
      total += charge;
      carrying -= charge;
      if (carrying <= residual) break;
    }
    return total;
  }

  const monthly = monthlyDepreciation(asset);
  return Math.min(monthly * elapsed, depreciableAmount(asset));
}

// Net book value = cost − accumulated depreciation.
export function netBookValue(asset, asofIso) {
  const cost = Number(asset.costExclVat) || 0;
  return cost - accumulatedDepreciation(asset, asofIso);
}

// Depreciation charged within a single period (fromIso..toIso inclusive).
export function depreciationInPeriod(asset, fromIso, toIso) {
  const startIso = asset.depreciationStartDate || asset.acquisitionDate;
  // The asset only depreciates within the period from max(start, from) to
  // min(disposalOrAsof, to).
  const periodFrom = startIso > fromIso ? startIso : fromIso;
  const disposalIso = asset.status === 'disposed' && asset.disposalDate ? asset.disposalDate : null;
  const periodTo = disposalIso && disposalIso < toIso ? disposalIso : toIso;
  if (periodTo < periodFrom) return 0;

  const accumStart = accumulatedDepreciation(asset, prevDay(periodFrom));
  const accumEnd = accumulatedDepreciation(asset, periodTo);
  return Math.max(0, accumEnd - accumStart);
}

function prevDay(iso) {
  const d = parseDate(iso);
  if (!d) return iso;
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

// ---------- Tax wear & tear (SARS) ----------

// SARS tax year starts 1 March. yearOfAssessmentEnd = financial year-end.
// For simplicity the engine treats the tax year as the calendar year aligned
// to acquisition; the schedule is keyed by year-since-acquisition rather
// than by SARS year-end. The practitioner reads off the right slice for
// their specific year of assessment.

// Tax allowance for one asset for a given year-since-acquisition (1-based).
// Returns 0 once the asset is fully written off or disposed.
export function taxAllowanceForYear(asset, yearSinceAcq /* 1-based */) {
  const sec = TAX_SECTIONS[asset.taxSection] || TAX_SECTIONS.none;
  const idx = yearSinceAcq - 1;
  if (idx < 0 || idx >= sec.year_pct.length) return 0;

  const cost = Number(asset.costExclVat) || 0;
  let pct = sec.year_pct[idx];

  if (yearSinceAcq === 1 && sec.apportion_year_one && asset.acquisitionDate) {
    // Pro-rate by months of use in the first 12-month period.
    const yearEnd = addMonths(asset.acquisitionDate, 12);
    const monthsUsed = monthsBetween(asset.acquisitionDate, prevDay(yearEnd));
    pct = pct * (monthsUsed / 12);
  }

  return cost * pct;
}

function addMonths(iso, n) {
  const d = parseDate(iso);
  if (!d) return iso;
  d.setMonth(d.getMonth() + n);
  return formatDate(d);
}

// Cumulative tax allowance from acquisition up to a given asof date.
export function taxAllowanceToDate(asset, asofIso) {
  if (!asset.acquisitionDate) return 0;
  const months = monthsBetween(asset.acquisitionDate, asofIso);
  if (months <= 0) return 0;
  const fullYears = Math.floor(months / 12);
  const partialMonths = months % 12;
  let total = 0;
  for (let y = 1; y <= fullYears; y++) total += taxAllowanceForYear(asset, y);
  if (partialMonths > 0) {
    const sec = TAX_SECTIONS[asset.taxSection] || TAX_SECTIONS.none;
    const nextYearAllowance = taxAllowanceForYear(asset, fullYears + 1);
    if (sec.apportion_year_one || fullYears > 0) {
      total += nextYearAllowance * (partialMonths / 12);
    }
  }
  const cost = Number(asset.costExclVat) || 0;
  return Math.min(total, cost);
}

// Tax base (also called tax written-down value) = cost − tax allowances claimed.
export function taxBase(asset, asofIso) {
  const cost = Number(asset.costExclVat) || 0;
  return cost - taxAllowanceToDate(asset, asofIso);
}

// ---------- Deferred tax ----------

// Temporary difference = carrying amount − tax base.
//   Positive => deferred tax LIABILITY (will pay tax in future).
//   Negative => deferred tax ASSET (will save tax in future).
export function temporaryDifference(asset, asofIso) {
  return netBookValue(asset, asofIso) - taxBase(asset, asofIso);
}

export function deferredTax(asset, asofIso, taxRate = COMPANY_TAX_RATE) {
  return temporaryDifference(asset, asofIso) * taxRate;
}

// ---------- Disposal ----------

// IFRS gain/loss on disposal = proceeds − carrying amount at disposal date.
export function disposalGainLoss(asset) {
  if (asset.status !== 'disposed' || !asset.disposalDate) return 0;
  const proceeds = Number(asset.disposalProceeds) || 0;
  const nbv = netBookValue(asset, asset.disposalDate);
  return proceeds - nbv;
}

// SARS recoupment on disposal under s8(4)(a) = limited to allowances claimed.
//   recoupment = min(proceeds − tax base, allowances claimed)
//   capital gain = max(proceeds − cost, 0)  (for CGT purposes)
//   scrapping allowance = max(tax base − proceeds, 0)  (s11(o))
export function taxRecoupment(asset) {
  if (asset.status !== 'disposed' || !asset.disposalDate) {
    return { recoupment: 0, capitalGain: 0, scrappingAllowance: 0 };
  }
  const cost = Number(asset.costExclVat) || 0;
  const proceeds = Number(asset.disposalProceeds) || 0;
  const tb = taxBase(asset, asset.disposalDate);
  const allowancesClaimed = cost - tb;
  const recoupment = Math.max(0, Math.min(proceeds, cost) - tb);
  const capitalGain = Math.max(0, proceeds - cost);
  const scrappingAllowance = Math.max(0, tb - proceeds);
  return {
    recoupment: Math.min(recoupment, allowancesClaimed),
    capitalGain,
    scrappingAllowance,
  };
}

// ---------- Movement schedule ----------

// Movement schedule for a list of assets between two ISO dates (inclusive).
// Returns the IFRS book-value walk: opening NBV + additions − depreciation
// − disposals (at NBV) = closing NBV. Useful for the AFS note 8 disclosure.
export function movementSchedule(assets, fromIso, toIso) {
  const inScope = assets.filter((a) => !a.companyId || true); // caller pre-filters
  const fromPrev = prevDay(fromIso);

  let openingCost = 0;
  let openingAccum = 0;
  let additionsCost = 0;
  let depExpense = 0;
  let disposalsCost = 0;
  let disposalsAccum = 0;
  let closingCost = 0;
  let closingAccum = 0;

  for (const a of inScope) {
    const cost = Number(a.costExclVat) || 0;
    const acquired = a.acquisitionDate || '';
    const disposed = a.status === 'disposed' && a.disposalDate ? a.disposalDate : null;

    // Opening: acquired before the period and not yet disposed.
    if (acquired && acquired <= fromPrev && (!disposed || disposed > fromPrev)) {
      openingCost += cost;
      openingAccum += accumulatedDepreciation(a, fromPrev);
    }
    // Additions: acquired within the period.
    if (acquired && acquired >= fromIso && acquired <= toIso) {
      additionsCost += cost;
    }
    // Depreciation: charge accrued in the period.
    depExpense += depreciationInPeriod(a, fromIso, toIso);

    // Disposals: disposed within the period.
    if (disposed && disposed >= fromIso && disposed <= toIso) {
      disposalsCost += cost;
      disposalsAccum += accumulatedDepreciation(a, disposed);
    }

    // Closing: held at end of period.
    if (acquired && acquired <= toIso && (!disposed || disposed > toIso)) {
      closingCost += cost;
      closingAccum += accumulatedDepreciation(a, toIso);
    }
  }

  return {
    opening: { cost: openingCost, accum: openingAccum, nbv: openingCost - openingAccum },
    additions: { cost: additionsCost },
    depreciation: { expense: depExpense },
    disposals: { cost: disposalsCost, accum: disposalsAccum, nbv: disposalsCost - disposalsAccum },
    closing: { cost: closingCost, accum: closingAccum, nbv: closingCost - closingAccum },
  };
}

// ---------- Aggregate snapshot ----------
export function registerSnapshot(assets, asofIso, taxRate = COMPANY_TAX_RATE) {
  let cost = 0;
  let accum = 0;
  let nbv = 0;
  let tb = 0;
  let dt = 0;
  let active = 0;
  let disposed = 0;
  for (const a of assets) {
    cost += Number(a.costExclVat) || 0;
    accum += accumulatedDepreciation(a, asofIso);
    nbv += netBookValue(a, asofIso);
    tb += taxBase(a, asofIso);
    dt += deferredTax(a, asofIso, taxRate);
    if (a.status === 'disposed') disposed++;
    else active++;
  }
  return {
    asof: asofIso,
    counts: { total: assets.length, active, disposed },
    totals: {
      cost,
      accumulated_depreciation: accum,
      net_book_value: nbv,
      tax_base: tb,
      temporary_difference: nbv - tb,
      deferred_tax: dt,
    },
  };
}

// ---------- Currency formatter ----------
export function fmtZAR(amount) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(
    Number(amount) || 0,
  );
}
