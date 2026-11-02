const crypto = require('crypto');
const { geo } = require('./geo');

// Bots have been filling every form here (3 Oct onwards: random-letter names,
// a different dotted Gmail address per burst, gibberish in every field). Real
// visitors never look like either of these, so such a submission is dropped:
// the visitor still sees "sent" and no lead is created.
//  - Gmail ignores dots, so spammers write one inbox as endless addresses
//    ("ki.c.imu.ze66.4@gmail.com"). The cut-off is four or more dots: three
//    would also drop real addresses like "r.k.sharma.pune@gmail.com".
//  - A single word of 12+ letters that flips lower to UPPER case four or more
//    times ("xHmDXxLAkxTFyGYRrjTala") is random text, not a name or a RERA number.
function looksLikeSpam({ email, name, custom_fields }) {
  const mail = String(email || '').trim().toLowerCase();
  const [local, domain] = mail.split('@');
  if ((domain === 'gmail.com' || domain === 'googlemail.com') && (local.match(/\./g) || []).length >= 4) return true;
  const random = (v) => String(v || '').split(/\s+/).some((w) => w.length >= 12 && (w.match(/[a-z][A-Z]/g) || []).length >= 4);
  return random(name) || (custom_fields || []).some((f) => random(f.value));
}

// Same phone rules as js/lead-check.js: an Indian mobile is 10 digits starting
// 6 to 9 (after an optional +91 / 91 / 0); anything else needs + and a country
// code (8 to 15 digits). One repeated digit, two alternating digits or a
// straight run (9876543210) is a made-up number.
const RUNS = '01234567890123456789 98765432109876543210';
const junkDigits = (d) => new Set(d).size <= 2 || RUNS.includes(d);
function validPhone(raw) {
  const s = String(raw || '').trim();
  let d = s.replace(/\D/g, '');
  const plus = /^\+/.test(s) || d.startsWith('00');
  if (d.startsWith('00')) d = d.slice(2);
  if (!plus || /^91\d{10}$/.test(d)) {
    if (plus || (d.length === 12 && d.startsWith('91'))) d = d.slice(2);
    else if (d.length === 11 && d[0] === '0') d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) && !junkDigits(d);
  }
  return /^[1-9]\d{7,14}$/.test(d) && new Set(d.slice(-8)).size > 2;
}

// Digits with the country code and no "+", as OpenAI's Conversions API hashes phones
// (an Indian 10-digit mobile becomes 91XXXXXXXXXX).
function phoneDigits(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 11 && d[0] === '0') d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) d = '91' + d;
  return d.replace(/^0+/, '');
}
const sha256 = (v) => crypto.createHash('sha256').update(v, 'utf8').digest('hex');

// Server copy of the lead for ChatGPT ads (OpenAI Conversions API). The browser sends
// `oaiq` only from pages that carry the OpenAI pixel; its event_id is the same one the
// thank-you page's pixel uses, so OpenAI counts the lead once. Skipped until
// OPENAI_ADS_CONVERSION_KEY and OPENAI_ADS_PIXEL_ID are set in Vercel.
async function sendOpenAILead(req, { phone, email, page_url, oaiq }, where) {
  const key = process.env.OPENAI_ADS_CONVERSION_KEY, pixel = process.env.OPENAI_ADS_PIXEL_ID;
  if (!oaiq || !oaiq.event_id || !key || !pixel) return;
  const user = { phone_numbers_sha256: [sha256(phoneDigits(phone))] };
  const mail = String(email || '').trim().toLowerCase();
  if (/^\S+@\S+\.\S+$/.test(mail)) user.emails_sha256 = [sha256(mail)];
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (ip) user.ip_address = ip;
  if (req.headers['user-agent']) user.user_agent = String(req.headers['user-agent']);
  if (where.city) user.cities = [where.city];
  if (where.region) user.regions = [where.region];
  if (where.postal) user.postal_codes = [where.postal];
  if (where.country) user.countries = [where.country];
  if (oaiq.obref) user.obref = String(oaiq.obref);
  const event = {
    id: String(oaiq.event_id).slice(0, 100),
    type: 'lead_created',
    timestamp_ms: Date.now(),
    action_source: 'web',
    source_url: page_url || '',
    data: { type: 'customer_action' },
    user,
  };
  if (oaiq.oppref) event.oppref = String(oaiq.oppref);
  try {
    const r = await fetch(`https://bzr.openai.com/v1/events?pid=${encodeURIComponent(pixel)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [event] }),
    });
    if (!r.ok) console.error('[lead] OpenAI conversion rejected:', r.status, (await r.text()).slice(0, 300));
  } catch (e) {
    console.error('[lead] OpenAI conversion request threw:', e.message);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { name, phone, email, message, form_name, page_url, oaiq } = req.body || {};
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
  // Approximate location from the visitor's IP (Vercel), as its own CRM fields.
  const where = geo(req);
  [['City', where.city], ['Region', where.region], ['PIN code', where.postal], ['Country', where.country]]
    .forEach(([label, value]) => { if (value) custom_fields.push({ fieldKey: label, label, value }); });

  // The CRM shows `message` as the lead's requirements, so send only the
  // visitor's own words, not the whole "Label: value" form dump.
  const visitorMessage = freeText.join(' ').trim();

  if (!validPhone(phone)) {
    console.warn('[lead] dropped, invalid phone:', String(phone).replace(/\d(?=\d{3})/g, '*'));
    return res.status(200).json({ ok: true });
  }

  if (looksLikeSpam({ email, name, custom_fields })) {
    console.warn('[lead] dropped as spam:', String(email || '').slice(0, 40));
    return res.status(200).json({ ok: true });
  }

  // CRM delivery is best-effort: the browser fires this request and moves on
  // (Web3Forms emails the same lead), so a failure never blocks the visitor.
  // Return a real error status though, so failures show up in Vercel's logs
  // and request metrics instead of hiding behind a 200.
  const openAILead = sendOpenAILead(req, { phone, email, page_url, oaiq }, where);

  if (!process.env.ARTHALEADS_TOKEN) {
    await openAILead;
    console.error('[lead] ARTHALEADS_TOKEN is not set in this environment');
    return res.status(500).json({ ok: false, error: 'CRM not configured' });
  }

  try {
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
      await openAILead;
      return res.status(502).json({ ok: false, error: 'CRM rejected the lead' });
    }
  } catch (e) {
    console.error('[lead] ArthaLeads request threw:', e.message);
    await openAILead;
    return res.status(502).json({ ok: false, error: 'CRM unreachable' });
  }

  // Vercel may stop the function once it responds, so finish the OpenAI copy first.
  await openAILead;
  res.status(200).json({ ok: true });
};
