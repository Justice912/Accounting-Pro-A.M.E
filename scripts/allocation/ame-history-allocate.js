// AME Accounting (web app) — allocate bank transactions from VAT report history.
//
// Runs in the browser, on the page that holds the data. It needs no upload,
// no API key and no server.
//
// What it does, for one company and date range:
//   1. Reads that company's bank transactions still marked Unallocated.
//   2. Reads previous-period VAT reports you pick from your PC (the app's own
//      exports: VAT_Recon_*.csv, VAT_Report_*.csv or VAT_Recon_*.html).
//   3. Checks each transaction against those reports AND against the company's
//      saved bank rules, using the same scoring the app's Auto-allocate uses.
//   4. Proposes an account + VAT rate only when the evidence agrees. A
//      transaction with no match, or with conflicting evidence, stays Unallocated.
//   5. Shows a summary and lets you download a review sheet (CSV) BEFORE
//      anything is written. Nothing changes until you press "Apply".
//
// Usage: open the app, press F12 → Console, paste this file, press Enter,
// then run:
//   AME_ALLOCATE.open({ company: 'SMAY Investment', from: '2026-07-01', to: '2026-08-31' })
// and follow the panel that appears on the page.

(() => {
  const UNALLOCATED = new Set(['', 'Unallocated Expen', 'Unallocated Income']);
  const VAT_VALUES = [
    'No VAT',
    'Standard Rate (15.00%)',
    'Standard Rate (Capital Goods) (15.00%)',
    'Zero Rate (0.00%)',
    'Zero Rate Exports (0.00%)',
    'Exempt and Non-Supplies (0.00%)',
    'Export of Second Hand Goods (15.00%)',
    'Change in Use (15.00%)',
    'Goods and Services Imported (100.00%)',
    'Capital Goods Imported (100.00%)',
    'VAT Adjustments (100.00%)',
    'Manual VAT (Capital Goods)',
    'Manual VAT',
  ];

  // ---------- storage ----------
  const readJSON = (key, fallback) => {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw); // throw on corrupt data rather than guess
    return parsed;
  };

  // ---------- text helpers ----------
  // Lower-case, drop punctuation and tokens that are only digits (card
  // numbers, dates, references) so "POS PURCHASE ENGEN 4521 05/07" and
  // "POS PURCHASE ENGEN 9981 21/05" compare equal.
  const normalise = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((t) => t && !/^\d+$/.test(t))
      .join(' ')
      .trim();

  const num = (v) => {
    const n = parseFloat(String(v ?? '').replace(/[R\s,]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const parseCSVLine = (line) => {
    const out = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
      } else if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  // ---------- VAT history parsing ----------
  const directionFromTitle = (title) => {
    const t = String(title || '').toLowerCase();
    if (/output|sales/.test(t)) return 'received';
    if (/input|purchases/.test(t)) return 'spent';
    return null;
  };

  // Returns an app VAT value, or null when the text does not say which one.
  // Handles the app's names and loose labels such as "Standard 15%" or
  // "Zero Rated" that the VAT tab's CSV import stores as-is.
  const vatFromText = (text) => {
    const raw = String(text || '').trim();
    if (VAT_VALUES.includes(raw)) return raw;
    const t = raw.toLowerCase();
    if (/capital|import/.test(t)) return null; // ambiguous: capital 15% vs imports 100%
    if (/standard/.test(t)) return 'Standard Rate (15.00%)';
    if (/zero/.test(t)) return 'Zero Rate (0.00%)';
    if (/exempt|non-suppl/.test(t)) return 'Exempt and Non-Supplies (0.00%)';
    return null;
  };

  const rowFromCells = (cols, cells, title, file) => {
    const get = (name) => (cols[name] != null ? cells[cols[name]] : '');
    const description = get('description');
    const account = get('account');
    if (!description || !account) return null;
    const exclusive = num(get('exclusive'));
    const vat = num(get('vat'));
    // Last resort: a 15% VAT amount can only be standard rate. A zero amount
    // could be zero-rated, exempt or no VAT, so it stays unknown.
    const fromAmounts = exclusive > 0 && Math.abs(vat / exclusive - 0.15) < 0.005 ? 'Standard Rate (15.00%)' : null;
    return {
      file,
      section: title,
      date: get('date'),
      description,
      account,
      vatRate: vatFromText(get('vat rate')) || vatFromText(title) || fromAmounts,
      direction: directionFromTitle(title),
      inclusive: num(get('inclusive')),
    };
  };

  const indexColumns = (headers) => {
    const cols = {};
    headers.forEach((h, i) => { cols[String(h).toLowerCase().trim()] = i; });
    return cols.description != null && cols.account != null ? cols : null;
  };

  const parseCSVReport = (text, file) => {
    const rows = [];
    let title = '';
    let cols = null;
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) { cols = null; continue; }
      const cells = parseCSVLine(line);
      const headerCols = indexColumns(cells);
      if (headerCols) { cols = headerCols; continue; }
      if (!cols) {
        if (cells.filter(Boolean).length === 1) title = cells.filter(Boolean)[0];
        continue;
      }
      if (/^subtotal$/i.test(cells[0])) continue;
      const row = rowFromCells(cols, cells, title, file);
      if (row) rows.push(row);
    }
    return rows;
  };

  const parseHTMLReport = (text, file) => {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const rows = [];
    doc.querySelectorAll('table').forEach((table) => {
      const headers = [...table.querySelectorAll('thead th, tr:first-child th')].map((th) => th.textContent.trim());
      const cols = indexColumns(headers);
      if (!cols) return;
      let el = table.previousElementSibling;
      while (el && !/^H[1-4]$/.test(el.tagName)) el = el.previousElementSibling;
      const title = el ? el.textContent.trim() : '';
      table.querySelectorAll('tbody tr').forEach((tr) => {
        const cells = [...tr.querySelectorAll('td')].map((td) => td.textContent.trim());
        if (cells.length < headers.length) return; // subtotal rows use colspan
        const row = rowFromCells(cols, cells, title, file);
        if (row) rows.push(row);
      });
    });
    return rows;
  };

  const parseReport = (text, file) =>
    /<table/i.test(text) ? parseHTMLReport(text, file) : parseCSVReport(text, file);

  // ---------- matching ----------
  // Mirrors smartAllocateTransactions() Tier 1 in src/App_remote.jsx.
  const matchRule = (stmt, rules) => {
    const desc = (stmt.description || '').toLowerCase().trim();
    const payee = (stmt.payee || '').toLowerCase().trim();
    let best = null;
    let bestScore = 0;
    for (const rule of rules) {
      const rp = String(rule.pattern || '').toLowerCase();
      if (!rp) continue;
      let score = 0;
      if (desc && desc === rp) score = 100;
      else if (payee && payee === rp) score = 95;
      else if (desc && desc.includes(rp) && rp.length >= 4) score = 85;
      else if (desc && rp.includes(desc) && desc.length >= 5) score = 75;
      else if (payee && payee.includes(rp) && rp.length >= 4) score = 70;
      else if (payee && rp.includes(payee) && payee.length >= 4) score = 65;
      if (score === 0) continue;
      score += Math.min((rule.confidenceScore || 0) * 2, 20);
      if (score > bestScore && score >= 65) { bestScore = score; best = rule; }
    }
    if (!best) return null;
    return {
      account: best.accountName,
      vatRate: best.vatRate,
      pattern: best.pattern,
      score: bestScore,
      strong: (best.confidenceScore || 0) >= 3 && bestScore >= 75, // app's auto-allocate threshold
    };
  };

  const matchHistory = (stmt, history) => {
    const direction = (stmt.received || 0) > 0 ? 'received' : 'spent';
    const keys = [normalise(stmt.description), normalise(stmt.payee)].filter((k) => k.length >= 4);
    if (!keys.length) return null;
    const pool = history.filter((h) => !h.direction || h.direction === direction);
    let hits = pool.filter((h) => keys.includes(h.norm));
    let how = 'exact';
    if (!hits.length) {
      hits = pool.filter((h) => h.norm.length >= 6 && keys.some((k) => k.length >= 6 && (k.includes(h.norm) || h.norm.includes(k))));
      how = 'partial';
    }
    if (!hits.length) return null;
    const tally = new Map();
    for (const h of hits) {
      const k = `${h.account}|||${h.vatRate || ''}`;
      tally.set(k, (tally.get(k) || 0) + 1);
    }
    const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    const [topKey, topCount] = ranked[0];
    const [account, vatRate] = topKey.split('|||');
    const share = topCount / hits.length;
    const vatTally = new Map();
    for (const h of hits) vatTally.set(h.vatRate || '', (vatTally.get(h.vatRate || '') || 0) + 1);
    const [topVat, topVatCount] = [...vatTally.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      account,
      vatRate: vatRate || null,
      how,
      hits: hits.length,
      share,
      consistent: ranked.length === 1 || (share >= 0.75 && topCount >= 2),
      // VAT-only evidence, for report rows whose Account column holds a payee
      vatOnly: topVat || null,
      vatConsistent: vatTally.size === 1 || (topVatCount / hits.length >= 0.75 && topVatCount >= 2),
      alternatives: ranked.slice(1).map(([k, c]) => `${k.replace('|||', ' / ')} ×${c}`).join('; '),
    };
  };

  const propose = (stmt, ctx) => {
    const rule = matchRule(stmt, ctx.rules);
    const hist = matchHistory(stmt, ctx.history);
    const result = { stmt, rule, hist, account: null, vatRate: null, source: '', note: '' };
    const valid = (a, v) => ctx.accountNames.has(a) && VAT_VALUES.includes(v);

    const ruleOk = rule && rule.strong && valid(rule.account, rule.vatRate);
    const histFull = hist && hist.consistent && hist.vatRate && valid(hist.account, hist.vatRate);
    // History whose Account column is not a ledger account (e.g. a payee
    // name) still tells us the VAT rate that was used.
    const histVat = hist && !histFull && hist.vatConsistent && hist.vatOnly ? hist.vatOnly : null;

    if (histFull && ruleOk) {
      if (hist.account === rule.account && hist.vatRate === rule.vatRate) {
        Object.assign(result, { account: hist.account, vatRate: hist.vatRate, source: 'VAT history + rule' });
      } else {
        result.note = `VAT history (${hist.account} / ${hist.vatRate}) and bank rule (${rule.account} / ${rule.vatRate}) disagree`;
      }
    } else if (histFull) {
      Object.assign(result, { account: hist.account, vatRate: hist.vatRate, source: `VAT history (${hist.how})` });
      if (rule && !rule.strong) result.note = 'weak rule hint ignored';
    } else if (histVat && ruleOk) {
      if (histVat === rule.vatRate) {
        Object.assign(result, { account: rule.account, vatRate: rule.vatRate, source: 'bank rule, VAT confirmed by history' });
      } else {
        result.note = `bank rule VAT (${rule.vatRate}) differs from VAT history (${histVat})`;
      }
    } else if (ruleOk && !hist) {
      Object.assign(result, { account: rule.account, vatRate: rule.vatRate, source: 'bank rule' });
    } else if (ruleOk) {
      result.note = `bank rule matched but VAT history is unclear (${hist.account} / ${hist.vatRate || 'no rate'}${hist.alternatives ? '; ' + hist.alternatives : ''})`;
    } else if (hist && !hist.consistent) {
      result.note = `VAT history inconsistent: ${hist.account} / ${hist.vatRate} vs ${hist.alternatives}`;
    } else if (hist && !hist.vatRate) {
      result.note = 'VAT history row has no clear VAT rate';
    } else if (hist) {
      result.note = `history account "${hist.account}" is not in the chart of accounts and no bank rule confirms one`;
    } else if (rule && !rule.strong) {
      result.note = `only a weak rule match ("${rule.pattern}", score ${rule.score})`;
    } else {
      result.note = 'no match';
    }
    return result;
  };

  // ---------- data selection ----------
  const loadContext = ({ company, from, to }) => {
    const clients = readJSON('accounting-clients', []);
    const want = String(company || '').toLowerCase().trim();
    const matches = clients.filter((c) => String(c.name || '').toLowerCase().trim() === want);
    const found = matches.length ? matches : clients.filter((c) => String(c.name || '').toLowerCase().includes(want));
    if (found.length !== 1) {
      throw new Error(
        found.length
          ? `"${company}" matches ${found.length} clients: ${found.map((c) => c.name).join(', ')}. Use the exact name.`
          : `No client named "${company}". Clients: ${clients.map((c) => c.name).join(', ') || '(none)'}`
      );
    }
    const client = found[0];
    const statements = readJSON('accounting-bank-statements', []);
    const target = statements.filter(
      (s) => s.companyId === client.id && s.date >= from && s.date <= to && UNALLOCATED.has(s.selection || '')
    );
    const inRange = statements.filter((s) => s.companyId === client.id && s.date >= from && s.date <= to);
    const rules = readJSON('allocation-rules', []).filter((r) => r.companyId === client.id);
    const accountNames = new Set(readJSON('accounting-accounts', []).filter((a) => a.active !== false).map((a) => a.name));
    return { client, target, inRangeCount: inRange.length, rules, accountNames };
  };

  // ---------- output ----------
  const csvCell = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const reviewCSV = (proposals) => {
    const head = [
      'Date', 'Description', 'Payee', 'Spent', 'Received',
      'Proposed account', 'Proposed VAT rate', 'Source',
      'History account', 'History VAT', 'History matches', 'History other',
      'Rule account', 'Rule VAT', 'Rule pattern', 'Rule score', 'Note',
    ];
    const lines = proposals.map((p) => [
      p.stmt.date, p.stmt.description, p.stmt.payee, p.stmt.spent || 0, p.stmt.received || 0,
      p.account || 'Unallocated', p.vatRate || '', p.source,
      p.hist?.account || '', p.hist?.vatRate || '', p.hist ? `${p.hist.hits} (${p.hist.how})` : '', p.hist?.alternatives || '',
      p.rule?.account || '', p.rule?.vatRate || '', p.rule?.pattern || '', p.rule?.score || '', p.note,
    ].map(csvCell).join(','));
    return [head.join(','), ...lines].join('\n');
  };

  const download = (name, text, type) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Writes proposals into storage. Re-reads storage first so nothing saved
  // since the scan is lost, and only touches rows that are still unallocated.
  const applyProposals = (proposals) => {
    const raw = localStorage.getItem('accounting-bank-statements');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    download(`ame-bank-statements-before-allocation-${stamp}.json`, raw || '[]', 'application/json');
    const byId = new Map(proposals.filter((p) => p.account).map((p) => [p.stmt.id, p]));
    let changed = 0;
    const updated = JSON.parse(raw || '[]').map((s) => {
      const p = byId.get(s.id);
      if (!p || s.companyId !== p.stmt.companyId || !UNALLOCATED.has(s.selection || '')) return s;
      changed++;
      return {
        ...s,
        selection: p.account,
        vatRate: p.vatRate,
        allocationTier: 'history-import',
        allocationConfidence: p.source.startsWith('VAT history + rule') ? 95 : 85,
        matchedRule: p.source === 'bank rule' ? p.rule.pattern : `VAT history: ${p.hist.hits} match(es)`,
      };
    });
    localStorage.setItem('accounting-bank-statements', JSON.stringify(updated));
    return changed;
  };

  // ---------- on-page panel ----------
  // A file picker must be opened by a real click, so the steps run from buttons.
  const open = (opts) => {
    const options = { from: '2026-07-01', to: '2026-08-31', ...opts };
    document.getElementById('ame-allocate-panel')?.remove();
    const ctx = loadContext(options);

    const panel = document.createElement('div');
    panel.id = 'ame-allocate-panel';
    panel.style.cssText =
      'position:fixed;top:16px;right:16px;z-index:99999;width:380px;max-width:calc(100vw - 32px);' +
      'background:#fff;color:#0f172a;border:1px solid #cbd5e1;border-radius:10px;padding:16px;' +
      'box-shadow:0 10px 30px rgba(0,0,0,.2);font:14px/1.45 system-ui,sans-serif';
    const btn = 'display:block;width:100%;margin-top:8px;padding:8px;border-radius:6px;border:1px solid #334155;background:#f8fafc;cursor:pointer;font:inherit';
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>Allocate from VAT history</strong>
        <button id="ame-x" style="border:0;background:none;font-size:18px;cursor:pointer">×</button>
      </div>
      <div style="margin-top:6px">${ctx.client.name} · ${options.from} to ${options.to}<br>
        ${ctx.target.length} unallocated of ${ctx.inRangeCount} transactions · ${ctx.rules.length} bank rules</div>
      <button id="ame-pick" style="${btn}">1. Choose previous VAT reports…</button>
      <input id="ame-files" type="file" multiple accept=".csv,.html,.htm,text/csv,text/html" style="display:none">
      <div id="ame-status" style="margin-top:8px;white-space:pre-line"></div>
      <button id="ame-review" style="${btn};display:none">2. Download review sheet (CSV)</button>
      <button id="ame-apply" style="${btn};display:none;background:#065f46;color:#fff;border-color:#065f46">3. Apply allocations</button>`;
    document.body.appendChild(panel);

    const $ = (id) => panel.querySelector(`#${id}`);
    const status = $('ame-status');
    let proposals = [];

    $('ame-x').onclick = () => panel.remove();
    $('ame-pick').onclick = () => $('ame-files').click();
    $('ame-files').onchange = async (e) => {
      const files = [...e.target.files];
      const history = [];
      const perFile = [];
      for (const f of files) {
        const rows = parseReport(await f.text(), f.name);
        perFile.push(`${f.name}: ${rows.length} rows`);
        history.push(...rows);
      }
      history.forEach((h) => { h.norm = normalise(h.description); });
      const usable = history.filter((h) => h.norm.length >= 4);
      proposals = ctx.target.map((s) => propose(s, { ...ctx, history: usable }));
      const allocated = proposals.filter((p) => p.account);
      const bySource = {};
      allocated.forEach((p) => { bySource[p.source] = (bySource[p.source] || 0) + 1; });
      status.textContent =
        perFile.join('\n') +
        `\n\nHistory rows usable: ${usable.length}` +
        `\nWill allocate: ${allocated.length} of ${proposals.length}` +
        Object.entries(bySource).map(([k, v]) => `\n  · ${k}: ${v}`).join('') +
        `\nStays unallocated: ${proposals.length - allocated.length}` +
        (usable.length === 0 ? '\n\n⚠ No rows read. Are these the app\'s VAT report exports?' : '');
      console.table(proposals.map((p) => ({
        date: p.stmt.date, description: p.stmt.description, spent: p.stmt.spent, received: p.stmt.received,
        account: p.account || 'Unallocated', vat: p.vatRate || '', source: p.source, note: p.note,
      })));
      $('ame-review').style.display = 'block';
      $('ame-apply').style.display = allocated.length ? 'block' : 'none';
    };
    $('ame-review').onclick = () =>
      download(`${ctx.client.name.replace(/\W+/g, '_')}_allocation_review_${options.from}_to_${options.to}.csv`, reviewCSV(proposals), 'text/csv');
    $('ame-apply').onclick = () => {
      const n = proposals.filter((p) => p.account).length;
      if (!window.confirm(`Allocate ${n} transaction(s) for ${ctx.client.name}? A backup file downloads first. The page reloads afterwards.`)) return;
      const changed = applyProposals(proposals);
      status.textContent = `Allocated ${changed} transaction(s). Reloading…`;
      // Reload at once so the app's in-memory copy can't overwrite these changes.
      setTimeout(() => location.reload(), 1500);
    };
    return ctx;
  };

  window.AME_ALLOCATE = {
    open,
    _core: { normalise, parseCSVReport, parseReport, matchRule, matchHistory, propose, loadContext, reviewCSV, applyProposals },
  };
  console.log("AME_ALLOCATE loaded. Run AME_ALLOCATE.open({ company: 'SMAY Investment', from: '2026-07-01', to: '2026-08-31' })");
})();
