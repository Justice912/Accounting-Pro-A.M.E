import { ArrowRight } from 'lucide-react';

const DOMAIN_PROMPTS = {
  'sa-tax': [
    { title: 'Calculate provisional tax', desc: 'Estimate IRP6 payments for the current tax year' },
    { title: 'Review ITR12 for compliance', desc: 'Check individual tax return against latest SARS requirements' },
    { title: 'VAT201 preparation checklist', desc: 'Step-by-step guide for VAT return submission' },
    { title: 'Capital gains tax calculation', desc: 'Calculate CGT on property or investment disposal' },
  ],
  'auditing': [
    { title: 'Create ISA 315 risk assessment', desc: 'Identify and assess risks of material misstatement' },
    { title: 'Draft audit planning memo', desc: 'Prepare engagement planning documentation' },
    { title: 'Review going concern indicators', desc: 'Assess entity viability under ISA 570' },
    { title: 'Design substantive procedures', desc: 'Plan tests of details for key assertions' },
  ],
  'quantity-surveying': [
    { title: 'Price a bill of quantities', desc: 'Calculate rates and amounts for BOQ items' },
    { title: 'Review JBCC contract terms', desc: 'Analyse principal building agreement clauses' },
    { title: 'Calculate construction escalation', desc: 'Apply CPAP indices to contract price adjustments' },
    { title: 'Prepare interim payment certificate', desc: 'Value work done for progress payment' },
  ],
  'hr-payroll': [
    { title: 'Calculate PAYE for employee', desc: 'Work out monthly tax deduction using latest tables' },
    { title: 'Draft employment contract', desc: 'Create BCEA-compliant employment agreement' },
    { title: 'UIF contribution calculation', desc: 'Calculate employer and employee UIF contributions' },
    { title: 'Retrenchment package analysis', desc: 'Calculate severance pay and notice period' },
  ],
  'accounting': [
    { title: 'Prepare trial balance adjustments', desc: 'Draft year-end journal entries and adjustments' },
    { title: 'Reconcile bank statement', desc: 'Match transactions and identify discrepancies' },
    { title: 'Draft financial statements', desc: 'Prepare AFS in IFRS for SMEs format' },
    { title: 'Revenue recognition guidance', desc: 'Apply IFRS 15 to contract revenue' },
  ],
  'finance': [
    { title: 'Build a DCF valuation model', desc: 'Discount free cash flows to determine enterprise and equity value' },
    { title: 'Absorption vs marginal costing', desc: 'Compare costing methods and their impact on profit reporting' },
    { title: 'Variance analysis for manufacturing', desc: 'Calculate and interpret material, labour and overhead variances' },
    { title: 'LBO model for acquisition target', desc: 'Structure a leveraged buyout with debt schedules and returns' },
  ],
  'general': [
    { title: 'South African tax landscape overview', desc: 'Summary of major taxes and thresholds' },
    { title: 'Professional ethics guidance', desc: 'SAICA/SAIPA code of conduct questions' },
    { title: 'Client engagement letter', desc: 'Draft a professional services engagement letter' },
    { title: 'Regulatory compliance checklist', desc: 'Key compliance deadlines and requirements' },
  ],
};

export default function QuickStartPrompts({ domain, onSelectPrompt }) {
  const prompts = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.general;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
      {prompts.map((prompt, idx) => (
        <button
          key={idx}
          onClick={() => onSelectPrompt(prompt.title)}
          className="group text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-slate-800 group-hover:text-emerald-700">
                {prompt.title}
              </p>
              <p className="text-xs text-slate-500 mt-1">{prompt.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 flex-shrink-0 mt-0.5" />
          </div>
        </button>
      ))}
    </div>
  );
}
