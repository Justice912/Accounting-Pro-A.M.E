import React, { useEffect, useRef } from 'react';
import Message from './Message.jsx';

// Scrollable list of messages. Each viewMessage has shape:
//   { id, role: 'user'|'assistant'|'tool', blocks: [{type, text, ...}] }
export default function MessageList({ viewMessages, isStreaming }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [viewMessages, isStreaming]);

  if (viewMessages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50">
        <div className="text-center text-slate-500 text-sm space-y-3 mt-6">
          <p className="font-medium text-slate-700">Hi, I'm Claude.</p>
          <p>I can navigate the app, look up clients, summarise data, and help you draft invoices.</p>
          <div className="text-left bg-white border border-slate-200 rounded-lg p-3 mx-2 text-xs space-y-1.5">
            <p className="font-semibold text-slate-700">Try:</p>
            <p>· "Show me my client list"</p>
            <p>· "Summarise this month's bank transactions"</p>
            <p>· "Create an invoice for Acme for R5,000 web development"</p>
            <p>· "How many pending invoices do we have?"</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 bg-slate-50 space-y-3">
      {viewMessages.map((m) => (
        <Message key={m.id} role={m.role} blocks={m.blocks} />
      ))}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-slate-400">
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:240ms]" />
            </span>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
