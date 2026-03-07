import { useState, useRef, useEffect } from 'react';
import { MessageSquare, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';

const DOMAIN_COLORS = {
  'sa-tax': 'bg-emerald-500',
  'auditing': 'bg-blue-500',
  'quantity-surveying': 'bg-amber-500',
  'hr-payroll': 'bg-purple-500',
  'accounting': 'bg-sky-500',
  'general': 'bg-slate-500',
};

const DOMAIN_SHORT = {
  'sa-tax': 'Tax',
  'auditing': 'Audit',
  'quantity-surveying': 'QS',
  'hr-payroll': 'HR',
  'accounting': 'Acc',
  'general': 'Gen',
};

export default function ConversationItem({ conversation, isActive, onClick, onRename, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleRenameStart = () => {
    setRenameValue(conversation.title || 'New conversation');
    setIsRenaming(true);
    setShowMenu(false);
  };

  const handleRenameConfirm = () => {
    if (renameValue.trim()) {
      onRename(conversation.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
  };

  const domainColor = DOMAIN_COLORS[conversation.domain] || DOMAIN_COLORS.general;
  const domainShort = DOMAIN_SHORT[conversation.domain] || 'Gen';

  if (isRenaming) {
    return (
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-700">
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameConfirm();
            if (e.key === 'Escape') handleRenameCancel();
          }}
          className="flex-1 bg-slate-600 text-white text-sm px-2 py-1 rounded outline-none"
        />
        <button onClick={handleRenameConfirm} className="p-1 text-emerald-400 hover:text-emerald-300">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleRenameCancel} className="p-1 text-slate-400 hover:text-slate-300">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        onClick={() => onClick(conversation)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
          isActive
            ? 'bg-slate-700 text-white'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{conversation.title || 'New conversation'}</p>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium flex-shrink-0 ${domainColor}`}>
          {domainShort}
        </span>
      </button>

      {/* Hover actions */}
      <div className={`absolute right-1 top-1/2 -translate-y-1/2 ${showMenu ? 'flex' : 'hidden group-hover:flex'} items-center`}>
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-white"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-slate-700 rounded-lg shadow-xl border border-slate-600 py-1 z-50">
              <button
                onClick={(e) => { e.stopPropagation(); handleRenameStart(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600"
              >
                <Pencil className="w-3.5 h-3.5" />
                Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conversation.id); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
