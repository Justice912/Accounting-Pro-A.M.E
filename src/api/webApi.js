import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase.js';
import { v4 as uuidv4 } from 'uuid';

let _pendingImageFile = null;

function docToData(snapshot) {
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

function docsToArray(snapshot) {
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

function getVatPeriod(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const periodStart = month % 2 === 0 ? month - 1 : month;
  return `${year}-${String(periodStart).padStart(2, '0')}`;
}

function computeFlags(data) {
  const flags = [];
  const net = Number(data.total_excl_vat) || 0;
  const vat = Number(data.vat_amount) || 0;
  const gross = Number(data.total_incl_vat) || 0;
  if (gross > 0 && Math.abs(net + vat - gross) > 0.02) flags.push('vat_mismatch');
  if (data.supplier_vat_number && !/^4\d{9}$/.test(data.supplier_vat_number.replace(/\s/g, ''))) {
    flags.push('invalid_vat_format');
  }
  if (data.ai_confidence != null && data.ai_confidence < 0.7) flags.push('low_confidence');
  return flags;
}

const webApi = {};
export default webApi;

// When Firebase isn't configured (no env vars set in Vercel), `db` is null.
// Skip the call cleanly instead of letting Firestore throw a noisy error
// that the existing try/catch would log on every read.
const isFirebaseReady = () => db !== null;

webApi.listClients = async () => {
  if (!isFirebaseReady()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'clients'), orderBy('name')));
    return docsToArray(snap);
  } catch (e) {
    console.error('[webApi] listClients:', e);
    return [];
  }
};

webApi.vatListReceipts = async (clientId, filters = {}) => {
  if (!isFirebaseReady()) return [];
  try {
    const constraints = [where('client_id', '==', clientId)];
    if (filters.startDate) constraints.push(where('invoice_date', '>=', filters.startDate));
    if (filters.endDate) constraints.push(where('invoice_date', '<=', filters.endDate));
    if (filters.status && filters.status !== 'all') constraints.push(where('status', '==', filters.status));
    const snap = await getDocs(query(collection(db, 'vat_receipts'), ...constraints, orderBy('invoice_date', 'desc')));
    return docsToArray(snap);
  } catch (e) {
    console.error('[webApi] vatListReceipts:', e);
    return [];
  }
};

webApi.vatGetReceipt = async (id) => {
  try {
    return docToData(await getDoc(doc(db, 'vat_receipts', id)));
  } catch (e) {
    console.error('[webApi] vatGetReceipt:', e);
    return null;
  }
};

webApi.vatGetReceiptCompliance = async (id) => {
  try {
    const receipt = docToData(await getDoc(doc(db, 'vat_receipts', id)));
    if (!receipt) return null;
    return { receipt, findings: [] };
  } catch (e) {
    console.error('[webApi] vatGetReceiptCompliance:', e);
    return null;
  }
};

webApi.vatSaveReceipt = async (data) => {
  try {
    const id = data.id || uuidv4();
    let imagePath = data.image_path || null;

    if (imagePath === 'web-blob' && _pendingImageFile) {
      const ext = _pendingImageFile.name.split('.').pop() || 'jpg';
      const storageRef = ref(storage, `vat-receipts/${data.client_id || 'unknown'}/${id}.${ext}`);
      await uploadBytes(storageRef, _pendingImageFile);
      imagePath = await getDownloadURL(storageRef);
    }
    _pendingImageFile = null;

    const vatPeriod = data.vat_period || getVatPeriod(data.invoice_date);
    const flags = computeFlags(data);
    const now = new Date().toISOString();

    const record = {
      ...data,
      id,
      image_path: imagePath,
      vat_period: vatPeriod,
      flags: flags,
      status: data.status || 'pending',
      total_incl_vat: Number(data.total_incl_vat) || 0,
      vat_amount: Number(data.vat_amount) || 0,
      total_excl_vat: Number(data.total_excl_vat) || 0,
      updated_at: now,
      created_at: data.created_at || now,
    };
    delete record._imageFile;

    await setDoc(doc(db, 'vat_receipts', id), record);
    return { success: true, id };
  } catch (e) {
    console.error('[webApi] vatSaveReceipt:', e);
    return { success: false, error: e.message };
  }
};

