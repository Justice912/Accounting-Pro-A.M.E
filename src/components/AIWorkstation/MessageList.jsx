import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

export function MessageList({ messages, streaming, streamedText }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedText]);

  if (messages.length === 0 && !streaming) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm px-8 text-center">
        Ask anything about SA tax, accounting, payroll, or your practice.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((m) => (
        <MessageBubble key={m.id} role={m.role} content={m.content} />
      ))}
      {streaming && streamedText && (
        <MessageBubble role="assistant" content={streamedText} streaming />
      )}
      <div ref={endRef} />
    </div>
  );
}
