import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { normalizeVatPeriodSelection } from './vatPeriodViewModel.js';

function toZAR(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function SummaryCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

export default function VAT201Preview() {
  const api = window.api;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('client') || '';
  const period = searchParams.get('period') || '';
  const customStartDate = searchParams.get('start') || '';
  const customEndDate = searchParams.get('end') || '';
  const periodSelection = useMemo(() => normalizeVatPeriodSelection({
    periodMode: customStartDate || customEndDate ? 'custom' : 'preset',
    selectedPeriod: period,
    customStartDate,
    customEndDate,
  }), [customEndDate, customStartDate, period]);
  const [summary, setSummary] = useState(null);
  const [clientName, setClientName] = useState(clientId);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId || !periodSelection.period || !periodSelection.isValid || !api?.vatGetPeriodSummary) {
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [summaryResult, clients] = await Promise.all([
        api.vatGetPeriodSummary(clientId, periodSelection.period, periodSelection.isCustom ? periodSelection.filters : undefined),
        api?.listClients ? api.listClients() : Promise.resolve([]),
      ]);
      setSummary(summaryResult || null);
      const client = (clients || []).find(item => item.id === clientId);
      setClientName(client?.name || clientId);
    } catch (error) {
      console.error('[VAT201Preview] load error:', error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [api, clientId, periodSelection]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-5 p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#1B4F72]" />
                <h1 className="text-lg font-bold text-slate-800">VAT201 Preview</h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Preview of the computed VAT201 fields for {clientName || 'the selected client'} in {periodSelection.label || 'the selected period'}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] px-3 py-2 text-sm font-medium text-white hover:bg-[#2E75B6]"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {!clientId || !periodSelection.period || !periodSelection.isValid ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            {periodSelection.error || 'Open this page from the VAT dashboard to preview a specific client and VAT period.'}
          </div>
        ) : loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading VAT201 preview…
          </div>
        ) : !summary ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No VAT201 summary is available for this client and period yet.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard label="Output VAT" value={toZAR(summary.totals?.outputVat)} />
              <SummaryCard label="Input VAT" value={toZAR(summary.totals?.inputVat)} />
              <SummaryCard label="Net VAT" value={toZAR(summary.netVat)} />
              <SummaryCard label="Compliance" value={Math.round(summary.complianceScore || 0)} sub="Average score" />
              <SummaryCard label="Penalty Risk" value={toZAR(summary.penaltyRisk?.latePenalty)} sub="Late filing estimate" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Calculator className="h-4 w-4 text-[#1B4F72]" />
                    VAT201 fields
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Field</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['1', 'Standard-rated supplies', summary.vat201?.field1],
                      ['1A', 'Output tax', summary.vat201?.field1a],
                      ['2', 'Zero-rated supplies', summary.vat201?.field2],
                      ['3', 'Exempt supplies', summary.vat201?.field3],
                      ['12', 'Input tax', summary.vat201?.field12],
                      ['13', 'Capital goods input tax', summary.vat201?.field13],
                    ].map(([field, label, amount]) => (
                      <tr key={field} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-800">{field}</td>
                        <td className="px-4 py-3 text-slate-600">{label}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">{toZAR(amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-800">Input tax adjustments</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Blocked input VAT</span>
                      <span className="font-mono text-slate-800">{toZAR(summary.totals?.blockedInputVat)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Apportioned input VAT</span>
                      <span className="font-mono text-slate-800">{toZAR(summary.totals?.apportionedInputVat)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-800">Context</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Client</span>
                      <span className="text-slate-800">{clientName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Period</span>
                      <span className="text-slate-800">{periodSelection.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
