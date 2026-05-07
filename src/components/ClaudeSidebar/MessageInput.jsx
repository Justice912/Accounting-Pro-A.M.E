import React, { useEffect, useRef } from 'react';
import { Send, Square } from 'lucide-react';

// Auto-growing textarea capped at 6 rows. Enter to send, Shift+Enter for
// newline. Send is disabled while empty; Stop replaces Send while streaming.
export default function MessageInput({ value, onChange, onSend, onStop, isStreaming, disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 20; // ~text-sm leading
    const maxHeight = lineHeight * 6 + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) onSend();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white px-3 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={disabled}
          placeholder={isStreaming ? 'Claude is responding...' : 'Ask Claude to do something...'}
          className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm leading-5 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 rounded-lg bg-red-600 hover:bg-red-700 text-white p-2.5"
            title="Stop"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim() || disabled}
            className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white p-2.5"
            title="Send (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 px-1">
        Enter to send · Shift+Enter for newline · Esc to close
      </p>
    </div>
  );
}
