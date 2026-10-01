module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { name, phone, email, message, form_name, page_url } = req.body || {};
  if (!String(name || '').trim() || !String(phone || '').trim()) {
    return res.status(400).json({ ok: false, error: 'name and phone are required' });
  }

  // Every form here sends its answers as "Label: value" lines in `message`.
  // Split them into separate fields so the CRM can fill Budget, Configuration,
  // Preferred location, Timeline etc. instead of leaving them in the notes.
  const SKIP = /^(name|phone|phone \/ whatsapp|email|message)$/i;
  const custom_fields = [];
  for (const line of String(message || '').split('\n')) {
    const m = line.match(/^([A-Za-z][^:]{1,60}):\s*(.+)$/);
    if (!m) continue;
    const label = m[1].trim();
    const value = m[2].trim();
    if (SKIP.test(label) || /^not (provided|specified)$/i.test(value)) continue;
    custom_fields.push({ fieldKey: label, label, value });
  }

  try {
    if (!process.env.ARTHALEADS_TOKEN) {
      console.error('[lead] ARTHALEADS_TOKEN is not set in this environment');
    }
    const crmRes = await fetch('https://api.arthaleads.com/webhook/website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: process.env.ARTHALEADS_TOKEN,
        name, phone, email, message,
        form_plugin: 'custom_site',
        form_name: form_name || 'Website',
        page_url: page_url || '',
        // Do NOT send website_url: the CRM treats it as a bot trap and silently
        // drops the lead (returns 200 but creates nothing).
        source_name: 'PropHunt LLP Website',
        custom_fields,
      }),
    });
    if (!crmRes.ok) {
      console.error('[lead] ArthaLeads rejected the lead:', crmRes.status, await crmRes.text());
    }
  } catch (e) {
    // CRM delivery is best-effort — a failure here must never block the visitor's enquiry.
    console.error('[lead] ArthaLeads request threw:', e.message);
  }

  res.status(200).json({ ok: true });
};
