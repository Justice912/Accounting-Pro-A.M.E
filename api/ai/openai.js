export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, messages, system, model } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing API key' });
  }

  const fullMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        max_tokens: 4096,
        messages: fullMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'OpenAI request failed' });
    }

    return res.status(200).json({
      content: data.choices[0].message.content,
      usage: data.usage,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
