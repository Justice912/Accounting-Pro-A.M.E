import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Calculator, Shield, Ruler, Users, BookOpen, MessageSquare, Sparkles, TrendingUp
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAIProvider } from '../../contexts/AIProviderContext';
import ProviderSelector from '../ai/ProviderSelector';

const DOMAIN_ICONS = {
  'sa-tax': Calculator,
  'auditing': Shield,
  'quantity-surveying': Ruler,
  'hr-payroll': Users,
  'accounting': BookOpen,
  'finance': TrendingUp,
  'general': MessageSquare,
};

const DOMAIN_NAMES = {
  'sa-tax': 'SA Tax',
  'auditing': 'Auditing',
  'quantity-surveying': 'Quantity Surveying',
  'hr-payroll': 'HR & Payroll',
  'accounting': 'Accounting',
  'finance': 'Finance',
  'general': 'General',
};

export default function Header() {
  const location = useLocation();
  const { activeConversation, activeDomain, renameConversation } = useWorkspace();
  const { activeProvider, providerHealth } = useAIProvider();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const healthStatus = providerHealth?.[activeProvider]?.status;
  const healthColor = healthStatus === 'healthy' ? 'bg-emerald-400'
    : healthStatus === 'degraded' ? 'bg-amber-400'
    : healthStatus === 'down' ? 'bg-red-400'
    : 'bg-slate-400';

  const isWorkspace = location.pathname.startsWith('/workspace');
  const isSettings = location.pathname === '/settings';

  const DomainIcon = DOMAIN_ICONS[activeDomain] || Sparkles;
  const domainName = DOMAIN_NAMES[activeDomain] || '';

  const handleTitleClick = () => {
    if (activeConversation) {
      setTitleValue(activeConversation.title || 'New conversation');
      setEditingTitle(true);
    }
  };

  const handleTitleConfirm = () => {
    if (titleValue.trim() && activeConversation) {
      renameConversation(activeConversation.id, titleValue.trim());
    }
    setEditingTitle(false);
  };

  return (
    <header className="bg-white border-b h-12 flex items-center px-4 justify-between flex-shrink-0">
      {/* Left: context info */}
      <div className="flex items-center gap-2 min-w-0">
        {!isWorkspace && !isSettings && (
          <>
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-800">AME Pro AI Workstation</span>
          </>
        )}
        {isSettings && (
          <span className="text-sm font-semibold text-slate-800">Settings</span>
        )}
        {isWorkspace && (
          <>
            <DomainIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-600">{domainName}</span>
            {activeConversation && (
              <>
                <span className="text-slate-300">/</span>
                {editingTitle ? (
                  <input
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={handleTitleConfirm}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleConfirm();
                      if (e.key === 'Escape') setEditingTitle(false);
                    }}
                    className="text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded outline-none focus:ring-2 focus:ring-emerald-400"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={handleTitleClick}
                    className="text-sm text-slate-800 hover:text-emerald-700 truncate max-w-[300px]"
                    title="Click to rename"
                  >
                    {activeConversation.title || 'New conversation'}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Right: provider indicator */}
      <div className="flex items-center gap-3">
        {isWorkspace && <ProviderSelector />}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className={`w-2 h-2 rounded-full ${healthColor}`} />
          <span className="capitalize">{activeProvider}</span>
        </div>
      </div>
    </header>
  );
}
