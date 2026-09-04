const fs   = require('fs');
const path = require('path');

const SITE = 'https://www.prophuntllp.com';

const postsDir = path.join(__dirname, '..', 'properties', 'posts');
const outFile  = path.join(__dirname, '..', 'properties', 'posts.json');

function parseYaml(yaml) {
  const lines = yaml.split('\n');
  const data  = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { i++; continue; }
    const key  = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();
    if (rest === '') {
      const items = [];
      i++;
      while (i < lines.length && /^\s+- /.test(lines[i])) {
        items.push(lines[i].trim().slice(2).trim().replace(/^["']|["']$/g, ''));
        i++;
      }
      if (items.length) data[key] = items;
    } else {
      let val = rest.replace(/^["']|["']$/g, '');
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(val) && val !== '') val = Number(val);
      data[key] = val;
      i++;
    }
  }
  return data;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: content.trim() };
  return { data: parseYaml(match[1]), body: content.slice(match[0].length).trim() };
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function priceLabel(p) {
  if (p.price_label) return p.price_label;
  if (!p.price || p.price === 0) return 'Price on Request';
  if (p.price >= 100) {
    const cr = (p.price / 100).toFixed(2).replace(/\.?0+$/, '');
    return '₹' + cr + ' Cr*';
  }
  return '₹' + p.price + ' L*';
}

function absUrl(src) {
  if (!src) return `${SITE}/images/og-home.jpg`;
  return src.startsWith('http') ? src : `${SITE}${src}`;
}

// Same truncation rule the client JS uses for the meta description
function metaDescription(p) {
  if (p.overview) return p.overview.slice(0, 155).trim();
  return `${p.developer || ''} – ${p.config || ''} in ${p.location || ''}`.trim();
}

// Head tags: real title/description/canonical + OG/Twitter + JSON-LD (BreadcrumbList + RealEstateListing)
// so search engines and AI crawlers see genuine, page-specific signals without running JS.
function buildHeadBlock(p) {
  const title = `${p.title || 'Property'} | PROPHUNT LLP`;
  const desc  = metaDescription(p);
  const url   = `${SITE}${p.url}`;
  const image = absUrl(p.cover);
  const price = priceLabel(p);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE}/projects` },
          { '@type': 'ListItem', position: 3, name: p.title || p.slug, item: url },
        ],
      },
      {
        '@type': 'RealEstateListing',
        name: p.title || '',
        description: desc,
        url,
        image,
        ...(p.developer ? { provider: { '@type': 'Organization', name: p.developer } } : {}),
        ...(p.location ? { address: { '@type': 'PostalAddress', addressLocality: p.location, addressRegion: 'Maharashtra', addressCountry: 'IN' } } : {}),
        ...(p.price ? { offers: { '@type': 'Offer', price: p.price * 100000, priceCurrency: 'INR', url, availability: p.status === 'sold-out' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' } } : {}),
      },
    ],
  };

  return `<title id="ph-title">${escapeHtml(title)}</title>
<meta id="ph-desc" name="description" content="${escapeHtml(desc)}">
<link rel="canonical" id="ph-canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${image}">
<meta property="og:site_name" content="PROPHUNT LLP">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

// Lightweight server-rendered summary shown before the client JS hydrates the full
// page — gives non-JS crawlers (and the first pass of any crawler) real indexable
// text instead of a bare loading spinner. The client JS replaces #ph-page's
// innerHTML anyway, so this has no visual cost for real visitors.
function buildPrerenderBlock(p) {
  const price = priceLabel(p);
  const metaLine = [p.location, p.config, price !== 'Price on Request' ? `Starting from ${price}` : '']
    .filter(Boolean).join(' · ');

  return `<div class="ph-prerender" style="max-width:900px;margin:0 auto;padding:32px 24px 24px">
    <div style="font-family:'Poppins',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--red);margin-bottom:8px">${escapeHtml(p.developer)}</div>
    <h1 style="font-family:'Poppins',sans-serif;font-size:clamp(24px,4vw,34px);font-weight:700;line-height:1.2;color:var(--ink);margin-bottom:8px">${escapeHtml(p.title)}</h1>
    <p style="color:var(--gray-600);font-size:14px;margin-bottom:16px">${escapeHtml(metaLine)}</p>
    ${p.overview ? `<p style="color:var(--gray-600);line-height:1.8;font-size:14.5px;margin-bottom:20px">${escapeHtml(p.overview)}</p>` : ''}
    <div class="ph-loading-spinner"></div>
  </div>`;
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md')).sort();

const properties = files.map(file => {
  const slug = file.replace(/\.md$/, '');
  const raw  = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const url   = data.url || `/projects/${slug}`;
  const cover = data.cover || data.hero_1 || '';
  return { slug, ...data, cover, url, body: body || '' };
});

fs.writeFileSync(outFile, JSON.stringify(properties, null, 2));
console.log(`Built properties/posts.json — ${properties.length} properties`);

// Generate a static detail page for each property at projects/{slug}/index.html
const templatePath = path.join(__dirname, '..', 'property.html');
if (fs.existsSync(templatePath)) {
  const template = fs.readFileSync(templatePath, 'utf8');

  const HEAD_MARKER = `<title id="ph-title">Property | PROPHUNT LLP</title>
<meta id="ph-desc" name="description" content="Premium property listed by PROPHUNT LLP, Pune.">
<link rel="canonical" id="ph-canonical" href="https://www.prophuntllp.com/projects/">`;

  const LOADING_MARKER = `<div class="ph-loading">
    <div class="ph-loading-spinner"></div>
    <p>Loading property details…</p>
  </div>`;

  properties.forEach(p => {
    const outDir = path.join(__dirname, '..', 'projects', p.slug);
    fs.mkdirSync(outDir, { recursive: true });

    let html = template.replace(
      "const slug = window.location.pathname.split('/').filter(Boolean).pop() || '';",
      `const slug = '${p.slug}';`
    );
    html = html.replace(HEAD_MARKER, buildHeadBlock(p));
    html = html.replace(LOADING_MARKER, buildPrerenderBlock(p));

    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`  → projects/${p.slug}/index.html`);
  });
}

module.exports = { properties };
