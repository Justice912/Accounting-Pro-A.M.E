export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ valid: false, error: 'Missing API key' });
  }

  try {
    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });
      return res.status(200).json({ valid: r.ok, status: r.status });
    }

    if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return res.status(200).json({ valid: r.ok, status: r.status });
    }

    return res.status(400).json({ valid: false, error: 'Unknown provider' });
  } catch (e) {
    return res.status(500).json({ valid: false, error: e.message });
  }
}
