import { useState, useEffect, useCallback } from 'react';
import { Globe, Brain, Zap, Users, ChevronDown, X } from 'lucide-react';

/**
 * ChatToolbar — compact toolbar above the chat input with:
 * - Client selector dropdown
 * - Web search toggle
 * - Active skills indicator
 * - Memory indicator
 */
export default function ChatToolbar({
  selectedClient,
  onSelectClient,
  webSearchEnabled,
  onToggleWebSearch,
  onOpenSkills,
  onOpenClients,
  onOpenMemory,
}) {
  const [clients, setClients] = useState([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [activeSkillCount, setActiveSkillCount] = useState(0);
  const [memoryCount, setMemoryCount] = useState(0);

  const loadClients = useCallback(async () => {
    if (!window.api?.listClients) return;
    const list = await window.api.listClients();
    setClients(list || []);
  }, []);

  const loadStats = useCallback(async () => {
    if (window.api?.listSkills) {
      const skills = await window.api.listSkills();
      setActiveSkillCount((skills || []).filter(s => s.is_active).length);
    }
    if (window.api?.listMemories) {
      const memories = await window.api.listMemories();
      setMemoryCount((memories || []).length);
    }
  }, []);

  useEffect(() => {
    loadClients();
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [loadClients, loadStats]);

  const clientName = selectedClient
    ? clients.find(c => c.id === selectedClient)?.name || 'Client'
    : null;

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 border-t bg-slate-50/80 text-xs overflow-x-auto">
      {/* Client selector */}
      <div className="relative">
        <button
          onClick={() => { loadClients(); setShowClientPicker(!showClientPicker); }}
          className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-colors ${
            selectedClient
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300'
          }`}
        >
          <Users className="w-3 h-3" />
          <span className="max-w-[100px] truncate">{clientName || 'Client'}</span>
          {selectedClient ? (
            <X className="w-3 h-3 hover:text-red-500" onClick={(e) => { e.stopPropagation(); onSelectClient(null); }} />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        {showClientPicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-lg shadow-lg w-56 max-h-48 overflow-y-auto z-50">
            <div className="p-1">
              {clients.length === 0 ? (
                <div className="px-3 py-2 text-slate-400 text-xs">
                  No clients.{' '}
                  <button onClick={() => { setShowClientPicker(false); onOpenClients?.(); }} className="text-emerald-600 hover:underline">
                    Create one
                  </button>
                </div>
              ) : (
                <>
                  {clients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { onSelectClient(c.id); setShowClientPicker(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md hover:bg-emerald-50 text-xs transition-colors ${
                        selectedClient === c.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate">{c.name}</div>
                      {c.registration_number && <div className="text-slate-400 truncate">{c.registration_number}</div>}
                    </button>
                  ))}
                  <div className="border-t mt-1 pt-1">
                    <button
                      onClick={() => { setShowClientPicker(false); onOpenClients?.(); }}
                      className="w-full text-left px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md text-xs"
                    >
                      Manage Clients...
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-slate-200" />

      {/* Web search toggle */}
      <button
        onClick={onToggleWebSearch}
        className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-colors ${
          webSearchEnabled
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200'
        }`}
        title={webSearchEnabled ? 'Web search ON — will search internet before responding' : 'Web search OFF'}
      >
        <Globe className="w-3 h-3" />
        <span>Search</span>
        {webSearchEnabled && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-slate-200" />

      {/* Skills indicator */}
      <button
        onClick={onOpenSkills}
        className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-colors ${
          activeSkillCount > 0
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200'
        }`}
        title={`${activeSkillCount} active skill(s)`}
      >
        <Zap className="w-3 h-3" />
        <span>Skills</span>
        {activeSkillCount > 0 && (
          <span className="min-w-[16px] h-4 flex items-center justify-center bg-amber-500 text-white text-[10px] rounded-full px-1 font-bold">
            {activeSkillCount}
          </span>
        )}
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-slate-200" />

      {/* Memory indicator */}
      <button
        onClick={onOpenMemory}
        className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-colors ${
          memoryCount > 0
            ? 'bg-purple-50 border-purple-200 text-purple-700'
            : 'bg-white border-slate-200 text-slate-400 hover:text-purple-600 hover:border-purple-200'
        }`}
        title={`${memoryCount} memories stored`}
      >
        <Brain className="w-3 h-3" />
        <span>Memory</span>
        {memoryCount > 0 && (
          <span className="min-w-[16px] h-4 flex items-center justify-center bg-purple-500 text-white text-[10px] rounded-full px-1 font-bold">
            {memoryCount}
          </span>
        )}
      </button>
    </div>
  );
}
