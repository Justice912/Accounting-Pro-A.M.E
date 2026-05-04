import { useState } from 'react';
import { Send, Square } from 'lucide-react';

export function ChatInput({ onSend, streaming, onStop, disabled }) {
  const [text, setText] = useState('');

  function submit() {
    if (!text.trim() || streaming) return;
    onSend(text);
    setText('');
  }

  return (
    <div className="border-t p-3 bg-white">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={disabled ? 'Add an API key to start chatting...' : 'Ask anything... (Shift+Enter for new line)'}
          disabled={disabled || streaming}
          rows={1}
          className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 max-h-32"
          style={{ minHeight: '40px' }}
        />
        {streaming ? (
          <button
            onClick={onStop}
            className="bg-red-600 text-white rounded-lg p-2 hover:bg-red-700 flex-shrink-0"
            title="Stop generating"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={disabled || !text.trim()}
            className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 disabled:bg-gray-300 flex-shrink-0"
            title="Send (Enter)"
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
