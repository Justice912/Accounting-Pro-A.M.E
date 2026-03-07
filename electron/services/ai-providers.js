/**
 * AI Provider Configurations
 * 4 providers: claude, openai, deepseek, kimi
 * Each with name, endpoint, models catalog, headers, formatRequest, parseResponse
 */

const providers = {
  claude: {
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    models: {
      default: 'claude-sonnet-4-6',
      catalog: [
        { id: 'claude-opus-4-6', label: 'Opus 4.6', tier: 'flagship', contextWindow: 200000 },
        { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', tier: 'fast', contextWindow: 200000 },
        { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', tier: 'budget', contextWindow: 200000 },
      ],
    },
    supportsStreaming: true,
    headers(apiKey) {
      return {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
    },
    formatRequest(systemPrompt, messages, options = {}) {
      const model = options.model || this.models.default;
      const formattedMessages = messages.map((m) => ({
        role: m.role === 'system' ? 'user' : m.role,
        content: m.content,
      }));
      return {
        model,
        max_tokens: options.maxTokens || 4096,
        system: systemPrompt,
        messages: formattedMessages,
        temperature: options.temperature ?? 0.7,
      };
    },
    parseResponse(data) {
      return {
        content: data.content?.[0]?.text || '',
        model: data.model,
        tokensInput: data.usage?.input_tokens || 0,
        tokensOutput: data.usage?.output_tokens || 0,
        stopReason: data.stop_reason,
      };
    },
  },

  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: {
      default: 'gpt-4.1',
      catalog: [
        { id: 'gpt-4.1', label: 'GPT-4.1', tier: 'flagship', contextWindow: 1047576 },
        { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', tier: 'budget', contextWindow: 1047576 },
        { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', tier: 'budget', contextWindow: 1047576 },
        { id: 'o3', label: 'o3 Reasoning', tier: 'reasoning', contextWindow: 200000 },
        { id: 'o4-mini', label: 'o4-mini', tier: 'reasoning', contextWindow: 200000 },
      ],
    },
    supportsStreaming: true,
    headers(apiKey) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
    },
    formatRequest(systemPrompt, messages, options = {}) {
      const model = options.model || this.models.default;
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];
      return {
        model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
      };
    },
    parseResponse(data) {
      const choice = data.choices?.[0];
      return {
        content: choice?.message?.content || '',
        model: data.model,
        tokensInput: data.usage?.prompt_tokens || 0,
        tokensOutput: data.usage?.completion_tokens || 0,
        stopReason: choice?.finish_reason,
      };
    },
  },

  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    models: {
      default: 'deepseek-chat',
      catalog: [
        { id: 'deepseek-chat', label: 'DeepSeek V3', tier: 'fast', contextWindow: 128000 },
        { id: 'deepseek-reasoner', label: 'DeepSeek R1', tier: 'reasoning', contextWindow: 128000 },
      ],
    },
    supportsStreaming: true,
    headers(apiKey) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
    },
    formatRequest(systemPrompt, messages, options = {}) {
      const model = options.model || this.models.default;
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];
      return {
        model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
      };
    },
    parseResponse(data) {
      const choice = data.choices?.[0];
      return {
        content: choice?.message?.content || '',
        model: data.model,
        tokensInput: data.usage?.prompt_tokens || 0,
        tokensOutput: data.usage?.completion_tokens || 0,
        stopReason: choice?.finish_reason,
      };
    },
  },

  kimi: {
    name: 'Moonshot Kimi',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    models: {
      default: 'moonshot-v1-8k',
      catalog: [
        { id: 'moonshot-v1-8k', label: 'Kimi 8K', tier: 'fast', contextWindow: 8000 },
        { id: 'moonshot-v1-32k', label: 'Kimi 32K', tier: 'fast', contextWindow: 32000 },
        { id: 'moonshot-v1-128k', label: 'Kimi 128K', tier: 'flagship', contextWindow: 128000 },
      ],
    },
    supportsStreaming: true,
    headers(apiKey) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
    },
    formatRequest(systemPrompt, messages, options = {}) {
      const model = options.model || this.models.default;
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];
      return {
        model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
      };
    },
    parseResponse(data) {
      const choice = data.choices?.[0];
      return {
        content: choice?.message?.content || '',
        model: data.model,
        tokensInput: data.usage?.prompt_tokens || 0,
        tokensOutput: data.usage?.completion_tokens || 0,
        stopReason: choice?.finish_reason,
      };
    },
  },
};

/**
 * Get a flat list of all models across all providers
 */
export function getAllModels() {
  const models = [];
  for (const [providerKey, provider] of Object.entries(providers)) {
    for (const model of provider.models.catalog) {
      models.push({
        ...model,
        provider: providerKey,
        providerName: provider.name,
      });
    }
  }
  return models;
}

/**
 * Find which provider owns a given model ID
 */
export function getProviderForModel(modelId) {
  for (const [providerKey, provider] of Object.entries(providers)) {
    if (provider.models.catalog.some(m => m.id === modelId)) {
      return providerKey;
    }
  }
  return null;
}

export default providers;
