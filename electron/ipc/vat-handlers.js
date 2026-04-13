import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const VAT_RATE = 0.15;

/** SARS VAT number: 10 digits starting with 4 */
function validateVatNumberFormat(vatNum) {
  return /^4\d{9}$/.test((vatNum || '').replace(/\s/g, ''));
}

/**
 * Derive VAT period string (YYYY-MM) from a date string.
 * Category B bi-monthly: Jan/Feb→01, Mar/Apr→03, May/Jun→05, Jul/Aug→07, Sep/Oct→09, Nov/Dec→11
 */
function getVatPeriod(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();
  const periodStart = month % 2 === 0 ? month - 1 : month;
  return `${year}-${String(periodStart).padStart(2, '0')}`;
}

function getPeriodDates(period) {
  const [year, month] = period.split('-').map(Number);
  const startMonth = month % 2 === 0 ? month - 1 : month;
  const endMonth = startMonth + 1;
  const lastDay = new Date(year, endMonth, 0).getDate();
  return {
    start: `${year}-${String(startMonth).padStart(2, '0')}-01`,
    end: `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`,
  };
}

function computeFlags(data) {
  const flags = [];
  const net = Number(data.total_excl_vat) || 0;
  const vat = Number(data.vat_amount) || 0;
  const gross = Number(data.total_incl_vat) || 0;
  if (gross > 0 && Math.abs(net + vat - gross) > 0.02) flags.push('vat_mismatch');
  if (data.supplier_vat_number && !validateVatNumberFormat(data.supplier_vat_number)) {
    flags.push('invalid_vat_format');
  }
  if (data.ai_confidence !== undefined && data.ai_confidence !== null && data.ai_confidence < 0.7) {
    flags.push('low_confidence');
  }
  if (data.invoice_date) {
    const d = new Date(data.invoice_date);
    const now = new Date();
    if (d > now) flags.push('future_date');
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    if (d < fiveYearsAgo) flags.push('old_date');
  }
  return flags;
}

/**
 * Parse a bank statement CSV, detecting common SA bank formats automatically.
 */
function parseBankCSV(csv) {
  const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return [];

  const header = lines[0]
    .split(',')
    .map(h => h.replace(/"/g, '').trim().toLowerCase());

  let dateIdx = -1, descIdx = -1, amountIdx = -1, refIdx = -1, debitIdx = -1, creditIdx = -1;
  let bankName = 'Unknown';

  header.forEach((h, i) => {
    if (h === 'date') dateIdx = i;
    if (h.includes('description') || h === 'transaction') descIdx = i;
    if (h === 'amount') amountIdx = i;
    if (h.includes('reference') || h === 'ref') refIdx = i;
    if (h === 'debit') debitIdx = i;
    if (h === 'credit') creditIdx = i;
  });

  // Detect bank by header pattern
  if (header.includes('transaction description')) bankName = 'Nedbank';
  else if (header.includes('reference') && header.includes('description')) bankName = 'ABSA';
  else if (header.includes('transaction') && (header.includes('debit') || header.includes('credit'))) bankName = 'Capitec';
  else if (header.includes('amount') && header.indexOf('amount') === 1) bankName = 'FNB';
  else if (header.includes('description') && header.includes('amount')) bankName = 'Standard Bank';

  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
    if (cols.length < 2) continue;

    const dateRaw = dateIdx >= 0 ? cols[dateIdx] : '';
    if (!dateRaw) continue;

    // Normalise date (various SA formats: DD/MM/YYYY, YYYY-MM-DD, DD Mon YYYY)
    let dateNorm = dateRaw;
    const dmy = dateRaw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) dateNorm = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

    const desc = descIdx >= 0 ? cols[descIdx] : '';

    let amount = 0;
    if (amountIdx >= 0) {
      amount = -Math.abs(parseFloat((cols[amountIdx] || '').replace(/[R,\s]/g, '')) || 0);
    } else if (debitIdx >= 0) {
      const debit = parseFloat((cols[debitIdx] || '').replace(/[R,\s]/g, '')) || 0;
      amount = debit > 0 ? -debit : 0;
    }

    const ref = refIdx >= 0 ? cols[refIdx] : '';
    const d = new Date(dateNorm);
    const period = !isNaN(d) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : null;

    transactions.push({ date: dateNorm, description: desc, amount, reference: ref, bankName, period });
  }

  return transactions;
}

