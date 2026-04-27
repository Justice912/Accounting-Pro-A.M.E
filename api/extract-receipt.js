export const config = { maxDuration: 30 };

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

  if (!ALLOWED_MIME.has(mimeType)) {
    return res.status(400).json({ success: false, error: 'unsupported mimeType' });
  }

  if (!imageBase64) {
    return res.status(400).json({ success: false, error: 'imageBase64 required' });
  }

  if (typeof imageBase64 !== 'string' || imageBase64.length > 6_990_000) {
    return res.status(400).json({ success: false, error: 'imageBase64 must be a string under ~5 MB binary' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          system: `You are a South African VAT invoice data extractor. Extract the following fields from the receipt/invoice image and return ONLY valid JSON with no explanation:
{
  "supplier_name": "string or null",
  "supplier_vat_number": "string or null (10 digits starting with 4)",
  "supplier_address": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "total_excl_vat": number or null,
  "vat_amount": number or null,
  "total_incl_vat": number or null,
  "confidence": number between 0 and 1
}`,
          messages: [{
            role: 'user',
            content: [{
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            }, {
              type: 'text',
              text: 'Extract the VAT invoice data from this receipt and return JSON only.',
            }],
          }],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error', response.status, err);
      return res.status(502).json({ success: false, error: 'upstream_vision_error' });
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(502).json({ success: false, error: 'Could not parse AI response as JSON' });
    }
    let extracted;
    try {
      extracted = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch {
      return res.status(502).json({ success: false, error: 'Could not parse AI response as JSON' });
    }

    const toNum = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
    extracted.total_excl_vat = toNum(extracted.total_excl_vat);
    extracted.vat_amount     = toNum(extracted.vat_amount);
    extracted.total_incl_vat = toNum(extracted.total_incl_vat);

    const flags = [];
    if (!extracted.supplier_vat_number) flags.push('missing_vat_number');
    if (!extracted.invoice_number) flags.push('missing_invoice_number');
    if (extracted.total_excl_vat !== null && extracted.vat_amount !== null && extracted.total_incl_vat !== null) {
      if (Math.abs(extracted.total_excl_vat + extracted.vat_amount - extracted.total_incl_vat) > 0.02) {
        flags.push('vat_mismatch');
      }
    }

    const rawC = Number(extracted.confidence);
    const confidence = Number.isFinite(rawC) ? Math.max(0, Math.min(1, rawC)) : 0.8;

    return res.status(200).json({
      success: true,
      extracted: { ...extracted, flags },
      confidence,
    });
  } catch (e) {
    console.error('extract-receipt failure', e);
    const status = e.name === 'AbortError' ? 504 : 500;
    return res.status(status).json({ success: false, error: 'internal_error' });
  }
}