webApi.vatDeleteReceipt = async (id) => {
  try {
    await deleteDoc(doc(db, 'vat_receipts', id));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatUpdateReceiptStatus = async (id, status, notes) => {
  try {
    await updateDoc(doc(db, 'vat_receipts', id), {
      status,
      review_notes: notes || null,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatBulkStatus = async (ids, status) => {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    ids.forEach(id => batch.update(doc(db, 'vat_receipts', id), { status, updated_at: now }));
    await batch.commit();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatImportImage = () => new Promise((resolve) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,application/pdf';
  input.onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) { resolve({ success: false, cancelled: true }); return; }
    _pendingImageFile = file;
    const imageSrc = URL.createObjectURL(file);
    resolve({ success: true, imagePath: 'web-blob', imageSrc });
  };
  const onFocus = () => {
    setTimeout(() => {
      window.removeEventListener('focus', onFocus);
      if (!input.files?.length) resolve({ success: false, cancelled: true });
    }, 300);
  };
  window.addEventListener('focus', onFocus);
  input.click();
});

webApi.vatExtractReceipt = async (_imagePath) => {
  try {
    const file = _pendingImageFile;
    if (!file) return { success: false, error: 'No image selected' };

    const imageBase64 = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result.split(',')[1]);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
    const mimeType = file.type || 'image/jpeg';

    const res = await fetch('/api/extract-receipt', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatVerifyVatNumber = async (vatNumber) => {
  if (!vatNumber) return { valid: null };
  const clean = vatNumber.replace(/\s/g, '');
  if (!/^4\d{9}$/.test(clean)) return { valid: false, reason: 'Invalid format (must be 10 digits starting with 4)' };

  try {
    const cached = docToData(await getDoc(doc(db, 'vat_verified_vendors', clean)));
    if (cached) return { valid: Boolean(cached.valid), vendorName: cached.vendor_name || null };
  } catch { /* cache miss */ }

  return { valid: null, reason: 'VAT verification not available in browser — format is valid' };
};

function parseBankCSV(csv) {
  const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return [];
  const rawHeader = [];
  let cur2 = '', inQ2 = false;
  for (const ch of lines[0]) {
    if (ch === '"') { inQ2 = !inQ2; }
    else if (ch === ',' && !inQ2) { rawHeader.push(cur2.trim().toLowerCase()); cur2 = ''; }
    else { cur2 += ch; }
  }
  rawHeader.push(cur2.trim().toLowerCase());
  const header = rawHeader;

  let dateIdx = -1, descIdx = -1, amountIdx = -1, refIdx = -1, debitIdx = -1;
  let bankName = 'Unknown';

  header.forEach((h, i) => {
    if (h === 'date') dateIdx = i;
    if (h.includes('description') || h === 'transaction') descIdx = i;
    if (h === 'amount') amountIdx = i;
    if (h.includes('reference') || h === 'ref') refIdx = i;
    if (h === 'debit') debitIdx = i;
  });

  if (header.includes('transaction description')) bankName = 'Nedbank';
  else if (header.includes('reference') && header.includes('description')) bankName = 'ABSA';
  else if (header.includes('transaction') && (header.includes('debit') || header.includes('credit'))) bankName = 'Capitec';
  else if (header.includes('amount') && header.indexOf('amount') === 1) bankName = 'FNB';
  else if (header.includes('description') && header.includes('amount')) bankName = 'Standard Bank';

  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = [];
    let cur = '', inQ = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    if (cols.length < 2) continue;
    const dateRaw = dateIdx >= 0 ? cols[dateIdx] : '';
    if (!dateRaw) continue;
    let dateNorm = dateRaw;
    const dmy = dateRaw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) dateNorm = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    const desc = descIdx >= 0 ? cols[descIdx] : '';
    let amount = 0;
    if (amountIdx >= 0) {
      amount = parseFloat((cols[amountIdx] || '').replace(/[R,\s]/g, '')) || 0;
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

async function autoMatchTransactionsWeb(clientId) {
  try {
    const [txnSnap, receiptSnap] = await Promise.all([
      getDocs(query(collection(db, 'vat_bank_transactions'), where('client_id', '==', clientId), where('is_matched', '==', false))),
      getDocs(query(collection(db, 'vat_receipts'), where('client_id', '==', clientId), where('is_reconciled', '==', false), where('status', 'in', ['pending', 'reviewed', 'approved']))),
    ]);
    const unmatched = docsToArray(txnSnap);
    const unreconciled = docsToArray(receiptSnap);
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const txn of unmatched) {
      const txnAmt = Math.abs(Number(txn.amount));
      const txnDate = new Date(txn.txn_date);
      if (isNaN(txnDate)) continue;
      for (const receipt of unreconciled) {
        const rAmt = Number(receipt.total_incl_vat);
        const rDate = new Date(receipt.invoice_date);
        if (isNaN(rDate)) continue;
        const dayDiff = Math.abs((txnDate - rDate) / (1000 * 60 * 60 * 24));
        if (Math.abs(txnAmt - rAmt) <= 1 && dayDiff <= 3) {
          batch.update(doc(db, 'vat_bank_transactions', txn.id), { matched_receipt_id: receipt.id, is_matched: true, updated_at: now });
          batch.update(doc(db, 'vat_receipts', receipt.id), { bank_transaction_id: txn.id, is_reconciled: true, updated_at: now });
          break;
        }
      }
    }
    await batch.commit();
  } catch (e) {
    console.error('[webApi] autoMatch:', e);
  }
}

webApi.vatImportBank = (clientId) => new Promise((resolve) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) { resolve({ success: false, cancelled: true }); return; }
    try {
      const csv = await file.text();
      const transactions = parseBankCSV(csv);
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      let imported = 0;
      for (const txn of transactions) {
        const id = uuidv4();
        batch.set(doc(db, 'vat_bank_transactions', id), {
          id, client_id: clientId,
          txn_date: txn.date, description: txn.description, amount: txn.amount,
          reference: txn.reference || null, bank_name: txn.bankName || 'Unknown',
          statement_period: txn.period || null, is_matched: false,
          matched_receipt_id: null, imported_at: now,
        });
        imported++;
      }
      await batch.commit();
      await autoMatchTransactionsWeb(clientId);
      resolve({ success: true, imported });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  };
  const onFocus = () => {
    setTimeout(() => {
      window.removeEventListener('focus', onFocus);
      if (!input.files?.length) resolve({ success: false, cancelled: true });
    }, 300);
  };
  window.addEventListener('focus', onFocus);
  input.click();
});

webApi.vatListBankTxns = async (clientId, filters = {}) => {
  if (!isFirebaseReady()) return [];
  try {
    const constraints = [where('client_id', '==', clientId)];
    if (filters.matched === true) constraints.push(where('is_matched', '==', true));
    if (filters.matched === false) constraints.push(where('is_matched', '==', false));
    const snap = await getDocs(query(collection(db, 'vat_bank_transactions'), ...constraints, orderBy('txn_date', 'desc')));
    return docsToArray(snap);
  } catch (e) {
    console.error('[webApi] vatListBankTxns:', e);
    return [];
  }
};

webApi.vatMatchBankTxn = async (txnId, receiptId) => {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    if (receiptId) {
      batch.update(doc(db, 'vat_bank_transactions', txnId), { matched_receipt_id: receiptId, is_matched: true, updated_at: now });
      batch.update(doc(db, 'vat_receipts', receiptId), { bank_transaction_id: txnId, is_reconciled: true, updated_at: now });
    } else {
      const txnSnap = await getDoc(doc(db, 'vat_bank_transactions', txnId));
      const txn = docToData(txnSnap);
      if (txn?.matched_receipt_id) {
        batch.update(doc(db, 'vat_receipts', txn.matched_receipt_id), { bank_transaction_id: null, is_reconciled: false, updated_at: now });
      }
      batch.update(doc(db, 'vat_bank_transactions', txnId), { matched_receipt_id: null, is_matched: false, updated_at: now });
    }
    await batch.commit();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatDeleteBankTxns = async (ids) => {
  try {
    if (!ids?.length) return { success: true, deleted: 0 };
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    for (const id of ids) {
      const snap = await getDoc(doc(db, 'vat_bank_transactions', id));
      const txn = docToData(snap);
      if (txn?.matched_receipt_id) {
        batch.update(doc(db, 'vat_receipts', txn.matched_receipt_id), { bank_transaction_id: null, is_reconciled: false, updated_at: now });
      }
      batch.delete(doc(db, 'vat_bank_transactions', id));
    }
    await batch.commit();
    return { success: true, deleted: ids.length };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatDeleteUndatedBankTxns = async (clientId) => {
  try {
    const snap = await getDocs(query(collection(db, 'vat_bank_transactions'), where('client_id', '==', clientId), where('txn_date', 'in', [null, ''])));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return { success: true, deleted: snap.size };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatGenerateSchedule = async (clientId, period) => {
  try {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      return { success: false, error: `Invalid period format: ${period}` };
    }
    const snap = await getDocs(query(collection(db, 'vat_receipts'), where('client_id', '==', clientId), where('vat_period', '==', period)));
    const receipts = docsToArray(snap);
    const approved = receipts.filter(r => r.status === 'approved');
    const inputStandard = approved.filter(r => r.vat_type === 'standard' || r.vat_type === 'zero').reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);
    const inputCapital = approved.filter(r => r.vat_type === 'capital').reduce((s, r) => s + (Number(r.vat_amount) || 0), 0);
    const inputTotal = inputStandard + inputCapital;

    const [year, month] = period.split('-').map(Number);
    const startMonth = month % 2 === 0 ? month - 1 : month;
    const endMonth = startMonth + 1;
    const lastDay = new Date(year, endMonth, 0).getDate();
    const periodStart = `${year}-${String(startMonth).padStart(2, '0')}-01`;
    const periodEnd = `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`;

    const scheduleId = `${clientId}_${period}`;
    await setDoc(doc(db, 'vat_schedules', scheduleId), {
      id: scheduleId, client_id: clientId, period, period_start: periodStart, period_end: periodEnd,
      status: 'draft', input_vat_standard: inputStandard, input_vat_capital: inputCapital,
      input_vat_total: inputTotal, output_vat_standard: 0, output_vat_total: 0, net_vat: -inputTotal,
      receipt_count: receipts.length, approved_count: approved.length,
      pending_count: receipts.filter(r => r.status === 'pending').length,
      flagged_count: receipts.filter(r => Array.isArray(r.flags) ? r.flags.length > 0 : false).length,
      updated_at: new Date().toISOString(),
    });
    return { success: true, scheduleId };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatGetSchedule = async (clientId, period) => {
  if (!isFirebaseReady()) return { schedule: null, receipts: [] };
  try {
    const scheduleId = `${clientId}_${period}`;
    const [scheduleSnap, receiptSnap] = await Promise.all([
      getDoc(doc(db, 'vat_schedules', scheduleId)),
      getDocs(query(collection(db, 'vat_receipts'), where('client_id', '==', clientId), where('vat_period', '==', period), orderBy('expense_category'), orderBy('invoice_date'))),
    ]);
    return { schedule: docToData(scheduleSnap), receipts: docsToArray(receiptSnap) };
  } catch (e) {
    return { schedule: null, receipts: [] };
  }
};

webApi.vatExportExcel = async (clientId, period) => {
  try {
    const { schedule, receipts } = await webApi.vatGetSchedule(clientId, period);
    const approved = receipts.filter(r => r.status === 'approved');

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AME VAT Capture';
    wb.created = new Date();

    const ws1 = wb.addWorksheet('VAT Schedule');
    ws1.addRow(['AME VAT Schedule', '', period]);
    ws1.addRow([]);
    ws1.addRow(['Field 14 — Purchases (Excl VAT)', '', approved.reduce((s, r) => s + (Number(r.total_excl_vat) || 0), 0)]);
    ws1.addRow(['Field 15/16 — Input VAT', '', approved.reduce((s, r) => s + (Number(r.vat_amount) || 0), 0)]);
    ws1.addRow(['Total Purchases (Incl VAT)', '', approved.reduce((s, r) => s + (Number(r.total_incl_vat) || 0), 0)]);
    ws1.addRow([]);
    ws1.addRow(['Category', 'Count', 'Excl VAT', 'VAT', 'Incl VAT']);
    const byCategory = {};
    for (const r of approved) {
      const cat = r.expense_category || 'General';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, excl: 0, vat: 0, incl: 0 };
      byCategory[cat].count++;
      byCategory[cat].excl += Number(r.total_excl_vat) || 0;
      byCategory[cat].vat += Number(r.vat_amount) || 0;
      byCategory[cat].incl += Number(r.total_incl_vat) || 0;
    }
    Object.entries(byCategory).forEach(([cat, d]) => ws1.addRow([cat, d.count, d.excl, d.vat, d.incl]));

    const ws2 = wb.addWorksheet('Receipts');
    ws2.addRow(['Date', 'Supplier', 'Invoice No.', 'Excl VAT', 'VAT', 'Incl VAT', 'Status', 'Category']);
    approved.forEach(r => ws2.addRow([r.invoice_date, r.supplier_name, r.invoice_number, Number(r.total_excl_vat) || 0, Number(r.vat_amount) || 0, Number(r.total_incl_vat) || 0, r.status, r.expense_category]));

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VAT_Schedule_${period}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatGetReminders = async () => [];

webApi.vatUpdateReminderState = async (payload) => {
  try {
    const id = `${payload.clientId}_${payload.period}_${payload.ruleKey}`;
    await setDoc(doc(db, 'vat_reminder_state', id), { ...payload, updated_at: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatSaveDocumentOverride = async (payload) => {
  try {
    const id = uuidv4();
    await setDoc(doc(db, 'vat_document_overrides', id), { ...payload, id, created_at: new Date().toISOString() });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

webApi.vatClearDocumentOverride = async (payload) => {
  try {
    const snap = await getDocs(query(collection(db, 'vat_document_overrides'),
      where('document_id', '==', payload.documentId),
      where('override_type', '==', payload.overrideType)));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { cleared: true, cleared_at: new Date().toISOString(), clear_reason: payload.reason || null }));
    await batch.commit();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
