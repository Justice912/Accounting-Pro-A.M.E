import { useState, useCallback, useRef } from 'react';

export function useStreamingChat() {
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const abortRef = useRef(null);

  const streamClaude = useCallback(async ({ apiKey, model, system, messages, onChunk, onDone, onError }) => {
    setStreaming(true);
    setStreamedText('');
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model, system, messages }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              fullText += event.delta.text;
              setStreamedText(fullText);
              onChunk?.(event.delta.text, fullText);
            }
            if (event.type === 'message_stop') {
              onDone?.(fullText);
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }

      onDone?.(fullText);
      return fullText;
    } catch (e) {
      if (e.name !== 'AbortError') onError?.(e);
      throw e;
    } finally {
      setStreaming(false);
      setStreamedText('');
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setStreamedText('');
  }, []);

  return { streaming, streamedText, streamClaude, stop };
}
