import crypto from 'crypto';

/**
 * Register IPC handlers for all database CRUD operations
 * @param {Electron.IpcMain} ipcMain
 * @param {Object} services - { database }
 */
export default function registerDBHandlers(ipcMain, services) {
  const { database } = services;

  // ==================== CONVERSATIONS ====================

  /**
   * db:conversations:list - Get conversations, optionally filtered by domain
   */
  ipcMain.handle('db:conversations:list', async (event, domain) => {
    try {
      if (domain) {
        return database.getAll(
          'SELECT * FROM conversations WHERE domain = ? ORDER BY updated_at DESC',
          [domain]
        );
      }
      return database.getAll(
        'SELECT * FROM conversations ORDER BY updated_at DESC'
      );
    } catch (error) {
      console.error('[DB Handler] Error listing conversations:', error);
      throw error;
    }
  });

  /**
   * db:conversations:save - Create or update a conversation
   */
  ipcMain.handle('db:conversations:save', async (event, data) => {
    try {
      const convData = {
        ...data,
        id: data.id || crypto.randomUUID(),
        updated_at: new Date().toISOString(),
      };

      if (!convData.created_at) {
        convData.created_at = new Date().toISOString();
      }

      const id = database.insert('conversations', convData);
      return { id, success: true };
    } catch (error) {
      console.error('[DB Handler] Error saving conversation:', error);
      throw error;
    }
  });

  /**
   * db:conversations:delete - Delete a conversation and its messages
   */
  ipcMain.handle('db:conversations:delete', async (event, id) => {
    try {
      database.run('DELETE FROM messages WHERE conversation_id = ?', [id]);
      database.run('DELETE FROM conversations WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('[DB Handler] Error deleting conversation:', error);
      throw error;
    }
  });

  /**
   * db:conversations:rename - Update conversation title
   */
  ipcMain.handle('db:conversations:rename', async (event, id, title) => {
    try {
      database.run(
        'UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?',
        [title, new Date().toISOString(), id]
      );
      return { success: true };
    } catch (error) {
      console.error('[DB Handler] Error renaming conversation:', error);
      throw error;
    }
  });

  /**
   * db:conversations:search - Search conversations by title
   */
  ipcMain.handle('db:conversations:search', async (event, query) => {
    try {
      return database.getAll(
        'SELECT * FROM conversations WHERE title LIKE ? ORDER BY updated_at DESC',
        [`%${query}%`]
      );
    } catch (error) {
      console.error('[DB Handler] Error searching conversations:', error);
      throw error;
    }
  });

  // ==================== MESSAGES ====================

  /**
   * db:messages:list - Get messages for a conversation
   */
  ipcMain.handle('db:messages:list', async (event, conversationId) => {
    try {
      return database.getAll(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );
    } catch (error) {
      console.error('[DB Handler] Error listing messages:', error);
      throw error;
    }
  });

  /**
   * db:messages:save - Save a message to a conversation
   */
  ipcMain.handle('db:messages:save', async (event, conversationId, message) => {
    try {
      const messageData = {
        id: message.id || crypto.randomUUID(),
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        provider: message.provider || null,
        model: message.model || null,
        tokens_input: message.tokensInput || null,
        tokens_output: message.tokensOutput || null,
      };

      const id = database.insert('messages', messageData);

      // Update conversation timestamp
      database.run(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );

      return { id, success: true };
    } catch (error) {
      console.error('[DB Handler] Error saving message:', error);
      throw error;
    }
  });

  // ==================== USAGE STATS ====================

  /**
   * db:usage:stats - Get aggregated usage statistics
   */
  ipcMain.handle('db:usage:stats', async () => {
    try {
      const summary = database.getOne(`
        SELECT
          COUNT(*) as total_requests,
          COALESCE(SUM(tokens_input), 0) as total_tokens_input,
          COALESCE(SUM(tokens_output), 0) as total_tokens_output,
          COALESCE(SUM(estimated_cost_zar), 0) as total_cost_zar
        FROM usage_log
      `);

      const byProvider = database.getAll(`
        SELECT
          provider,
          COUNT(*) as requests,
          COALESCE(SUM(tokens_input), 0) as tokens_input,
          COALESCE(SUM(tokens_output), 0) as tokens_output,
          COALESCE(SUM(estimated_cost_zar), 0) as cost_zar
        FROM usage_log
        GROUP BY provider
        ORDER BY requests DESC
      `);

      const byModel = database.getAll(`
        SELECT
          model,
          provider,
          COUNT(*) as requests,
          COALESCE(SUM(tokens_input), 0) as tokens_input,
          COALESCE(SUM(tokens_output), 0) as tokens_output,
          COALESCE(SUM(estimated_cost_zar), 0) as cost_zar
        FROM usage_log
        GROUP BY model
        ORDER BY requests DESC
      `);

      const last7Days = database.getAll(`
        SELECT
          DATE(created_at) as day,
          COUNT(*) as requests,
          COALESCE(SUM(estimated_cost_zar), 0) as cost_zar
        FROM usage_log
        WHERE created_at >= DATE('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY day DESC
      `);

      return {
        summary: {
          totalRequests: summary?.total_requests || 0,
          totalTokensInput: summary?.total_tokens_input || 0,
          totalTokensOutput: summary?.total_tokens_output || 0,
          totalCostZar: Math.round((summary?.total_cost_zar || 0) * 100) / 100,
        },
        byProvider,
        byModel,
        last7Days,
      };
    } catch (error) {
      console.error('[DB Handler] Error getting usage stats:', error);
      return { summary: { totalRequests: 0, totalTokensInput: 0, totalTokensOutput: 0, totalCostZar: 0 }, byProvider: [], byModel: [], last7Days: [] };
    }
  });

  // ==================== EXPORT ====================

  /**
   * db:conversations:export - Export a conversation as markdown text
   */
  ipcMain.handle('db:conversations:export', async (event, conversationId) => {
    try {
      const conv = database.getOne(
        'SELECT * FROM conversations WHERE id = ?',
        [conversationId]
      );
      if (!conv) throw new Error('Conversation not found');

      const msgs = database.getAll(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );

      let md = `# ${conv.title || 'Untitled Conversation'}\n`;
      md += `**Domain:** ${conv.domain || 'general'} | **Created:** ${conv.created_at}\n\n---\n\n`;

      for (const msg of msgs) {
        const role = msg.role === 'user' ? '**You**' : `**AME Pro** *(${msg.model || msg.provider || 'AI'})*`;
        const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString('en-ZA') : '';
        md += `### ${role} ${time ? `— ${time}` : ''}\n\n${msg.content}\n\n---\n\n`;
      }

      md += `\n*Exported from AME Pro AI Workstation on ${new Date().toLocaleString('en-ZA')}*\n`;

      return { success: true, markdown: md, title: conv.title || 'conversation' };
    } catch (error) {
      console.error('[DB Handler] Error exporting conversation:', error);
      throw error;
    }
  });
}
