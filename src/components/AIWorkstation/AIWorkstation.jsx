import { useState, useEffect } from 'react';
import { ChevronRight, Plus, Settings, MessageSquare } from 'lucide-react';
import { useAIWorkstation } from '../../hooks/useAIWorkstation';
import { ChatHeader } from './ChatHeader';
import { ConversationList } from './ConversationList';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { SettingsModal } from './SettingsModal';

export function AIWorkstation() {
  const ws = useAIWorkstation();
  const [open, setOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    ws.loadPreferences();
  }, []);

  // Auto-open settings when no keys are configured
  useEffect(() => {
    if (!ws.hasKey('anthropic') && !ws.hasKey('openai')) {
      setShowSettings(true);
    }
  }, [ws.keys]);

  const providerKeyField = ws.provider === 'claude' ? 'anthropic' : 'openai';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 z-40"
        aria-label="Open AI Workstation"
      >
        <MessageSquare size={20} />
      </button>
    );
  }

  return (
    <>
      <div className="fixed right-0 top-0 h-screen w-full sm:w-[480px] bg-white border-l border-gray-200 shadow-xl flex flex-col z-40">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={`p-1 rounded hover:bg-gray-100 ${showHistory ? 'text-blue-600' : 'text-gray-500'}`}
              title="Conversation history"
            >
              <MessageSquare size={18} />
            </button>
            <button
              onClick={() => {
                ws.conversations.setActiveId(null);
                setShowHistory(false);
              }}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              title="New conversation"
            >
              <Plus size={18} />
            </button>
          </div>
          <h2 className="font-semibold text-sm">AI Workstation</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              title="Close"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Provider toggle + model picker */}
        <ChatHeader
          provider={ws.provider}
          setProvider={ws.setProvider}
          model={ws.model}
          setModel={ws.setModel}
          hasKey={ws.hasKey}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Conversation history list (collapsible) */}
        {showHistory && (
          <ConversationList
            conversations={ws.conversations.conversations}
            activeId={ws.conversations.activeId}
            onSelect={(id) => {
              ws.conversations.setActiveId(id);
              setShowHistory(false);
            }}
            onDelete={ws.conversations.deleteConversation}
          />
        )}

        {/* Message thread */}
        <MessageList
          messages={ws.conversations.messages}
          streaming={ws.streaming.streaming}
          streamedText={ws.streaming.streamedText}
        />

        {/* Error banner */}
        {ws.error && (
          <div className="mx-4 my-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start justify-between gap-2">
            <span>{ws.error}</span>
            <button
              onClick={() => ws.setError(null)}
              className="underline text-xs whitespace-nowrap"
            >
              dismiss
            </button>
          </div>
        )}

        {/* Chat input */}
        <ChatInput
          onSend={ws.sendMessage}
          streaming={ws.streaming.streaming}
          onStop={ws.streaming.stop}
          disabled={!ws.hasKey(providerKeyField)}
        />
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
