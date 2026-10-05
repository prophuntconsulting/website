// Bots have been filling every form here (3 Oct onwards: random-letter names,
// a different dotted Gmail address per burst, gibberish in every field). Real
// visitors never look like either of these, so such a submission is dropped:
// the visitor still sees "sent" and no lead is created.
//  - Gmail ignores dots, so spammers write one inbox as endless addresses
//    ("ki.c.imu.ze66.4@gmail.com"); three or more dots is not how people type.
//  - A single word of 12+ letters that flips lower to UPPER case four or more
//    times ("xHmDXxLAkxTFyGYRrjTala") is random text, not a name or a RERA number.
function looksLikeSpam({ email, name, custom_fields }) {
  const mail = String(email || '').trim().toLowerCase();
  const [local, domain] = mail.split('@');
  if ((domain === 'gmail.com' || domain === 'googlemail.com') && (local.match(/\./g) || []).length >= 3) return true;
  const random = (v) => String(v || '').split(/\s+/).some((w) => w.length >= 12 && (w.match(/[a-z][A-Z]/g) || []).length >= 4);
  return random(name) || (custom_fields || []).some((f) => random(f.value));
}

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
  const freeText = []; // what the visitor typed in their own words
  for (const line of String(message || '').split('\n')) {
    const m = line.match(/^([A-Za-z][^:]{1,60}):\s*(.+)$/);
    if (!m) { if (line.trim() && !/^Please (contact me about|review and publish)/i.test(line.trim())) freeText.push(line.trim()); continue; }
    const label = m[1].trim();
    const value = m[2].trim();
    if (SKIP.test(label) || /^not (provided|specified)$/i.test(value)) continue;
    custom_fields.push({ fieldKey: label, label, value });
  }
  // The CRM shows `message` as the lead's requirements, so send only the
  // visitor's own words, not the whole "Label: value" form dump.
  const visitorMessage = freeText.join(' ').trim();

  if (looksLikeSpam({ email, name, custom_fields })) {
    console.warn('[lead] dropped as spam:', String(email || '').slice(0, 40));
    return res.status(200).json({ ok: true });
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
        name, phone, email, message: visitorMessage,
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
