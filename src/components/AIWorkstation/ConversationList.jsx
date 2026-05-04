import { Trash2 } from 'lucide-react';

export function ConversationList({ conversations, activeId, onSelect, onDelete }) {
  if (conversations.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-gray-500 border-b">
        No conversations yet.
      </div>
    );
  }

  return (
    <div className="max-h-48 overflow-y-auto border-b bg-gray-50">
      {conversations.map((c) => (
        <div
          key={c.id}
          className={`flex items-center justify-between px-4 py-2 hover:bg-white cursor-pointer ${
            c.id === activeId ? 'bg-white border-l-2 border-blue-600' : ''
          }`}
          onClick={() => onSelect(c.id)}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{c.title || 'Untitled'}</div>
            <div className="text-xs text-gray-400">{c.provider}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this conversation?')) onDelete(c.id);
            }}
            className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
