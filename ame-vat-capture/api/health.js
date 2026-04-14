export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'ame-vat-capture',
    phase: 1,
    timestamp: new Date().toISOString()
  });
}
