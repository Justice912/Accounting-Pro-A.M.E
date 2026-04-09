import { useMemo, useState } from 'react';
import { Plus, Trash2, Receipt, Calculator } from 'lucide-react';

const EMPTY_ITEM = { description: '', amount: '', vatRate: '15' };

function toMoney(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function parseAmount(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function VATCapture() {
  const [invoiceMeta, setInvoiceMeta] = useState({
    vendorName: '',
    vendorVatNumber: '',
    invoiceNumber: '',
    invoiceDate: '',
    category: 'standard',
    notes: '',
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  const totals = useMemo(() => {
    return items.reduce((acc, item) => {
      const base = parseAmount(item.amount);
      const rate = parseAmount(item.vatRate);
      const vat = base * (rate / 100);
      acc.net += base;
      acc.vat += vat;
      return acc;
    }, { net: 0, vat: 0 });
  }, [items]);

  const gross = totals.net + totals.vat;

  const updateItem = (index, key, value) => {
    setItems(prev => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-semibold text-slate-800">VAT Capture Workbench</h1>
          </div>
          <p className="text-sm text-slate-500">
            Capture supplier VAT invoices and instantly compute net, VAT, and gross totals for VAT201 prep.
          </p>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Vendor name"
              value={invoiceMeta.vendorName}
              onChange={(e) => setInvoiceMeta(prev => ({ ...prev, vendorName: e.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Vendor VAT number"
              value={invoiceMeta.vendorVatNumber}
              onChange={(e) => setInvoiceMeta(prev => ({ ...prev, vendorVatNumber: e.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Invoice number"
              value={invoiceMeta.invoiceNumber}
              onChange={(e) => setInvoiceMeta(prev => ({ ...prev, invoiceNumber: e.target.value }))}
            />
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={invoiceMeta.invoiceDate}
              onChange={(e) => setInvoiceMeta(prev => ({ ...prev, invoiceDate: e.target.value }))}
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={invoiceMeta.category}
              onChange={(e) => setInvoiceMeta(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="standard">Standard-rated (15%)</option>
              <option value="zero-rated">Zero-rated (0%)</option>
              <option value="exempt">Exempt (0%)</option>
            </select>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Internal reference / cost center"
              value={invoiceMeta.notes}
              onChange={(e) => setInvoiceMeta(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Line Items</h2>
            <button
              onClick={addItem}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1.5"
            >
              <Plus className="w-4 h-4" />
              Add line
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={`row-${idx}`} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="col-span-12 md:col-span-6 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="col-span-6 md:col-span-3 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Amount (excl VAT)"
                  value={item.amount}
                  onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                />
                <select
                  className="col-span-4 md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={item.vatRate}
                  onChange={(e) => updateItem(idx, 'vatRate', e.target.value)}
                >
                  <option value="15">15%</option>
                  <option value="0">0%</option>
                </select>
                <button
                  onClick={() => removeItem(idx)}
                  className="col-span-2 md:col-span-1 inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:text-red-600 hover:border-red-300 h-10"
                  title="Remove line"
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Totals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Net (excl VAT)</div>
              <div className="text-lg font-semibold text-slate-800">{toMoney(totals.net)}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Input VAT</div>
              <div className="text-lg font-semibold text-slate-800">{toMoney(totals.vat)}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs text-emerald-700">Gross (incl VAT)</div>
              <div className="text-lg font-semibold text-emerald-800">{toMoney(gross)}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