export default function registerVatHandlers(ipcMain, services) {
  const { database, keychain } = services;

  // ── Receipts ──────────────────────────────────────────────────────────────

  /** List receipts for a client, optionally filtered by period / status */
  ipcMain.handle('vat:receipt:list', async (event, clientId, filters = {}) => {
    try {
      let sql = 'SELECT * FROM vat_receipts WHERE client_id = ?';
      const params = [clientId];
      if (filters.period) { sql += ' AND vat_period = ?'; params.push(filters.period); }
      if (filters.status && filters.status !== 'all') { sql += ' AND status = ?'; params.push(filters.status); }
      sql += ' ORDER BY invoice_date DESC, created_at DESC';
      return database.getAll(sql, params);
    } catch {
      return [];
    }
  });

  /** Get a single receipt by ID */
  ipcMain.handle('vat:receipt:get', async (event, id) => {
    try {
      return database.getOne('SELECT * FROM vat_receipts WHERE id = ?', [id]);
    } catch {
      return null;
    }
  });

  /** Create or update a receipt (upsert) */
  ipcMain.handle('vat:receipt:save', async (event, data) => {
    try {
      const isNew = !data.id;
      const id = data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const vatPeriod = data.vat_period || getVatPeriod(data.invoice_date);
      const mathsValid = (() => {
        const n = Number(data.total_excl_vat) || 0;
        const v = Number(data.vat_amount) || 0;
        const g = Number(data.total_incl_vat) || 0;
        return g > 0 ? (Math.abs(n + v - g) <= 0.02 ? 1 : 0) : 1;
      })();
      const vatNumberValid = data.supplier_vat_number
        ? (validateVatNumberFormat(data.supplier_vat_number) ? 1 : 0)
        : null;
      const flags = data.flags || computeFlags(data);

      const record = {
        id,
        client_id: data.client_id,
        capture_method: data.capture_method || 'manual',
        image_path: data.image_path || null,
        supplier_name: data.supplier_name || null,
        supplier_vat_number: data.supplier_vat_number || null,
        supplier_address: data.supplier_address || null,
        invoice_number: data.invoice_number || null,
        invoice_date: data.invoice_date || null,
        total_incl_vat: Number(data.total_incl_vat) || 0,
        vat_amount: Number(data.vat_amount) || 0,
        total_excl_vat: Number(data.total_excl_vat) || 0,
        line_items: data.line_items ? JSON.stringify(data.line_items) : null,
        vat_number_valid: vatNumberValid,
        maths_valid: mathsValid,
        ai_confidence: data.ai_confidence != null ? Number(data.ai_confidence) : null,
        flags: JSON.stringify(Array.isArray(flags) ? flags : []),
        expense_category: data.expense_category || 'General',
        vat_type: data.vat_type || 'standard',
        vat_period: vatPeriod,
        status: data.status || 'pending',
        review_notes: data.review_notes || null,
        bank_transaction_id: data.bank_transaction_id || null,
        is_reconciled: data.is_reconciled ? 1 : 0,
        updated_at: now,
      };

      if (!isNew) {
        const setClauses = Object.keys(record)
          .filter(k => k !== 'id' && k !== 'client_id' && k !== 'created_at')
          .map(k => `${k} = ?`).join(', ');
        const vals = Object.keys(record)
          .filter(k => k !== 'id' && k !== 'client_id' && k !== 'created_at')
          .map(k => record[k]);
        vals.push(id);
        database.run(`UPDATE vat_receipts SET ${setClauses} WHERE id = ?`, vals);
      } else {
        record.created_at = now;
        database.insert('vat_receipts', record);
      }
      return { success: true, id };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  /** Delete a receipt */
  ipcMain.handle('vat:receipt:delete', async (event, id) => {
    try {
      database.run('DELETE FROM vat_receipts WHERE id = ?', [id]);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  /** Update status (pending/reviewed/approved/rejected/query) */
  ipcMain.handle('vat:receipt:update-status', async (event, id, status, notes) => {
    try {
      const now = new Date().toISOString();
      database.run(
        'UPDATE vat_receipts SET status = ?, review_notes = ?, reviewed_at = ?, updated_at = ? WHERE id = ?',
        [status, notes || null, now, now, id]
      );
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  /** Bulk update status for multiple receipts */
  ipcMain.handle('vat:receipt:bulk-status', async (event, ids, status) => {
    try {
      const now = new Date().toISOString();
      const placeholders = ids.map(() => '?').join(', ');
      database.run(
        `UPDATE vat_receipts SET status = ?, reviewed_at = ?, updated_at = ? WHERE id IN (${placeholders})`,
        [status, now, now, ...ids]
      );
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── Image Import ─────────────────────────────────────────────────────────

  /** Open file picker, copy image to userData/vat-receipts/, return the local path */
  ipcMain.handle('vat:receipt:import-image', async () => {
    try {
      const { dialog, app, BrowserWindow } = await import('electron');
      const win = BrowserWindow.getFocusedWindow();
      const result = await dialog.showOpenDialog(win, {
        title: 'Select Receipt / Invoice Image',
        filters: [
          { name: 'Images & PDFs', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });
      if (result.cancelled || !result.filePaths.length) {
        return { success: false, cancelled: true };
      }
      const sourcePath = result.filePaths[0];
      const destDir = path.join(app.getPath('userData'), 'vat-receipts');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const ext = path.extname(sourcePath);
      const destName = `${crypto.randomUUID()}${ext}`;
      const destPath = path.join(destDir, destName);
      fs.copyFileSync(sourcePath, destPath);
      return { success: true, imagePath: destPath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── AI OCR Extraction ────────────────────────────────────────────────────

  /**
   * Send a receipt image to Claude Vision API and extract structured invoice data.
   * Returns { success, extracted } or { success: false, error }.
   */
  ipcMain.handle('vat:receipt:extract', async (event, imagePath) => {
    try {
      const apiKey = keychain.getApiKey('claude');
      if (!apiKey) throw new Error('Claude API key not configured. Go to Settings to add it.');
      if (!fs.existsSync(imagePath)) throw new Error('Image file not found: ' + imagePath);

      const ext = path.extname(imagePath).toLowerCase().slice(1);
      const mediaTypeMap = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg',
        png: 'image/png', gif: 'image/gif', webp: 'image/webp',
      };
      if (!mediaTypeMap[ext] && ext !== 'pdf') {
        throw new Error(`Unsupported image type: .${ext}`);
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mediaType = mediaTypeMap[ext] || 'image/jpeg';

      const extractionPrompt = `You are an expert South African bookkeeper and OCR specialist.
Analyse this receipt/invoice image and extract the following fields:

1. supplier_name: The business/company name on the receipt
2. supplier_vat_number: The VAT number (10 digits, starts with 4)
3. supplier_address: Full address if visible
4. invoice_number: Invoice or receipt number
5. invoice_date: Date in YYYY-MM-DD format
6. total_incl_vat: Total amount including VAT in ZAR (number only, no currency symbol)
7. vat_amount: VAT amount in ZAR (number only)
8. total_excl_vat: Total amount excluding VAT in ZAR (number only)
9. line_items: Array of {description, qty, unitPrice, lineTotal}
10. confidence: Your confidence in the extraction (0.0 to 1.0)

If a field is not visible or unclear, set it to null.
If only total_incl_vat is visible, calculate:
  total_excl_vat = total_incl_vat / 1.15
  vat_amount = total_incl_vat - total_excl_vat

Respond ONLY with valid JSON — no markdown fences, no explanation, just the JSON object.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64Image },
                },
                { type: 'text', text: extractionPrompt },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Claude API error (${response.status}): ${errBody}`);
      }

      const apiData = await response.json();
      const rawText = apiData.content?.[0]?.text || '{}';
      const cleaned = rawText
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '').trim();

      const extracted = JSON.parse(cleaned);

      // Post-extraction validation flags
      const flags = computeFlags(extracted);

      // Duplicate check (same invoice_number + supplier_name already in DB)
      if (extracted.invoice_number && extracted.supplier_name) {
        const dup = database.getOne(
          'SELECT id FROM vat_receipts WHERE invoice_number = ? AND supplier_name = ?',
          [extracted.invoice_number, extracted.supplier_name]
        );
        if (dup) flags.push('duplicate_suspected');
      }

      return { success: true, extracted: { ...extracted, flags } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── SARS VAT Verification ────────────────────────────────────────────────

  ipcMain.handle('vat:verify-vat', async (event, vatNumber) => {
    try {
      const clean = (vatNumber || '').replace(/\s/g, '');
      if (!validateVatNumberFormat(clean)) {
        return { valid: false, vendorName: null, reason: 'Invalid format — must be 10 digits starting with 4' };
      }
      // Check local cache first
      const cached = database.getOne(
        'SELECT * FROM vat_verified_vendors WHERE vat_number = ?', [clean]
      );
      if (cached) {
        return { valid: !!cached.is_valid, vendorName: cached.vendor_name, cached: true };
      }
      // Attempt SARS live lookup — gracefully degrade if unavailable
      try {
        const resp = await fetch(
          `https://secure.sarsefiling.co.za/vatvendorsearch/api?vatNumber=${clean}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (resp.ok) {
          const result = await resp.json();
          const valid = result?.registrationStatus === 'Active';
          const vendorName = result?.tradingName || result?.name || null;
          database.run(
            'INSERT OR REPLACE INTO vat_verified_vendors (vat_number, vendor_name, is_valid, verified_at) VALUES (?, ?, ?, ?)',
            [clean, vendorName, valid ? 1 : 0, new Date().toISOString()]
          );
          return { valid, vendorName };
        }
      } catch {
        // SARS endpoint unavailable — return inconclusive
      }
      return { valid: null, vendorName: null, reason: 'SARS verification unavailable — result inconclusive' };
    } catch (e) {
      return { valid: null, vendorName: null, reason: e.message };
    }
  });

  // ── Bank Statement Import ────────────────────────────────────────────────

  ipcMain.handle('vat:bank:import', async (event, clientId) => {
    try {
      const { dialog, BrowserWindow } = await import('electron');
      const win = BrowserWindow.getFocusedWindow();
      const result = await dialog.showOpenDialog(win, {
        title: 'Import Bank Statement (CSV)',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile'],
      });
      if (result.cancelled || !result.filePaths.length) {
        return { success: false, cancelled: true };
      }
      const csv = fs.readFileSync(result.filePaths[0], 'utf-8');
      const transactions = parseBankCSV(csv);
      let imported = 0;
      for (const txn of transactions) {
        try {
          database.run(
            `INSERT OR IGNORE INTO vat_bank_transactions
             (id, client_id, txn_date, description, amount, reference, bank_name, statement_period, imported_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              crypto.randomUUID(), clientId,
              txn.date, txn.description, txn.amount,
              txn.reference || null, txn.bankName || 'Unknown',
              txn.period || null, new Date().toISOString(),
            ]
          );
          imported++;
        } catch { /* skip duplicate rows */ }
      }
      // Auto-match by amount + date proximity
      autoMatchTransactions(database, clientId);
      return { success: true, imported };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('vat:bank:list', async (event, clientId, filters = {}) => {
    try {
      let sql = 'SELECT * FROM vat_bank_transactions WHERE client_id = ?';
      const params = [clientId];
      if (filters.period) { sql += ' AND statement_period = ?'; params.push(filters.period); }
      if (filters.matched !== undefined) {
        sql += ' AND is_matched = ?';
        params.push(filters.matched ? 1 : 0);
      }
      sql += ' ORDER BY txn_date DESC';
      return database.getAll(sql, params);
    } catch {
      return [];
    }
  });

  /** Manually match / unmatch a bank transaction to a receipt */
  ipcMain.handle('vat:bank:match', async (event, txnId, receiptId) => {
    try {
      if (receiptId) {
        database.run(
          'UPDATE vat_bank_transactions SET matched_receipt_id = ?, is_matched = 1 WHERE id = ?',
          [receiptId, txnId]
        );
        database.run(
          'UPDATE vat_receipts SET bank_transaction_id = ?, is_reconciled = 1, updated_at = ? WHERE id = ?',
          [txnId, new Date().toISOString(), receiptId]
        );
      } else {
        const txn = database.getOne('SELECT * FROM vat_bank_transactions WHERE id = ?', [txnId]);
        if (txn?.matched_receipt_id) {
          database.run(
            'UPDATE vat_receipts SET bank_transaction_id = NULL, is_reconciled = 0 WHERE id = ?',
            [txn.matched_receipt_id]
          );
        }
        database.run(
          'UPDATE vat_bank_transactions SET matched_receipt_id = NULL, is_matched = 0 WHERE id = ?',
          [txnId]
        );
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ── VAT Schedule ─────────────────────────────────────────────────────────

  ipcMain.handle('vat:schedule:generate', async (event, clientId, period) => {
    try {
      const receipts = database.getAll(
        'SELECT * FROM vat_receipts WHERE client_id = ? AND vat_period = ?',
        [clientId, period]
      );
      const approved = receipts.filter(r => r.status === 'approved');
      const pending = receipts.filter(r => r.status === 'pending');
      const flagged = receipts.filter(r => {
        try { return JSON.parse(r.flags || '[]').length > 0; } catch { return false; }
      });

      const inputStandard = approved
        .filter(r => r.vat_type === 'standard' || r.vat_type === 'zero')
        .reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);
      const inputCapital = approved
        .filter(r => r.vat_type === 'capital')
        .reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);
      const inputTotal = inputStandard + inputCapital;
      const periodDates = getPeriodDates(period);
      const scheduleId = `${clientId}_${period}`;

      database.run(
        `INSERT OR REPLACE INTO vat_schedules
         (id, client_id, period, period_start, period_end, status,
          input_vat_standard, input_vat_capital, input_vat_total,
          output_vat_standard, output_vat_total, net_vat,
          receipt_count, approved_count, pending_count, flagged_count,
          updated_at)
         VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?)`,
        [
          scheduleId, clientId, period, periodDates.start, periodDates.end,
          inputStandard, inputCapital, inputTotal,
          -inputTotal,
          receipts.length, approved.length, pending.length, flagged.length,
          new Date().toISOString(),
        ]
      );
      return { success: true, scheduleId };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('vat:schedule:get', async (event, clientId, period) => {
    try {
      const scheduleId = `${clientId}_${period}`;
      const schedule = database.getOne('SELECT * FROM vat_schedules WHERE id = ?', [scheduleId]);
      const receipts = database.getAll(
        `SELECT * FROM vat_receipts WHERE client_id = ? AND vat_period = ?
         ORDER BY expense_category ASC, invoice_date ASC`,
        [clientId, period]
      );
      return { schedule: schedule || null, receipts };
    } catch {
      return { schedule: null, receipts: [] };
    }
  });

  // ── Excel Export ─────────────────────────────────────────────────────────

  ipcMain.handle('vat:export:excel', async (event, clientId, period) => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const { dialog, BrowserWindow } = await import('electron');
      const win = BrowserWindow.getFocusedWindow();

      const client = database.getOne('SELECT * FROM clients WHERE id = ?', [clientId]);
      const receipts = database.getAll(
        `SELECT * FROM vat_receipts WHERE client_id = ? AND vat_period = ?
         ORDER BY invoice_date ASC`,
        [clientId, period]
      );
      const approved = receipts.filter(r => r.status === 'approved');

      const wb = new ExcelJS.Workbook();
      wb.creator = 'AME Pro Workstation';
      wb.created = new Date();

      // Colour palette matching spec
      const NAVY = '1B4F72';
      const WHITE = 'FFFFFF';
      const LIGHT_GREY = 'F2F2F2';

      function headerStyle(ws, row) {
        row.eachCell(cell => {
          cell.font = { bold: true, color: { argb: WHITE } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
          cell.alignment = { horizontal: 'center' };
          cell.border = {
            bottom: { style: 'thin', color: { argb: '000000' } },
          };
        });
      }

      // ─ Sheet 1: Summary ─
      const summary = wb.addWorksheet('VAT Schedule Summary');
      summary.columns = [
        { key: 'label', width: 35 },
        { key: 'value', width: 28 },
      ];
      const sumTitle = summary.addRow(['AME VAT Schedule — Input Tax Summary', '']);
      sumTitle.font = { bold: true, size: 13, color: { argb: NAVY } };
      summary.mergeCells('A1:B1');
      summary.addRow([]);
      summary.addRow(['Client', client?.name || clientId]);
      summary.addRow(['VAT Number', client?.vat_number || 'N/A']);
      summary.addRow(['Period', period]);
      const pd = getPeriodDates(period);
      summary.addRow(['Period Start', pd.start]);
      summary.addRow(['Period End', pd.end]);
      summary.addRow([]);
      const hdr = summary.addRow(['Description', 'Amount (ZAR)']);
      headerStyle(summary, hdr);

      const totalExcl = approved.reduce((s, r) => s + (Number(r.total_excl_vat) || 0), 0);
      const totalVat = approved.reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);
      const totalIncl = approved.reduce((s, r) => s + (Number(r.total_incl_vat) || 0), 0);
      const stdVat = approved.filter(r => r.vat_type === 'standard').reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);
      const capVat = approved.filter(r => r.vat_type === 'capital').reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);

      const fmt = v => Number(v.toFixed(2));
      summary.addRow(['Total Receipts', receipts.length]);
      summary.addRow(['Approved Receipts', approved.length]);
      summary.addRow(['Pending / Unreviewed', receipts.filter(r => r.status === 'pending').length]);
      summary.addRow([]);
      summary.addRow(['Total Purchases (Excl VAT) — Field 14', fmt(totalExcl)]);
      summary.addRow(['Input VAT — Standard Rated — Field 15', fmt(stdVat)]);
      summary.addRow(['Input VAT — Capital Goods — Field 16', fmt(capVat)]);
      const totRow = summary.addRow(['Total Input VAT Claimable', fmt(totalVat)]);
      totRow.font = { bold: true };
      totRow.getCell(2).font = { bold: true, color: { argb: '27AE60' } };
      summary.addRow(['Total Purchases (Incl VAT)', fmt(totalIncl)]);

      // Number format column B
      summary.getColumn('B').numFmt = '#,##0.00';

      // ─ Sheet 2: Receipt Detail ─
      const detail = wb.addWorksheet('Receipt Detail');
      detail.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Supplier', key: 'supplier', width: 32 },
        { header: 'Supplier VAT No.', key: 'vatNo', width: 18 },
        { header: 'Invoice No.', key: 'invoiceNo', width: 18 },
        { header: 'Category', key: 'category', width: 18 },
        { header: 'VAT Type', key: 'vatType', width: 12 },
        { header: 'Excl VAT', key: 'excl', width: 14 },
        { header: 'VAT Amount', key: 'vat', width: 14 },
        { header: 'Incl VAT', key: 'incl', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Flags', key: 'flags', width: 30 },
      ];
      headerStyle(detail, detail.getRow(1));

      receipts.forEach((r, idx) => {
        const row = detail.addRow({
          date: r.invoice_date || '',
          supplier: r.supplier_name || '',
          vatNo: r.supplier_vat_number || '',
          invoiceNo: r.invoice_number || '',
          category: r.expense_category || '',
          vatType: r.vat_type || '',
          excl: Number(r.total_excl_vat) || 0,
          vat: Number(r.vat_amount) || 0,
          incl: Number(r.total_incl_vat) || 0,
          status: r.status,
          flags: (() => { try { return JSON.parse(r.flags || '[]').join(', '); } catch { return ''; } })(),
        });
        if (idx % 2 === 1) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREY } };
          });
        }
        // Colour status cell
        const statusCell = row.getCell('status');
        const colours = { approved: '27AE60', rejected: 'E74C3C', pending: 'F39C12', query: '3498DB' };
        if (colours[r.status]) {
          statusCell.font = { bold: true, color: { argb: colours[r.status] } };
        }
      });

      // Totals row
      const totDetail = detail.addRow({
        date: '', supplier: 'TOTALS', vatNo: '', invoiceNo: '', category: '', vatType: '',
        excl: fmt(totalExcl), vat: fmt(totalVat), incl: fmt(totalIncl), status: '', flags: '',
      });
      totDetail.font = { bold: true };
      totDetail.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D6EAF8' } };

      ['excl', 'vat', 'incl'].forEach(k => {
        detail.getColumn(k).numFmt = '#,##0.00';
      });

      // Save file
      const saveResult = await dialog.showSaveDialog(win, {
        title: 'Export VAT Schedule',
        defaultPath: `VAT_Schedule_${(client?.name || clientId).replace(/[/\\?%*:|"<>]/g, '_')}_${period}.xlsx`,
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
      });
      if (saveResult.cancelled) return { success: false, cancelled: true };
      await wb.xlsx.writeFile(saveResult.filePath);
      return { success: true, filePath: saveResult.filePath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
}

// ── Auto-match helper ────────────────────────────────────────────────────────

/**
 * Try to auto-match unmatched bank transactions to unreconciled receipts
 * by amount (within R1 tolerance) and date (within 2 days).
 */
function autoMatchTransactions(database, clientId) {
  const unmatched = database.getAll(
    'SELECT * FROM vat_bank_transactions WHERE client_id = ? AND is_matched = 0',
    [clientId]
  );
  const unreconciled = database.getAll(
    `SELECT * FROM vat_receipts WHERE client_id = ? AND is_reconciled = 0 AND status != 'rejected'`,
    [clientId]
  );

  for (const txn of unmatched) {
    const txnAmt = Math.abs(Number(txn.amount));
    const txnDate = new Date(txn.txn_date);
    if (isNaN(txnDate)) continue;

    for (const receipt of unreconciled) {
      const rAmt = Number(receipt.total_incl_vat);
      const rDate = new Date(receipt.invoice_date);
      if (isNaN(rDate)) continue;
      const dayDiff = Math.abs((txnDate - rDate) / (1000 * 60 * 60 * 24));
      if (Math.abs(txnAmt - rAmt) <= 1 && dayDiff <= 2) {
        database.run(
          'UPDATE vat_bank_transactions SET matched_receipt_id = ?, is_matched = 1 WHERE id = ?',
          [receipt.id, txn.id]
        );
        database.run(
          'UPDATE vat_receipts SET bank_transaction_id = ?, is_reconciled = 1 WHERE id = ?',
          [txn.id, receipt.id]
        );
        break;
      }
    }
  }
}
