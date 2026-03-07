import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, Search, Settings, Home, X,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import ConversationList from '../sidebar/ConversationList';

const DOMAIN_TABS = [
  { id: 'all', label: 'All' },
  { id: 'sa-tax', label: 'Tax' },
  { id: 'auditing', label: 'Audit' },
  { id: 'quantity-surveying', label: 'QS' },
  { id: 'hr-payroll', label: 'HR' },
  { id: 'accounting', label: 'Acc' },
  { id: 'finance', label: 'Fin' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const {
    groupedConversations,
    activeConversationId,
    domainFilter,
    setDomainFilter,
    searchQuery,
    setSearchQuery,
    createConversation,
    switchConversation,
    renameConversation,
    deleteConversation,
  } = useWorkspace();

  const handleNewChat = useCallback(async () => {
    const id = await createConversation('general', 'New conversation');
    if (id) navigate(`/workspace/general/${id}`);
  }, [createConversation, navigate]);

  // Ctrl+N keyboard shortcut for new chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat]);

  const handleSelectConversation = (conv) => {
    switchConversation(conv.id);
    navigate(`/workspace/${conv.domain}/${conv.id}`);
  };

  const isHome = location.pathname === '/' || location.pathname === '';

  return (
    <aside className="w-[280px] flex flex-col bg-[#0f172a] text-slate-300 flex-shrink-0">
      {/* New Chat button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Search toggle */}
      <div className="px-3 pb-2">
        {showSearch ? (
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1"
              autoFocus
            />
            <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center gap-2 text-slate-500 hover:text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-800/60 text-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            Search...
          </button>
        )}
      </div>

      {/* Domain filter tabs */}
      <div className="px-3 pb-2">
        <div className="flex flex-wrap gap-1">
          {DOMAIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setDomainFilter(tab.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                domainFilter === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2">
        <ConversationList
          groupedConversations={groupedConversations}
          activeConversationId={activeConversationId}
          onSelect={handleSelectConversation}
          onRename={renameConversation}
          onDelete={deleteConversation}
        />
      </div>

      {/* Bottom nav */}
      <div className="border-t border-slate-800 p-2 space-y-0.5">
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            isHome ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          Home
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            location.pathname === '/settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </aside>
  );
}
