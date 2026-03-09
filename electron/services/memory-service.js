import crypto from 'crypto';

let database = null;

function init(db) {
  database = db;
}

/**
 * Save a memory entry (fact, correction, preference, or task record)
 */
function saveMemory({ type = 'fact', domain, content, sourceConversationId }) {
  if (!database || !content) return null;
  const id = crypto.randomUUID();
  database.insert('ai_memory', {
    id,
    type,
    domain: domain || 'general',
    content,
    source_conversation_id: sourceConversationId || null,
    relevance_score: 1.0,
  });
  console.log(`[Memory] Saved ${type}: ${content.substring(0, 60)}...`);
  return id;
}

/**
 * Get relevant memories for a domain, ordered by recency and relevance
 */
function getMemories(domain, limit = 20) {
  if (!database) return [];
  try {
    return database.getAll(
      `SELECT * FROM ai_memory
       WHERE domain = ? OR domain = 'general'
       ORDER BY relevance_score DESC, created_at DESC
       LIMIT ?`,
      [domain || 'general', limit]
    );
  } catch {
    return [];
  }
}

/**
 * Get all memories (for UI display)
 */
function getAllMemories(limit = 100) {
  if (!database) return [];
  try {
    return database.getAll(
      'SELECT * FROM ai_memory ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
  } catch {
    return [];
  }
}

/**
 * Delete a specific memory
 */
function deleteMemory(id) {
  if (!database) return;
  database.run('DELETE FROM ai_memory WHERE id = ?', [id]);
}

/**
 * Clear all memories for a domain (or all)
 */
function clearMemories(domain) {
  if (!database) return;
  if (domain) {
    database.run('DELETE FROM ai_memory WHERE domain = ?', [domain]);
  } else {
    database.run('DELETE FROM ai_memory');
  }
}

/**
 * Auto-extract learnings from a conversation exchange.
 * Detects corrections, key facts, and preferences.
 */
function extractLearnings(userMessage, aiResponse, domain, conversationId) {
  if (!userMessage || !aiResponse) return;

  const userLower = userMessage.toLowerCase();

  // Detect corrections: user says "no", "wrong", "actually", "correct answer is"
  const correctionPatterns = [
    /^no[,.\s]/i,
    /that'?s (?:wrong|incorrect|not right)/i,
    /actually[,\s]/i,
    /the correct (?:answer|rate|amount|value|number)/i,
    /you(?:'re| are) (?:wrong|mistaken|incorrect)/i,
    /please (?:note|remember|correct)/i,
  ];

  for (const pattern of correctionPatterns) {
    if (pattern.test(userMessage)) {
      saveMemory({
        type: 'correction',
        domain,
        content: `User correction: ${userMessage.substring(0, 500)}`,
        sourceConversationId: conversationId,
      });
      return;
    }
  }

  // Detect preference signals
  const prefPatterns = [
    /(?:i (?:prefer|always|want|like|need))\s+(.+)/i,
    /(?:please always|from now on|remember to)\s+(.+)/i,
  ];
  for (const pattern of prefPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      saveMemory({
        type: 'preference',
        domain,
        content: `User preference: ${match[0].substring(0, 500)}`,
        sourceConversationId: conversationId,
      });
      return;
    }
  }

  // Auto-save task summaries for substantial exchanges (AI response > 500 chars)
  if (aiResponse.length > 500 && userMessage.length > 20) {
    const taskSummary = `Q: ${userMessage.substring(0, 200)} → Responded with ${aiResponse.length} chars about ${domain}`;
    saveMemory({
      type: 'task',
      domain,
      content: taskSummary,
      sourceConversationId: conversationId,
    });
  }
}

/**
 * Build memory context string to inject into system prompt
 */
function buildMemoryContext(domain) {
  const memories = getMemories(domain, 15);
  if (!memories.length) return '';

  const corrections = memories.filter(m => m.type === 'correction');
  const facts = memories.filter(m => m.type === 'fact');
  const preferences = memories.filter(m => m.type === 'preference');
  const tasks = memories.filter(m => m.type === 'task').slice(0, 5);

  let context = '\n\n--- MEMORY & LEARNING CONTEXT ---\n';
  context += 'You have memory of previous interactions. Use this to provide better, consistent responses.\n\n';

  if (corrections.length) {
    context += '**Previous Corrections (IMPORTANT - avoid repeating these mistakes):**\n';
    corrections.forEach(m => { context += `- ${m.content}\n`; });
    context += '\n';
  }

  if (facts.length) {
    context += '**Known Facts:**\n';
    facts.forEach(m => { context += `- ${m.content}\n`; });
    context += '\n';
  }

  if (preferences.length) {
    context += '**User Preferences:**\n';
    preferences.forEach(m => { context += `- ${m.content}\n`; });
    context += '\n';
  }

  if (tasks.length) {
    context += '**Recent Task History:**\n';
    tasks.forEach(m => { context += `- ${m.content}\n`; });
    context += '\n';
  }

  context += '--- END MEMORY CONTEXT ---\n';
  return context;
}

export default {
  init,
  saveMemory,
  getMemories,
  getAllMemories,
  deleteMemory,
  clearMemories,
  extractLearnings,
  buildMemoryContext,
};
