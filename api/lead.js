module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { name, phone, email, message, form_name, page_url } = req.body || {};
  if (!String(name || '').trim() || !String(phone || '').trim()) {
    return res.status(400).json({ ok: false, error: 'name and phone are required' });
  }

  try {
    await fetch('https://api.arthaleads.com/webhook/website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: process.env.ARTHALEADS_TOKEN,
        name, phone, email, message,
        form_plugin: 'custom_site',
        form_name: form_name || 'Website',
        page_url: page_url || '',
        website_url: 'https://www.prophuntllp.com',
      }),
    });
  } catch (e) {
    // CRM delivery is best-effort — a failure here must never block the visitor's enquiry.
  }

  res.status(200).json({ ok: true });
};
