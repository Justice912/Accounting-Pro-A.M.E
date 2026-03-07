import { useState } from 'react';
import { ChevronDown, Zap, Crown, Brain, Coins } from 'lucide-react';
import { useAIProvider, MODEL_CATALOG } from '../../contexts/AIProviderContext';

const TIER_CONFIG = {
  flagship: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Flagship' },
  fast:     { icon: Zap,   color: 'text-blue-500',  bg: 'bg-blue-50',  label: 'Fast' },
  budget:   { icon: Coins, color: 'text-green-500', bg: 'bg-green-50', label: 'Budget' },
  reasoning:{ icon: Brain, color: 'text-purple-500',bg: 'bg-purple-50',label: 'Reasoning' },
};

export default function ProviderSelector() {
  const { selectedModel, setSelectedModel, providerHealth } = useAIProvider();
  const [open, setOpen] = useState(false);

  const getHealthColor = (providerId) => {
    const health = providerHealth?.[providerId];
    const status = health?.status || health;
    if (status === 'healthy') return 'bg-emerald-400';
    if (status === 'degraded') return 'bg-amber-400';
    if (status === 'down') return 'bg-red-400';
    if (status === 'unconfigured') return 'bg-slate-300';
    return 'bg-slate-300';
  };

  // Find active model info
  let activeModel = null;
  let activeProviderKey = null;
  for (const [provKey, provData] of Object.entries(MODEL_CATALOG)) {
    const found = provData.models.find(m => m.id === selectedModel);
    if (found) {
      activeModel = found;
      activeProviderKey = provKey;
      break;
    }
  }
  if (!activeModel) {
    activeModel = { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', tier: 'fast' };
    activeProviderKey = 'claude';
  }

  const activeTier = TIER_CONFIG[activeModel.tier] || TIER_CONFIG.fast;
  const ActiveIcon = activeTier.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-slate-50 text-sm transition-colors"
      >
        <div className={`w-2 h-2 rounded-full ${getHealthColor(activeProviderKey)}`} />
        <ActiveIcon className={`w-3.5 h-3.5 ${activeTier.color}`} />
        <span className="font-medium text-slate-700">{activeModel.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 w-72 bg-white rounded-lg shadow-lg border z-50 max-h-[420px] overflow-y-auto">
            {Object.entries(MODEL_CATALOG).map(([provKey, provData]) => (
              <div key={provKey}>
                {/* Provider header */}
                <div className="px-4 py-2 bg-slate-50 border-b flex items-center gap-2 sticky top-0">
                  <div className={`w-2 h-2 rounded-full ${getHealthColor(provKey)}`} />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {provData.name}
                  </span>
                </div>
                {/* Models */}
                {provData.models.map(model => {
                  const tier = TIER_CONFIG[model.tier] || TIER_CONFIG.fast;
                  const TierIcon = tier.icon;
                  const isActive = model.id === selectedModel;

                  return (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors ${
                        isActive ? 'bg-emerald-50 border-l-2 border-emerald-500' : 'border-l-2 border-transparent'
                      }`}
                    >
                      <TierIcon className={`w-4 h-4 ${tier.color} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800">{model.label}</div>
                        <div className="text-[10px] text-slate-400">{model.id}</div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tier.bg} ${tier.color}`}>
                        {tier.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
