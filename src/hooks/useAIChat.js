import { useState, useCallback } from 'react';

export function useAIChat(defaultDomain = 'general', defaultSubdomain = 'general') {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (content, { domain, subdomain, conversationId, clientId } = {}) => {
    if (!content.trim()) return null;

    const userMsg = { role: 'user', content: content.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      if (window.api) {
        const response = await window.api.sendToAI({
          domain: domain || defaultDomain,
          subdomain: subdomain || defaultSubdomain,
          messages: allMessages,
          conversationId,
          clientId
        });

        const assistantMsg = {
          role: 'assistant',
          content: response?.content || response?.message || 'No response received.',
          provider: response?.provider || 'unknown',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
        return assistantMsg;
      } else {
        const devMsg = {
          role: 'assistant',
          content: `[Dev Mode] AI response for "${domain || defaultDomain}" would appear here.`,
          provider: 'dev',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, devMsg]);
        return devMsg;
      }
    } catch (err) {
      const errMsg = err.message || 'Failed to get AI response';
      setError(errMsg);
      const errorMsg = {
        role: 'assistant',
        content: `Error: ${errMsg}`,
        provider: 'error',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
      return errorMsg;
    } finally {
      setLoading(false);
    }
  }, [messages, defaultDomain, defaultSubdomain]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearMessages, setMessages };
}
