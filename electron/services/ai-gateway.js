import providers from './ai-providers.js';
import keychain from './keychain.js';
import database from './database.js';
import promptEngine from './prompt-engine.js';
import crypto from 'crypto';

// Provider health state tracking
const healthState = {};

// ZAR cost estimates per 1M tokens (approximate, 1 USD ~ 18 ZAR)
const COST_PER_MILLION_TOKENS_ZAR = {
  // Anthropic Claude
  'claude-opus-4-6': { input: 270, output: 1350 },
  'claude-sonnet-4-6': { input: 54, output: 270 },
  'claude-haiku-4-5-20251001': { input: 14.4, output: 72 },
  // OpenAI
  'gpt-4.1': { input: 36, output: 144 },
  'gpt-4.1-mini': { input: 7.2, output: 28.8 },
  'gpt-4.1-nano': { input: 1.8, output: 7.2 },
  'o3': { input: 180, output: 720 },
  'o4-mini': { input: 19.8, output: 79.2 },
  // DeepSeek
  'deepseek-chat': { input: 2, output: 4 },
  'deepseek-reasoner': { input: 10, output: 40 },
  // Kimi Moonshot
  'moonshot-v1-8k': { input: 18, output: 18 },
  'moonshot-v1-32k': { input: 36, output: 36 },
  'moonshot-v1-128k': { input: 108, output: 108 },
};

/**
 * Send a request to an AI provider
 */
async function sendRequest(providerName, systemPrompt, messages, options = {}) {
  const provider = providers[providerName];
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerName}`);
  }

  const apiKey = keychain.getApiKey(providerName);
  if (!apiKey) {
    throw new Error(`No API key configured for ${provider.name}. Add it in Settings.`);
  }

  const requestBody = provider.formatRequest(systemPrompt, messages, options);
  const headers = provider.headers(apiKey);

  const startTime = Date.now();

  try {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      updateHealthState(providerName, 'degraded', Date.now() - startTime);
      throw new Error(`${provider.name} API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const parsed = provider.parseResponse(data);
    const latency = Date.now() - startTime;

    // Update health state
    updateHealthState(providerName, 'healthy', latency);

    // Track usage
    const usedModel = parsed.model || requestBody.model;
    trackUsage(
      providerName,
      usedModel,
      parsed.tokensInput,
      parsed.tokensOutput,
      options.domain
    );

    // Compute cost for the response
    const costInfo = COST_PER_MILLION_TOKENS_ZAR[usedModel] || { input: 0, output: 0 };
    const estimatedCostZar =
      ((parsed.tokensInput || 0) / 1_000_000) * costInfo.input +
      ((parsed.tokensOutput || 0) / 1_000_000) * costInfo.output;

    return { ...parsed, estimatedCostZar: Math.round(estimatedCostZar * 10000) / 10000 };
  } catch (error) {
    const latency = Date.now() - startTime;
    if (!error.message.includes('API error')) {
      updateHealthState(providerName, 'down', latency);
    }
    throw error;
  }
}

/**
 * Load a domain-specific prompt and send request
 */
async function sendWithPrompt(providerName, domain, subdomain, messages, options = {}) {
  const systemPrompt = promptEngine.loadPrompt(domain, subdomain || 'general');
  return sendRequest(providerName, systemPrompt, messages, { ...options, domain });
}

/**
 * Handle failover across multiple providers
 */
async function handleFailover(providerList, systemPrompt, messages, options = {}) {
  const errors = [];

  for (const providerName of providerList) {
    try {
      const result = await sendRequest(providerName, systemPrompt, messages, options);
      return { ...result, provider: providerName };
    } catch (error) {
      console.warn(`[AI Gateway] ${providerName} failed:`, error.message);
      errors.push({ provider: providerName, error: error.message });
    }
  }

  throw new Error(
    `All providers failed: ${errors.map((e) => `${e.provider}: ${e.error}`).join('; ')}`
  );
}

/**
 * Track usage in the database
 */
function trackUsage(providerName, model, tokensInput, tokensOutput, domain) {
  try {
    const costInfo = COST_PER_MILLION_TOKENS_ZAR[model] || { input: 0, output: 0 };
    const estimatedCostZar =
      (tokensInput / 1_000_000) * costInfo.input +
      (tokensOutput / 1_000_000) * costInfo.output;

    database.insert('usage_log', {
      id: crypto.randomUUID(),
      provider: providerName,
      model,
      domain: domain || null,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      estimated_cost_zar: Math.round(estimatedCostZar * 100) / 100,
    });
  } catch (e) {
    console.error('[AI Gateway] Error tracking usage:', e);
  }
}

/**
 * Update provider health state
 */
function updateHealthState(providerName, status, latency) {
  if (!healthState[providerName]) {
    healthState[providerName] = {
      status: 'healthy',
      lastCheck: null,
      latency: 0,
      errorRate: 0,
      requestCount: 0,
      errorCount: 0,
    };
  }

  const state = healthState[providerName];
  state.lastCheck = new Date().toISOString();
  state.latency = latency;
  state.requestCount++;

  if (status !== 'healthy') {
    state.errorCount++;
  }

  state.errorRate =
    state.requestCount > 0
      ? Math.round((state.errorCount / state.requestCount) * 100)
      : 0;
  state.status = status;
}

/**
 * Health check - ping all configured providers
 */
async function healthCheck() {
  const results = {};

  for (const [name, provider] of Object.entries(providers)) {
    const hasKey = keychain.hasApiKey(name);
    if (!hasKey) {
      results[name] = {
        status: 'unconfigured',
        name: provider.name,
        lastCheck: null,
        latency: null,
      };
      continue;
    }

    try {
      const startTime = Date.now();
      const apiKey = keychain.getApiKey(name);
      const testMessages = [{ role: 'user', content: 'Hello' }];
      const requestBody = provider.formatRequest('You are a test.', testMessages, {
        maxTokens: 5,
      });

      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: provider.headers(apiKey),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(10000),
      });

      const latency = Date.now() - startTime;
      const status = response.ok ? 'healthy' : 'degraded';
      updateHealthState(name, status, latency);

      results[name] = {
        status,
        name: provider.name,
        lastCheck: new Date().toISOString(),
        latency,
      };
    } catch (error) {
      updateHealthState(name, 'down', 0);
      results[name] = {
        status: 'down',
        name: provider.name,
        lastCheck: new Date().toISOString(),
        latency: null,
        error: error.message,
      };
    }
  }

  return results;
}

/**
 * Get current health state without pinging
 */
function getHealthState() {
  const results = {};
  for (const [name, provider] of Object.entries(providers)) {
    results[name] = {
      name: provider.name,
      configured: keychain.hasApiKey(name),
      ...(healthState[name] || { status: 'unknown', lastCheck: null, latency: null }),
    };
  }
  return results;
}

export default {
  sendRequest,
  sendWithPrompt,
  handleFailover,
  healthCheck,
  getHealthState,
  trackUsage,
};
