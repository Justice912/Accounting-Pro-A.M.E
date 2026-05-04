export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { apiKey, messages, system, model } = await req.json();

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-6',
      max_tokens: 4096,
      stream: true,
      system: system || 'You are AME Pro AI Assistant, an expert in South African accounting, tax, and business advisory.',
      messages,
    }),
  });

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text();
    return new Response(JSON.stringify({ error: errorText }), {
      status: anthropicResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(anthropicResponse.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
