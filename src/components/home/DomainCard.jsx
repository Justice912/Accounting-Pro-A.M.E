import {
  Calculator, Shield, Ruler, Users, BookOpen, MessageSquare, TrendingUp
} from 'lucide-react';

const ICONS = {
  Calculator, Shield, Ruler, Users, BookOpen, MessageSquare, TrendingUp,
};

const COLORS = {
  emerald: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-700',
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-700',
  amber: 'bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-700',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-400 text-purple-700',
  sky: 'bg-sky-50 border-sky-200 hover:border-sky-400 text-sky-700',
  rose: 'bg-rose-50 border-rose-200 hover:border-rose-400 text-rose-700',
  slate: 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700',
};

const ICON_BG = {
  emerald: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
  purple: 'bg-purple-100 text-purple-600',
  sky: 'bg-sky-100 text-sky-600',
  rose: 'bg-rose-100 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};

const DESCRIPTIONS = {
  'sa-tax': 'Income Tax Act, VAT Act, SARS compliance, provisional tax, CGT',
  'auditing': 'ISA standards, audit procedures, risk assessment, ISQM',
  'quantity-surveying': 'BOQ pricing, JBCC contracts, ASAQS, valuations',
  'hr-payroll': 'BCEA, LRA, PAYE, UIF, SDL, employment contracts',
  'accounting': 'IFRS, bookkeeping, financial statements, journals',
  'finance': 'Cost accounting, management accounting, DCF, M&A, LBO, valuations',
  'general': 'General professional accounting queries',
};

export default function DomainCard({ domain, onClick }) {
  const Icon = ICONS[domain.icon] || MessageSquare;
  const colorClass = COLORS[domain.color] || COLORS.slate;
  const iconBg = ICON_BG[domain.color] || ICON_BG.slate;
  const description = DESCRIPTIONS[domain.id] || '';

  return (
    <button
      onClick={() => onClick(domain)}
      className={`text-left rounded-xl border-2 p-5 transition-all hover:shadow-md ${colorClass}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-base">{domain.name}</h3>
      <p className="text-xs opacity-70 mt-1.5 leading-relaxed">{description}</p>
    </button>
  );
}
