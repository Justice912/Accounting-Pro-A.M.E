import ConversationItem from './ConversationItem';

export default function ConversationList({ groupedConversations, activeConversationId, onSelect, onRename, onDelete }) {
  if (groupedConversations.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-sm text-slate-500">No conversations yet</p>
        <p className="text-xs text-slate-600 mt-1">Start a new chat to begin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedConversations.map(([groupLabel, items]) => (
        <div key={groupLabel}>
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
            {groupLabel}
          </h4>
          <div className="space-y-0.5">
            {items.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => onSelect(conv)}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
