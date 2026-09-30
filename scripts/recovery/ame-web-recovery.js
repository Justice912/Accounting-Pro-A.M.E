// AME Accounting (web app) — data recovery helper.
//
// The web app keeps all data in the browser's localStorage, which is tied to
// the exact site address (origin) and browser profile. Nothing is stored on a
// server, so recovery has to be run in the browser that holds the data.
//
// Usage: open the app at the address you normally use, press F12, go to the
// Console tab, paste this whole file and press Enter. Then run:
//
//   AME_RECOVERY.scan()                 – read-only report of what is stored
//   AME_RECOVERY.backup()               – download everything as a JSON file
//   AME_RECOVERY.rebuildMissingClients() – re-create client records that were
//                                         deleted but still have invoices,
//                                         bank lines, VAT, payroll or assets
//   AME_RECOVERY.restore(json)          – write a backup file's contents back
//
// Always run backup() before rebuildMissingClients() or restore().

(() => {
  const DATA_KEYS = [
    'accounting-clients',
    'accounting-invoices',
    'accounting-customers',
    'accounting-suppliers',
    'accounting-bank-statements',
    'accounting-vat-transactions',
    'accounting-accounts',
    'accounting-employees',
    'accounting-payslips',
    'accounting-assets',
    'allocation-rules',
    'cf-outflows',
  ];
  // Records in these keys carry the owning client's id in `companyId`.
  const LINKED_KEYS = [
    'accounting-invoices',
    'accounting-customers',
    'accounting-bank-statements',
    'accounting-vat-transactions',
    'accounting-employees',
    'accounting-payslips',
    'accounting-assets',
    'allocation-rules',
  ];

  const read = (key) => {
    const raw = localStorage.getItem(key);
    if (raw == null) return { raw: null, data: null, error: null };
    try {
      return { raw, data: JSON.parse(raw), error: null };
    } catch (e) {
      return { raw, data: null, error: e.message };
    }
  };

  const allAppKeys = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('accounting-') || DATA_KEYS.includes(k))) keys.push(k);
    }
    return keys.sort();
  };

  const idKey = (id) => String(id);

  const orphanReport = () => {
    const clients = read('accounting-clients').data;
    const known = new Set((Array.isArray(clients) ? clients : []).map((c) => idKey(c.id)));
    const orphans = new Map();
    for (const key of LINKED_KEYS) {
      const rows = read(key).data;
      if (!Array.isArray(rows)) continue;
      for (const r of rows) {
        if (r == null || r.companyId == null || r.companyId === '') continue;
        const k = idKey(r.companyId);
        if (known.has(k)) continue;
        if (!orphans.has(k)) orphans.set(k, { companyId: r.companyId, counts: {} });
        const o = orphans.get(k);
        o.counts[key] = (o.counts[key] || 0) + 1;
      }
    }
    return [...orphans.values()];
  };

  const createdDate = (id) => {
    const n = Number(id);
    // Client ids are Date.now() at creation in this app.
    if (Number.isFinite(n) && n > 1e12 && n < 1e13) return new Date(n).toISOString().slice(0, 10);
    return null;
  };

  const scan = () => {
    console.log('%cAME recovery scan — ' + location.origin, 'font-weight:bold');
    const rows = allAppKeys().map((key) => {
      const { raw, data, error } = read(key);
      return {
        key,
        records: Array.isArray(data) ? data.length : error ? 'UNREADABLE' : typeof data,
        sizeKB: raw ? Math.round(raw.length / 1024) : 0,
        error: error || '',
      };
    });
    if (rows.length === 0) {
      console.warn(
        'No AME data at this address. The data is probably stored under a different ' +
          'address, browser, or browser profile — see docs/DATA_RECOVERY.md.'
      );
    } else {
      console.table(rows);
    }
    const orphans = orphanReport();
    if (orphans.length) {
      console.log(
        `%c${orphans.length} deleted client(s) still have data. Run AME_RECOVERY.backup() then AME_RECOVERY.rebuildMissingClients().`,
        'color:#b45309;font-weight:bold'
      );
      console.table(orphans.map((o) => ({ companyId: o.companyId, created: createdDate(o.companyId), ...o.counts })));
    } else {
      console.log('No orphaned client data found.');
    }
    return { keys: rows, orphans };
  };

  const backup = () => {
    const payload = { origin: location.origin, exportedAt: new Date().toISOString(), data: {} };
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === 'anthropic-api-key' || k === 'claude-sidebar-byok-key-v1') continue; // never export API keys
      payload.data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ame-backup-${location.hostname}-${payload.exportedAt.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    console.log(`Backup downloaded (${Object.keys(payload.data).length} keys).`);
    return payload;
  };

  const rebuildMissingClients = () => {
    const current = read('accounting-clients');
    if (current.error) {
      console.error('accounting-clients is unreadable; not changing it. Run backup() and share the file.');
      return [];
    }
    const clients = Array.isArray(current.data) ? current.data : [];
    const orphans = orphanReport();
    if (!orphans.length) {
      console.log('Nothing to rebuild.');
      return [];
    }
    const rebuilt = orphans.map((o) => ({
      id: o.companyId,
      name: `Recovered client (created ${createdDate(o.companyId) || 'unknown date'})`,
      tradingName: '',
      registrationNo: '',
      vatNo: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'South Africa',
      email: '',
      phone: '',
      contactPerson: '',
      bankName: '',
      bankAccountNo: '',
      bankBranchCode: '',
      logo: '',
    }));
    localStorage.setItem('accounting-clients', JSON.stringify([...clients, ...rebuilt]));
    console.log(
      `Re-created ${rebuilt.length} client(s). Reload the page, open each "Recovered client" and ` +
        'use Edit to restore its name and details. Invoices, bank lines, VAT, payroll and assets are re-linked automatically.'
    );
    return rebuilt;
  };

  const restore = (json) => {
    const payload = typeof json === 'string' ? JSON.parse(json) : json;
    if (!payload || typeof payload.data !== 'object') throw new Error('Not an AME backup file.');
    const keys = Object.keys(payload.data);
    if (!window.confirm(`Overwrite ${keys.length} stored key(s) at ${location.origin} with this backup?`)) return false;
    for (const k of keys) localStorage.setItem(k, payload.data[k]);
    console.log(`Restored ${keys.length} key(s). Reload the page.`);
    return true;
  };

  window.AME_RECOVERY = { scan, backup, rebuildMissingClients, restore };
  console.log('AME_RECOVERY loaded. Start with AME_RECOVERY.scan()');
})();
