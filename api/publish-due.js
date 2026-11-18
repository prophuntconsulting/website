// Publishes scheduled blog posts: Vercel Cron calls this at 10:00 IST (vercel.json
// "crons"). If a post's "Publish at" time has passed since the live site was built
// (build-info.json), it calls the deploy hook so the next build includes the post.
// Safe to call any number of times: once the post is live, builtAt is later than
// its time and nothing happens. Needs the VERCEL_DEPLOY_HOOK environment variable.
// The GitHub "Sanity maintenance" workflow does the same check as a backup.
const SITE = 'https://www.prophuntllp.com';
const API = 'https://9cgq9uxv.api.sanity.io/v2025-02-19/data/query/production';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    const now = new Date();
    let from = new Date(now.getTime() - 24 * 3600e3);
    try {
      const r = await fetch(`${SITE}/build-info.json?t=${now.getTime()}`, { cache: 'no-store' });
      if (r.ok) from = new Date((await r.json()).builtAt);
    } catch (e) { /* fall back to the last 24 hours */ }

    const q = '*[_type == "blogPost" && publishedAt > $from && publishedAt <= $to]{title, publishedAt}';
    const url = `${API}?query=${encodeURIComponent(q)}&$from=${encodeURIComponent(JSON.stringify(from.toISOString()))}` +
      `&$to=${encodeURIComponent(JSON.stringify(now.toISOString()))}&perspective=published`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Sanity query failed: ${r.status}`);
    const posts = (await r.json()).result || [];

    if (!posts.length) return res.status(200).json({ builtAt: from, due: [], deployed: false, hookSet: Boolean(process.env.VERCEL_DEPLOY_HOOK) });
    if (!process.env.VERCEL_DEPLOY_HOOK) throw new Error('VERCEL_DEPLOY_HOOK is not set');
    const hook = await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
    console.log('Due:', posts.map(p => p.title).join('; '), '- deploy hook', hook.status);
    res.status(hook.ok ? 200 : 502).json({ builtAt: from, due: posts.map(p => p.title), deployed: hook.ok });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
