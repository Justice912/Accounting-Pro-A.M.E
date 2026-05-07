import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Trash2, Settings } from 'lucide-react';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import ToggleButton from './ToggleButton.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import { runChat } from './claudeClient.js';

const STORAGE_KEY = 'claude-sidebar-history-v1';

// Convert the API-shape conversation array into a flat list of view-messages.
// Tool calls and tool results are folded into compact "tool" rows so the user
// can see the action trail without seeing raw JSON.
function buildViewMessages(apiMessages) {
  const view = [];
  for (const msg of apiMessages) {
    if (typeof msg.content === 'string') {
      view.push({ id: `${view.length}`, role: msg.role, blocks: [{ type: 'text', text: msg.content }] });
      continue;
    }
    if (!Array.isArray(msg.content)) continue;

    if (msg.role === 'user') {
      // user can be either a real user message or a tool_result wrapper.
      const toolResults = msg.content.filter((b) => b.type === 'tool_result');
      const texts = msg.content.filter((b) => b.type === 'text');
      if (toolResults.length) {
        for (const tr of toolResults) {
          view.push({
            id: `${view.length}`,
            role: 'tool',
            blocks: [{ type: 'text', text: tr.is_error ? 'Tool failed.' : 'Tool finished.' }],
          });
        }
      }
      if (texts.length) {
        view.push({
          id: `${view.length}`,
          role: 'user',
          blocks: texts.map((b) => ({ type: 'text', text: b.text })),
        });
      }
    } else if (msg.role === 'assistant') {
      const blocks = [];
      for (const b of msg.content) {
        if (b.type === 'text' && b.text) blocks.push({ type: 'text', text: b.text });
        else if (b.type === 'tool_use') blocks.push({ type: 'tool_use', name: b.name });
      }
      if (blocks.length) {
        view.push({ id: `${view.length}`, role: 'assistant', blocks });
      }
    }
  }
  return view;
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([]); // API-shape conversation
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  // Restore from sessionStorage on first mount.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // sessionStorage might be full or disabled — non-fatal.
    }
  }, [messages]);

  // Esc closes the sidebar.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const viewMessages = useMemo(() => {
    const base = buildViewMessages(messages);
    if (isStreaming && streamingText) {
      base.push({
        id: 'streaming',
        role: 'assistant',
        blocks: [{ type: 'text', text: streamingText }],
      });
    }
    return base;
  }, [messages, streamingText, isStreaming]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    setError(null);

    const userMessage = { role: 'user', content: [{ type: 'text', text }] };
    const baseConvo = [...messages, userMessage];
    setMessages(baseConvo);

    setIsStreaming(true);
    setStreamingText('');
    const controller = new AbortController();
    abortRef.current = controller;

    let liveText = '';
    try {
      const finalConvo = await runChat({
        messages: baseConvo,
        signal: controller.signal,
        onAssistantStart: () => {
          liveText = '';
          setStreamingText('');
        },
        onDelta: (chunk) => {
          liveText += chunk;
          setStreamingText(liveText);
        },
      });
      setMessages(finalConvo);
    } catch (err) {
      if (err.name === 'AbortError') {
        // user pressed Stop — keep what we have
      } else {
        setError(err.message || String(err));
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      abortRef.current = null;
    }
  }, [input, isStreaming, messages]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleClear = useCallback(() => {
    if (isStreaming) abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreamingText('');
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [isStreaming]);

  return (
    <>
      <ToggleButton isOpen={isOpen} onToggle={() => setIsOpen(true)} />

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[55] sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl border-l border-slate-200 z-[60] flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full sm:w-[380px]`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">C</div>
            <div className="leading-tight">
              <p className="font-semibold text-sm">Claude Assistant</p>
              <p className="text-[11px] text-emerald-100">In-app actions enabled</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-emerald-100 hover:text-white inline-flex items-center gap-1"
              title="Clear chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear chat
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((v) => !v)}
              className="rounded-md p-1 hover:bg-white/15"
              aria-label="Settings"
              title="Settings (API key)"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 hover:bg-white/15"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 flex flex-col min-h-0">
          <MessageList viewMessages={viewMessages} isStreaming={isStreaming && !streamingText} />
          {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
        />
      </aside>
    </>
  );
}
