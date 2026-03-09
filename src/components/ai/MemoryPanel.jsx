import { useState, useEffect, useCallback } from 'react';
import { Brain, Trash2, X, AlertTriangle, BookOpen, Heart, CheckCircle2 } from 'lucide-react';

const TYPE_STYLES = {
  correction: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: 'Correction' },
  fact: { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Fact' },
  preference: { icon: Heart, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Preference' },
  task: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Task' },
};

export default function MemoryPanel({ onClose }) {
  const [memories, setMemories] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!window.api?.listMemories) return;
    const list = await window.api.listMemories();
    setMemories(list || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? memories : memories.filter(m => m.type === filter);

  const handleDelete = async (id) => {
    await window.api.deleteMemory(id);
    await load();
  };

  const handleClearAll = async () => {
    await window.api.clearMemories();
    await load();
  };

  const counts = {
    all: memories.length,
    correction: memories.filter(m => m.type === 'correction').length,
    fact: memories.filter(m => m.type === 'fact').length,
    preference: memories.filter(m => m.type === 'preference').length,
    task: memories.filter(m => m.type === 'task').length,
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" /> AI Memory & Learning
          </h2>
          <div className="flex items-center gap-2">
            {memories.length > 0 && (
              <button onClick={handleClearAll} className="flex items-center gap-1 px-3 py-1.5 text-red-600 text-sm rounded-lg hover:bg-red-50 border border-red-200">
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-2 border-b overflow-x-auto">
          {['all', 'correction', 'fact', 'preference', 'task'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${
                filter === type
                  ? 'bg-purple-100 border-purple-300 text-purple-700 font-medium'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-purple-200'
              }`}
            >
              {type === 'all' ? 'All' : TYPE_STYLES[type]?.label || type} ({counts[type]})
            </button>
          ))}
        </div>

        {/* Memory list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No memories yet.</p>
              <p className="text-xs mt-1">The AI automatically learns from your corrections, preferences, and tasks.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(m => {
                const style = TYPE_STYLES[m.type] || TYPE_STYLES.fact;
                const Icon = style.icon;
                return (
                  <div key={m.id} className="flex items-start gap-2 p-3 rounded-lg hover:bg-slate-50 group">
                    <div className={`p-1 rounded ${style.bg} flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 break-words">{m.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{m.domain}</span>
                        <span className="text-[10px] text-slate-300">{new Date(m.created_at).toLocaleDateString('en-ZA')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-slate-50 rounded-b-xl text-xs text-slate-400 text-center">
          {memories.length} memories stored — AI uses these to learn from past interactions
        </div>
      </div>
    </div>
  );
}
