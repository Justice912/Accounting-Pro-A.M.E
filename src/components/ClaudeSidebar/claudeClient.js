// Streaming client for the /api/claude proxy + tool-use loop.
//
// Public entry point: streamClaude({ messages, onDelta, onToolUse, signal })
//
// The function POSTs to /api/claude (which holds the Anthropic key server
// side) and parses the SSE event stream from Anthropic's Messages API. It
// returns the assembled assistant message (text + tool_use blocks) when the
// stream ends.
//
// Tool-use loop is handled by runChat() below: it re-invokes Claude up to 5
// times, each time feeding back tool_result blocks for the tools Claude
// requested.

import { SYSTEM_PROMPT } from './systemPrompt.js';
import { getAnthropicTools, findTool } from './toolRegistry.js';
import { getKey } from './keyStore.js';
import { auth } from '../../api/firebase.js';

const MAX_TOOL_ITERATIONS = 5;

async function getFirebaseIdToken() {
  try {
    return (await auth?.currentUser?.getIdToken()) || null;
  } catch {
    return null;
  }
}

// Parse a single SSE event line buffer into { event, data }.
// Anthropic streams events like:
//   event: content_block_delta
//   data: {"type":"content_block_delta",...}
function parseSseChunk(chunk) {
  const events = [];
  for (const block of chunk.split('\n\n')) {
    if (!block.trim()) continue;
    let event = 'message';
    let data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (data) events.push({ event, data });
  }
  return events;
}

// One streaming round-trip with Anthropic via the proxy. Returns the assembled
// assistant message: { role: 'assistant', content: [ {type:'text',text}, {type:'tool_use',id,name,input}, ... ] }
async function streamOnce({ messages, onDelta, signal }) {
  // If the user pasted their own Anthropic key into the sidebar Settings
  // panel, forward it on a header. Otherwise the server falls back to its
  // own ANTHROPIC_API_KEY env var.
  const headers = { 'Content-Type': 'application/json' };
  const byok = getKey();
  if (byok) headers['x-anthropic-api-key'] = byok;

  // Required by /api/claude — Firebase ID token of the signed-in (possibly
  // anonymous) user. No token = unauthenticated and the call will 401.
  const idToken = await getFirebaseIdToken();
  if (idToken) headers.Authorization = `Bearer ${idToken}`;

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      messages,
      system: SYSTEM_PROMPT,
      tools: getAnthropicTools(),
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    let parsed;
    try {
      parsed = JSON.parse(errBody);
    } catch {
      parsed = { error: errBody || res.statusText };
    }
    throw new Error(parsed.error || `Request failed (${res.status})`);
  }
  if (!res.body) throw new Error('Response has no body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  // Reassemble the message from streamed events.
  const blocks = []; // { type: 'text', text } | { type: 'tool_use', id, name, inputJson, input }
  let stopReason = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const splitAt = buffer.lastIndexOf('\n\n');
    if (splitAt === -1) continue;
    const ready = buffer.slice(0, splitAt + 2);
    buffer = buffer.slice(splitAt + 2);

    for (const { event, data } of parseSseChunk(ready)) {
      if (event === 'ping') continue;
      let payload;
      try {
        payload = JSON.parse(data);
      } catch {
        continue;
      }

      switch (payload.type) {
        case 'content_block_start': {
          const cb = payload.content_block;
          if (cb.type === 'text') {
            blocks[payload.index] = { type: 'text', text: '' };
          } else if (cb.type === 'tool_use') {
            blocks[payload.index] = {
              type: 'tool_use',
              id: cb.id,
              name: cb.name,
              inputJson: '',
              input: {},
            };
          }
          break;
        }
        case 'content_block_delta': {
          const block = blocks[payload.index];
          if (!block) break;
          const d = payload.delta;
          if (d.type === 'text_delta' && block.type === 'text') {
            block.text += d.text;
            onDelta?.(d.text);
          } else if (d.type === 'input_json_delta' && block.type === 'tool_use') {
            block.inputJson += d.partial_json || '';
          }
          break;
        }
        case 'content_block_stop': {
          const block = blocks[payload.index];
          if (block?.type === 'tool_use') {
            try {
              block.input = block.inputJson ? JSON.parse(block.inputJson) : {};
            } catch {
              block.input = {};
            }
          }
          break;
        }
        case 'message_delta': {
          if (payload.delta?.stop_reason) stopReason = payload.delta.stop_reason;
          break;
        }
        case 'error': {
          throw new Error(payload.error?.message || 'Stream error');
        }
        default:
          break;
      }
    }
  }

  // Strip the inputJson scratch field from tool_use blocks.
  const cleaned = blocks.filter(Boolean).map((b) => {
    if (b.type === 'tool_use') {
      return { type: 'tool_use', id: b.id, name: b.name, input: b.input };
    }
    return { type: 'text', text: b.text };
  });

  return { role: 'assistant', content: cleaned, stop_reason: stopReason };
}

// Run a full chat turn including the tool-use loop.
// userMessages — the API-shape conversation so far (user + assistant blocks).
// Returns the final API-shape conversation array (with new assistant + any
// tool_use / tool_result rounds appended).
export async function runChat({
  messages,
  onAssistantStart,
  onDelta,
  onToolCall,
  onToolResult,
  signal,
}) {
  let convo = [...messages];

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    onAssistantStart?.(iter);
    const assistant = await streamOnce({ messages: convo, onDelta, signal });
    convo.push({ role: assistant.role, content: assistant.content });

    const toolUses = assistant.content.filter((b) => b.type === 'tool_use');
    if (toolUses.length === 0) {
      // Final answer.
      return convo;
    }

    // Execute every tool requested in this turn and feed the results back.
    const toolResults = [];
    for (const tu of toolUses) {
      onToolCall?.({ name: tu.name, input: tu.input });
      const tool = findTool(tu.name);
      let result;
      let isError = false;
      if (!tool) {
        result = { error: `Unknown tool: ${tu.name}` };
        isError = true;
      } else {
        try {
          result = await tool.execute(tu.input || {});
        } catch (err) {
          result = { error: err?.message || String(err) };
          isError = true;
        }
      }
      onToolResult?.({ name: tu.name, result, isError });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: JSON.stringify(result),
        is_error: isError || undefined,
      });
    }

    convo.push({ role: 'user', content: toolResults });
  }

  // Hit the iteration cap — nudge Claude to wrap up without more tool use.
  onAssistantStart?.(MAX_TOOL_ITERATIONS);
  const finalAssistant = await streamOnce({
    messages: [
      ...convo,
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'You have reached the tool-use limit for this turn. Please give your final answer in plain text without calling any more tools.',
          },
        ],
      },
    ],
    onDelta,
    signal,
  });
  convo.push({ role: finalAssistant.role, content: finalAssistant.content });
  return convo;
}
