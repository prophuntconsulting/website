/**
 * Build script: generates sitemap.xml from the current, real content —
 * static pages + every property in properties/posts.json + every post in
 * blog/posts.json. Run after build-properties.js and build-blog.js (both
 * of which regenerate their posts.json first) so the sitemap can never go
 * stale the way the old hand-maintained one did.
 */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const SITE = 'https://www.prophuntllp.com';
const ROOT = path.join(__dirname, '..');

function today() {
  return new Date().toISOString().slice(0, 10);
}

// <lastmod> should mean "this page's content changed", not "we rebuilt the
// site" — stamping every URL with the build date teaches Google to ignore
// lastmod entirely. Hash each URL's generated HTML and only advance the date
// when the hash changes; state lives in scripts/.lastmod.json (committed).
const LASTMOD_FILE = path.join(ROOT, 'scripts', '.lastmod.json');
let lastmodState = {};
try { lastmodState = JSON.parse(fs.readFileSync(LASTMOD_FILE, 'utf8')); } catch { /* first run */ }
const nextLastmodState = {};

function fileForUrl(loc) {
  const p = loc === '/' ? 'index' : loc.replace(/^\//, '');
  for (const cand of [`${p}.html`, `${p}/index.html`]) {
    const full = path.join(ROOT, cand);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function lastmodFor(loc) {
  const file = fileForUrl(loc);
  if (!file) return today();
  // Normalise line endings so a CRLF checkout hashes the same as LF.
  const hash = crypto.createHash('sha1').update(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).digest('hex');
  const prev = lastmodState[loc];
  const date = prev && prev.hash === hash ? prev.date : today();
  nextLastmodState[loc] = { hash, date };
  return date;
}

// Fixed, hand-curated pages that aren't generated from a posts.json.
const STATIC_PAGES = [
  { loc: '/',            changefreq: 'weekly',  priority: '1.0'  },
  { loc: '/projects',    changefreq: 'weekly',  priority: '0.9'  },
  { loc: '/services',    changefreq: 'monthly', priority: '0.85' },
  { loc: '/about',       changefreq: 'monthly', priority: '0.8'  },
  { loc: '/contact',     changefreq: 'monthly', priority: '0.8'  },
  { loc: '/blog',        changefreq: 'weekly',  priority: '0.75' },
  { loc: '/developers',  changefreq: 'monthly', priority: '0.7'  },
  { loc: '/rera-disclosure', changefreq: 'yearly', priority: '0.4' },
  { loc: '/privacy-policy',  changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms',           changefreq: 'yearly', priority: '0.3' },
];

function loadJson(relPath) {
  const p = path.join(ROOT, relPath);
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
}

const properties    = loadJson('properties/posts.json');
const posts         = loadJson('blog/posts.json');
const localityUrls  = loadJson('scripts/.locality-pages.json');
const locationHubUrls = loadJson('scripts/.location-hubs.json');
const categoryUrls = loadJson('scripts/.category-pages.json');
const developerHubUrls = loadJson('scripts/.developer-hubs.json');

const urls = [];

STATIC_PAGES.forEach(p => urls.push({ loc: `${SITE}${p.loc}`, lastmod: lastmodFor(p.loc), changefreq: p.changefreq, priority: p.priority }));

properties.forEach(p => {
  // Sold-out pages stay live (with links to similar projects) but aren't listed:
  // no inventory, and nothing links to them, so they'd be sitemap-only orphans.
  if (!p.url || p.status === 'sold-out') return;
  urls.push({
    loc: `${SITE}${p.url}`,
    lastmod: lastmodFor(p.url),
    changefreq: p.status === 'active' ? 'weekly' : 'monthly',
    priority: '0.85',
  });
});

posts.forEach(p => {
  if (!p.url) return;
  urls.push({
    loc: `${SITE}${p.url}`,
    lastmod: p.date || today(),
    changefreq: 'monthly',
    priority: '0.65',
  });
});

localityUrls.forEach(u => {
  urls.push({ loc: `${SITE}${u}`, lastmod: lastmodFor(u), changefreq: 'weekly', priority: '0.7' });
});

locationHubUrls.forEach(u => {
  // The /location index and each locality hub outrank the narrower
  // category pages above — they're the top-of-funnel entity page for
  // that micro-market.
  urls.push({ loc: `${SITE}${u}`, lastmod: lastmodFor(u), changefreq: 'weekly', priority: u === '/location' ? '0.8' : '0.75' });
});

developerHubUrls.forEach(u => {
  urls.push({ loc: `${SITE}${u}`, lastmod: lastmodFor(u), changefreq: 'weekly', priority: u === '/developer' ? '0.75' : '0.7' });
});

categoryUrls.forEach(u => {
  urls.push({ loc: `${SITE}${u}`, lastmod: lastmodFor(u), changefreq: 'weekly', priority: '0.78' });
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
fs.writeFileSync(LASTMOD_FILE, JSON.stringify(nextLastmodState, null, 1) + '\n');
console.log(`Built sitemap.xml — ${urls.length} URLs (${STATIC_PAGES.length} static, ${properties.length} projects, ${posts.length} blog posts, ${localityUrls.length} locality pages, ${locationHubUrls.length} location hubs, ${developerHubUrls.length} developer hubs, ${categoryUrls.length} category pages)`);
