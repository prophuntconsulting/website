/**
 * Run daily by .github/workflows/sanity-maintenance.yml.
 *
 *   node scripts/sanity-maintenance.js due          deploy if a scheduled blog post became due in the last 24h
 *   node scripts/sanity-maintenance.js backup DIR   (Sundays, or a manual run) export all published
 *                                                   content and the asset list to DIR as JSON
 *
 * Reads the public dataset, so no Sanity token is needed. The deploy hook URL
 * comes from the VERCEL_DEPLOY_HOOK secret.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ID = process.env.SANITY_PROJECT_ID || '9cgq9uxv';
const DATASET = process.env.SANITY_DATASET || 'production';
const API = `https://${PROJECT_ID}.api.sanity.io/v2025-02-19/data/query/${DATASET}`;
const [cmd, outDir] = process.argv.slice(2);

async function query(q, params = {}) {
  const qs = Object.entries(params).map(([k, v]) => `&$${k}=${encodeURIComponent(JSON.stringify(v))}`).join('');
  const res = await fetch(`${API}?query=${encodeURIComponent(q)}${qs}&perspective=published`);
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result;
}

async function due() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 3600e3);
  const posts = await query('*[_type == "blogPost" && publishedAt > $from && publishedAt <= $to]{title, publishedAt}', { from: dayAgo.toISOString(), to: now.toISOString() });
  if (!posts.length) { console.log('No scheduled posts became due.'); return; }
  console.log('Due:', posts.map(p => `${p.title} (${p.publishedAt})`).join('; '));
  if (!process.env.VERCEL_DEPLOY_HOOK) throw new Error('VERCEL_DEPLOY_HOOK secret is not set, so the due posts cannot go live');
  const res = await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
  console.log('Deploy hook:', res.status);
  if (!res.ok) process.exit(1);
}

async function backup() {
  if (process.env.GITHUB_EVENT_NAME === 'schedule' && new Date().getUTCDay() !== 0) { console.log('Backups run on Sundays.'); return; }
  const dir = path.resolve(outDir || 'sanity-backup');
  fs.mkdirSync(dir, { recursive: true });
  const docs = await query('*[_type in ["property", "blogPost"]]');
  const assets = await query('*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]{_id, url, originalFilename, source}');
  fs.writeFileSync(path.join(dir, 'documents.json'), JSON.stringify(docs, null, 1));
  fs.writeFileSync(path.join(dir, 'assets.json'), JSON.stringify(assets, null, 1));
  console.log(`Backed up ${docs.length} documents and ${assets.length} asset records.`);
}

(async () => {
  if (PROJECT_ID === 'REPLACE_ME') { console.log('Sanity project not configured yet.'); return; }
  if (cmd === 'due') await due();
  else if (cmd === 'backup') await backup();
  else throw new Error('Usage: sanity-maintenance.js due | backup DIR');
})().catch(err => { console.error(err.message || err); process.exit(1); });
