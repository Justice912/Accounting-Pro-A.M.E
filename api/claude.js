// Vercel serverless proxy for the Anthropic Messages API.
//
// Key resolution (in order):
//   1. The `x-anthropic-api-key` request header — user-supplied "BYOK" key
//      pasted into the sidebar Settings panel, kept in their browser's
//      localStorage. Used when individual users want to put usage on their
//      own Anthropic billing.
//   2. `process.env.ANTHROPIC_API_KEY` — the server env var. The default for
//      production deploys where the operator pays. Configure it in Vercel:
//        Project -> Settings -> Environment Variables -> ANTHROPIC_API_KEY.
//   If neither is present the request is rejected.
//
// The model is fixed server-side (claude-sonnet-4-6). The client cannot
// override it. Only `messages`, `system`, `tools` and `tool_choice` are
// forwarded from the request body.
//
// Streaming: this route uses the Vercel Edge runtime so it can stream the
// raw Server-Sent Event body straight from Anthropic to the browser without
// buffering. The browser parses the SSE chunks via fetch + ReadableStream.
//
// Rate limiting: a small in-memory sliding window (30 req / minute / IP).
// Edge instances are short-lived, so this is a soft cap rather than a hard
// guarantee. It is enough to stop a runaway client during local dev.

export const config = { runtime: 'edge' };

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const ipHits = new Map(); // ip -> [timestamp, timestamp, ...]

function rateLimit(ip) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const hits = (ipHits.get(ip) || []).filter((t) => t > cutoff);
  if (hits.length >= RATE_LIMIT_MAX) {
    ipHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return true;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Prefer a user-supplied key from the request header (BYOK), otherwise
  // fall back to the server env var. Header keys are validated to look like
  // an Anthropic key so a stray client can't smuggle arbitrary values.
  const headerKey = req.headers.get('x-anthropic-api-key')?.trim();
  let apiKey;
  if (headerKey) {
    if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(headerKey)) {
      return jsonResponse(
        { error: 'The supplied Anthropic API key looks malformed. It should start with "sk-ant-".' },
        400,
      );
    }
    apiKey = headerKey;
  } else {
    apiKey = process.env.ANTHROPIC_API_KEY;
  }
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          'No Anthropic API key available. Either paste a key in the sidebar Settings panel, or add ANTHROPIC_API_KEY in Vercel -> Project Settings -> Environment Variables.',
      },
      500,
    );
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  if (!rateLimit(ip)) {
    return jsonResponse(
      { error: 'Too many requests. Please wait a minute and try again.' },
      429,
    );
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { messages, system, tools, tool_choice } = payload || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: 'messages[] is required' }, 400);
  }

  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    stream: true,
    messages,
  };
  if (system) body.system = system;
  if (Array.isArray(tools) && tools.length) body.tools = tools;
  if (tool_choice) body.tool_choice = tool_choice;

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text().catch(() => '');
    return jsonResponse(
      { error: `Anthropic API error (${upstream.status}): ${errorText}` },
      upstream.status || 502,
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
