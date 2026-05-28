// Vercel serverless proxy for the Anthropic Messages API.
//
// Auth: requires a Firebase ID token in Authorization: Bearer <token>.
// Anonymous Firebase sign-in counts — anyone who has loaded the app and
// completed an anon sign-in can call this endpoint, but unauthenticated
// callers cannot.
//
// Key resolution (in order):
//   1. `x-anthropic-api-key` request header — user-supplied "BYOK" key
//      pasted into the sidebar Settings panel. Held in sessionStorage with
//      a short TTL on the client; sent on a single header per request.
//   2. `process.env.ANTHROPIC_API_KEY` — the server env var, default for
//      production deploys where the operator pays.
//
// Rate limiting:
//   * 30 req / minute / authenticated uid (steady cap)
//   * 60 req / minute / IP   (back-stop in case multiple uids share an IP)
//
// Streaming: Node runtime is used because the Edge runtime cannot import
// modules with a Node-style filesystem path during local Vercel dev when
// the auth helper uses Node Buffer fallbacks. The Anthropic SSE body is
// piped through unchanged.

import { requireAuth, AuthError } from './_lib/auth.js';
import { rateLimit, clientIp } from './_lib/rateLimit.js';

export const config = { runtime: 'edge' };

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_USER = 30;
const RATE_LIMIT_MAX_PER_IP = 60;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    return jsonResponse({ error: 'unsupported_media_type' }, 415);
  }

  let auth;
  try {
    auth = await requireAuth(req);
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return jsonResponse({ error: 'unauthenticated' }, status);
  }

  const ip = clientIp(req);
  if (!rateLimit(`claude:uid:${auth.uid}`, { max: RATE_LIMIT_MAX_PER_USER, windowMs: RATE_LIMIT_WINDOW_MS })) {
    return jsonResponse({ error: 'rate_limited' }, 429);
  }
  if (!rateLimit(`claude:ip:${ip}`, { max: RATE_LIMIT_MAX_PER_IP, windowMs: RATE_LIMIT_WINDOW_MS })) {
    return jsonResponse({ error: 'rate_limited' }, 429);
  }

  // BYOK key from header (validated shape) or server env var fallback.
  const headerKey = req.headers.get('x-anthropic-api-key')?.trim();
  let apiKey;
  if (headerKey) {
    if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(headerKey)) {
      return jsonResponse({ error: 'invalid_api_key_format' }, 400);
    }
    apiKey = headerKey;
  } else {
    apiKey = process.env.ANTHROPIC_API_KEY;
  }
  if (!apiKey) {
    return jsonResponse({ error: 'server_misconfigured' }, 500);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json_body' }, 400);
  }

  const { messages, system, tools, tool_choice } = payload || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: 'messages_required' }, 400);
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
    // Do not leak the upstream error text to the client.
    console.error('Anthropic upstream error', upstream.status);
    return jsonResponse({ error: 'upstream_error' }, upstream.status || 502);
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
