import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AIProviderContext = createContext();

export const useAIProvider = () => useContext(AIProviderContext);

// Full model catalog matching ai-providers.js
const MODEL_CATALOG = {
  claude: {
    name: 'Anthropic',
    models: [
      { id: 'claude-opus-4-6', label: 'Opus 4.6', tier: 'flagship' },
      { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', tier: 'fast' },
      { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', tier: 'budget' },
    ],
  },
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4.1', label: 'GPT-4.1', tier: 'flagship' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', tier: 'budget' },
      { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', tier: 'budget' },
      { id: 'o3', label: 'o3 Reasoning', tier: 'reasoning' },
      { id: 'o4-mini', label: 'o4-mini', tier: 'reasoning' },
    ],
  },
  deepseek: {
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek V3', tier: 'fast' },
      { id: 'deepseek-reasoner', label: 'DeepSeek R1', tier: 'reasoning' },
    ],
  },
  kimi: {
    name: 'Moonshot Kimi',
    models: [
      { id: 'moonshot-v1-8k', label: 'Kimi 8K', tier: 'fast' },
      { id: 'moonshot-v1-32k', label: 'Kimi 32K', tier: 'fast' },
      { id: 'moonshot-v1-128k', label: 'Kimi 128K', tier: 'flagship' },
    ],
  },
};

export { MODEL_CATALOG };

export function AIProviderProvider({ children }) {
  const [activeProvider, setActiveProvider] = useState('claude');
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
  const [providerHealth, setProviderHealth] = useState({});
  const [autoFailover, setAutoFailover] = useState(true);

  // Load persisted model selection
  useEffect(() => {
    if (window.api?.getSettings) {
      window.api.getSettings().then(settings => {
        if (settings?.selected_model) {
          setSelectedModel(settings.selected_model);
          // Derive provider from model ID
          for (const [provKey, provData] of Object.entries(MODEL_CATALOG)) {
            if (provData.models.some(m => m.id === settings.selected_model)) {
              setActiveProvider(provKey);
              break;
            }
          }
        }
      }).catch(() => {});
    }
  }, []);

  // Persist model selection when changed
  const handleSetModel = useCallback((modelId) => {
    setSelectedModel(modelId);
    // Derive and set provider
    for (const [provKey, provData] of Object.entries(MODEL_CATALOG)) {
      if (provData.models.some(m => m.id === modelId)) {
        setActiveProvider(provKey);
        break;
      }
    }
    // Persist
    if (window.api?.saveSettings) {
      window.api.getSettings().then(settings => {
        window.api.saveSettings({ ...settings, selected_model: modelId });
      }).catch(() => {});
    }
  }, []);

  const checkHealth = useCallback(async () => {
    if (window.api) {
      try {
        const health = await window.api.getProviderHealth();
        setProviderHealth(health);
      } catch (e) {
        console.error('Health check failed:', e);
      }
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <AIProviderContext.Provider value={{
      activeProvider, setActiveProvider,
      selectedModel, setSelectedModel: handleSetModel,
      providerHealth, autoFailover, setAutoFailover,
      checkHealth
    }}>
      {children}
    </AIProviderContext.Provider>
  );
}
