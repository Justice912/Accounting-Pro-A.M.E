import { useState, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuth } from './useAuth';
import { useApiKeys } from './useApiKeys';
import { useConversations } from './useConversations';
import { useStreamingChat } from './useStreamingChat';
import { PROVIDERS, DEFAULT_SYSTEM_PROMPT } from '../lib/aiProviders';

// The OpenAI proxy endpoint (`/api/ai/openai`) was removed in the security
// hardening pass because it accepted client-supplied keys without auth or
// rate limiting. Until an authenticated replacement is added, this
// workstation only supports the Claude provider.

export function useAIWorkstation() {
  const { user } = useAuth();
  const apiKeysState = useApiKeys();
  const { keys, hasKey } = apiKeysState;
  const conversations = useConversations();
  const streaming = useStreamingChat();

  const [provider, setProviderState] = useState('claude');
  const [model, setModel] = useState(PROVIDERS.claude.defaultModel);
  const [error, setError] = useState(null);

  const loadPreferences = useCallback(async () => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'config', 'preferences');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const p = snap.data();
      if (p.activeProvider && PROVIDERS[p.activeProvider]) {
        setProviderState(p.activeProvider);
        setModel(p.model || PROVIDERS[p.activeProvider].defaultModel);
      }
    }
  }, [user]);

  const savePreferences = useCallback(
    async (newProvider, newModel) => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid, 'config', 'preferences');
      await setDoc(ref, { activeProvider: newProvider, model: newModel }, { merge: true });
    },
    [user]
  );

  const setProvider = useCallback(
    async (newProvider) => {
      setProviderState(newProvider);
      const newModel = PROVIDERS[newProvider].defaultModel;
      setModel(newModel);
      await savePreferences(newProvider, newModel);
    },
    [savePreferences]
  );

  const sendMessage = useCallback(
    async (text) => {
      setError(null);
      const trimmed = text.trim();
      if (!trimmed) return;

      if (provider !== 'claude') {
        setError('Only the Claude provider is available. The OpenAI proxy was disabled in the security hardening pass.');
        return;
      }

      const providerConfig = PROVIDERS[provider];
      const apiKey = keys[providerConfig.keyField];
      // Empty apiKey is allowed — the server proxy falls back to its own key.

      let convId = conversations.activeId;
      if (!convId) {
        convId = await conversations.createConversation(trimmed, provider);
      }

      await conversations.addMessage(convId, 'user', trimmed, provider);

      const history = [
        ...conversations.messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: trimmed },
      ];

      try {
        const fullText = await streaming.streamClaude({
          apiKey: apiKey || '',
          system: DEFAULT_SYSTEM_PROMPT,
          messages: history,
          onError: (e) => setError(e.message),
        });
        if (fullText) {
          await conversations.addMessage(convId, 'assistant', fullText, provider);
        }
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
      }
    },
    [keys, provider, conversations, streaming]
  );

  return {
    provider,
    setProvider,
    model,
    setModel,
    keys,
    conversations,
    streaming,
    sendMessage,
    error,
    setError,
    loadPreferences,
    hasKey,
  };
}
