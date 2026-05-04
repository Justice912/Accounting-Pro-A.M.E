export const PROVIDERS = {
  claude: {
    id: 'claude',
    name: 'Claude',
    models: [
      { id: 'claude-opus-4-7', label: 'Opus 4.7 (most capable)' },
      { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (balanced)' },
      { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (fastest)' },
    ],
    defaultModel: 'claude-sonnet-4-6',
    keyField: 'anthropic',
    keyPattern: /^sk-ant-/,
    keyHint: 'Starts with sk-ant-',
    endpoint: '/api/ai/claude',
    supportsStreaming: true,
  },
  openai: {
    id: 'openai',
    name: 'ChatGPT',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o (most capable)' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (fast/cheap)' },
    ],
    defaultModel: 'gpt-4o',
    keyField: 'openai',
    keyPattern: /^sk-/,
    keyHint: 'Starts with sk-',
    endpoint: '/api/ai/openai',
    supportsStreaming: false,
  },
};

export const DEFAULT_SYSTEM_PROMPT = `You are AME Pro AI Assistant, an expert in South African accounting, tax, VAT, payroll, and business advisory. You assist accountants and tax practitioners with technical questions, calculations, and document drafting. You are precise, professional, and grounded in current SARS guidance and IFRS for SMEs.`;
