/**
 * IndexNow ping (run by .github/workflows/indexnow.yml after each push to main).
 *
 * Tells Bing (and the other IndexNow engines) which public pages changed in
 * the last commit, so they recrawl them within hours instead of days.
 * The key is served as /{KEY}.txt at the site root.
 *
 *   node scripts/indexnow-ping.js            -> submit pages changed in HEAD
 *   node scripts/indexnow-ping.js --all      -> submit every URL in sitemap.xml
 *   node scripts/indexnow-ping.js --dry-run  -> print, don't submit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOST = 'www.prophuntllp.com';
const KEY = '05129399901be3aa2d490e9b4c03f0ea';
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);

// Pages that are never meant for search (templates, thank-you pages, admin).
const SKIP = /^(admin|api|tools|scripts)\/|^(property|404|post|thank-you)\.html$|^thank-you|^blog\/post\.html$/;

function changedUrls() {
  let files = [];
  try { files = execSync('git diff --name-only HEAD~1 HEAD', { cwd: ROOT }).toString().split(/\r?\n/).filter(Boolean); }
  catch { return []; }
  const urls = new Set();
  for (const f of files) {
    if (!f.endsWith('.html') || SKIP.test(f)) continue;
    const p = f.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '');
    urls.add(`https://${HOST}/${p}`.replace(/\/$/, p ? '' : '/'));
  }
  return [...urls];
}

function sitemapUrls() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

const list = (args.includes('--all') ? sitemapUrls() : changedUrls()).slice(0, 10000);
if (!list.length) { console.log('IndexNow: no public page changes to submit'); process.exit(0); }
console.log(`IndexNow: ${list.length} URL(s)`);
list.slice(0, 25).forEach(u => console.log('  ' + u));
if (args.includes('--dry-run')) process.exit(0);

fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: list }),
}).then(async r => {
  console.log('IndexNow response:', r.status, await r.text());
  if (r.status >= 400) process.exit(1);
});
