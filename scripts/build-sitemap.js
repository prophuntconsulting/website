/**
 * Build script: generates sitemap.xml from the current, real content —
 * static pages + every property in properties/posts.json + every post in
 * blog/posts.json. Run after build-properties.js and build-blog.js (both
 * of which regenerate their posts.json first) so the sitemap can never go
 * stale the way the old hand-maintained one did.
 */

const fs   = require('fs');
const path = require('path');

const SITE = 'https://www.prophuntllp.com';
const ROOT = path.join(__dirname, '..');

function today() {
  return new Date().toISOString().slice(0, 10);
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

const properties = loadJson('properties/posts.json');
const posts      = loadJson('blog/posts.json');

const urls = [];

STATIC_PAGES.forEach(p => urls.push({ loc: `${SITE}${p.loc}`, changefreq: p.changefreq, priority: p.priority }));

properties.forEach(p => {
  if (!p.url) return;
  urls.push({
    loc: `${SITE}${p.url}`,
    lastmod: today(),
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
console.log(`Built sitemap.xml — ${urls.length} URLs (${STATIC_PAGES.length} static, ${properties.length} projects, ${posts.length} blog posts)`);
