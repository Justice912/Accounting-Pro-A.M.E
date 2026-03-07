import crypto from 'crypto';
import workflowEngine from '../services/workflow-engine.js';
import { getProviderForModel } from '../services/ai-providers.js';

/**
 * Register IPC handlers for AI operations
 * @param {Electron.IpcMain} ipcMain
 * @param {Object} services - { aiGateway, promptEngine, keychain, database }
 */
export default function registerAIHandlers(ipcMain, services) {
  const { aiGateway, promptEngine, keychain, database } = services;

  // Priority order for provider auto-selection
  const PROVIDER_PRIORITY = ['claude', 'openai', 'deepseek', 'kimi'];

  /**
   * Get the first configured and healthy provider
   */
  function getAvailableProvider() {
    for (const name of PROVIDER_PRIORITY) {
      if (keychain.hasApiKey(name)) {
        return name;
      }
    }
    return null;
  }

  /**
   * ai:send - Load domain prompt, select model/provider, send via gateway, save messages, return response
   * Args: domain, subdomain, messages, conversationId, model
   */
  ipcMain.handle('ai:send', async (event, domain, subdomain, messages, conversationId, requestedModel) => {
    try {
      // Determine provider: from requested model or auto-select
      let targetProvider = null;
      let modelOption = null;

      if (requestedModel) {
        targetProvider = getProviderForModel(requestedModel);
        if (targetProvider && keychain.hasApiKey(targetProvider)) {
          modelOption = requestedModel;
        } else {
          // Requested model's provider not configured, fall back
          targetProvider = null;
        }
      }

      if (!targetProvider) {
        targetProvider = getAvailableProvider();
      }

      if (!targetProvider) {
        throw new Error('No AI providers configured. Add an API key in Settings.');
      }

      // Load the domain-specific system prompt
      let systemPrompt = promptEngine.loadPrompt(domain, subdomain || 'general');

      // Detect workflow from user message
      const lastUserMessage = messages[messages.length - 1];
      const userText = lastUserMessage?.role === 'user' ? lastUserMessage.content : '';
      const workflow = workflowEngine.selectWorkflow(domain, userText);

      // Append workflow instructions to system prompt if matched
      if (workflow) {
        const workflowPrompt = workflowEngine.buildWorkflowPrompt(workflow);
        systemPrompt = systemPrompt + '\n\n' + workflowPrompt;
      }

      // Build options with selected model
      const sendOptions = { domain };
      if (modelOption) {
        sendOptions.model = modelOption;
      }

      // If specific model requested, try that provider first then failover
      const configuredProviders = PROVIDER_PRIORITY.filter(p => keychain.hasApiKey(p));
      // Put the target provider first in the list
      const orderedProviders = [
        targetProvider,
        ...configuredProviders.filter(p => p !== targetProvider),
      ];

      const result = await aiGateway.handleFailover(
        orderedProviders,
        systemPrompt,
        messages,
        sendOptions
      );

      const usedProvider = result.provider || provider;

      // Save the user message and AI response to database if conversation exists
      if (conversationId) {
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.role === 'user') {
          database.insert('messages', {
            id: crypto.randomUUID(),
            conversation_id: conversationId,
            role: 'user',
            content: lastUserMessage.content,
          });
        }

        database.insert('messages', {
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          role: 'assistant',
          content: result.content,
          provider: usedProvider,
          model: result.model,
          tokens_input: result.tokensInput,
          tokens_output: result.tokensOutput,
        });

        // Save workflow type if detected
        if (workflow) {
          database.run(
            'UPDATE conversations SET workflow_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [workflow.id, conversationId]
          );
        } else {
          database.run(
            'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [conversationId]
          );
        }
      }

      // Log to audit trail
      database.insert('audit_trail', {
        id: crypto.randomUUID(),
        action: 'ai_query',
        resource_type: 'conversation',
        resource_id: conversationId || null,
        details: JSON.stringify({
          provider: usedProvider,
          domain,
          subdomain,
          model: result.model,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
        }),
      });

      return {
        success: true,
        content: result.content,
        message: result.content,
        model: result.model,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        estimatedCostZar: result.estimatedCostZar || 0,
        provider: usedProvider,
        workflow: workflow ? {
          id: workflow.id,
          name: workflow.name,
          stepCount: workflow.steps.length,
        } : null,
      };
    } catch (error) {
      console.error('[AI Handler] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  /**
   * ai:health - Return health status of all providers
   */
  ipcMain.handle('ai:health', async () => {
    try {
      return aiGateway.getHealthState();
    } catch (error) {
      console.error('[AI Handler] Health check error:', error);
      return { error: error.message };
    }
  });

  /**
   * ai:test - Test a specific provider with a simple request
   */
  ipcMain.handle('ai:test', async (event, provider) => {
    try {
      const apiKey = keychain.getApiKey(provider);
      if (!apiKey) {
        return {
          success: false,
          error: `No API key configured for ${provider}`,
        };
      }

      const result = await aiGateway.sendRequest(
        provider,
        'You are a helpful assistant. Respond with exactly: "Connection successful."',
        [{ role: 'user', content: 'Test connection' }],
        { maxTokens: 20 }
      );

      return {
        success: true,
        response: result.content,
        model: result.model,
        latency: result.latency,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });
}
