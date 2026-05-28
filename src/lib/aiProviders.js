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
  // OpenAI provider temporarily disabled — the legacy /api/ai/openai proxy
  // was removed in the security hardening pass (it accepted client-supplied
  // keys without auth or rate limiting). Re-enable once an authenticated
  // server endpoint exists.
};

export const DEFAULT_SYSTEM_PROMPT = `You are AME Pro AI Assistant, an expert in South African accounting, tax, VAT, payroll, and business advisory. You assist accountants and tax practitioners with technical questions, calculations, and document drafting. You are precise, professional, and grounded in current SARS guidance and IFRS for SMEs.`;
