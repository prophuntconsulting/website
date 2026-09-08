const fs   = require('fs');
const path = require('path');
const { getMicroMarket, LOCALITY_CONTENT } = require('./locality-content');

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

// One sentence, derived only from fields we actually have — never a guess.
function possessionSentence(p, title) {
  if (p.status === 'sold-out') return `${title} is sold out and has no live inventory.`;
  const tl = (p.tagline || '').toLowerCase();
  if (tl.includes('ready to move') || tl.includes('ready for possession') || tl.includes('oc received')) {
    return `${title} is ready to move in.`;
  }
  if (tl.includes('under construction')) return `${title} is currently under construction.`;
  if (p.status === 'coming-soon' || tl.includes('new launch') || tl.includes('coming soon')) {
    return `${title} is a new launch.`;
  }
  return '';
}

// Fact-dense, auto-generated from frontmatter — same formula for every
// property, present or future, so no listing ever ships without real SEO
// copy. Falls back to the hand-written overview when one exists, since
// that's usually better-written than the template for projects an editor
// took the time to describe.
function metaDescription(p) {
  const title = p.title || 'This project';
  const bits = [];
  bits.push(`${title}${p.location ? ` in ${p.location}` : ''}${p.developer ? ` by ${p.developer}` : ''} offers ${p.config || 'premium homes'}${p.category ? ` (${p.category})` : ''}.`);
  const status = possessionSentence(p, title);
  if (status) bits.push(status);
  bits.push('Explore amenities, pricing, floor plans and RERA details on PROPHUNT LLP.');
  const generated = bits.join(' ');
  return (p.overview ? p.overview.slice(0, 155).trim() : generated).slice(0, 300);
}

// Project-specific FAQ content, generated only from fields that are
// actually filled in — a property added tomorrow with the standard
// frontmatter gets the same quality of FAQ as one added today.
function generateProjectFAQs(p) {
  const title = p.title || 'This project';
  const faqs = [];

  if (p.rera) {
    faqs.push({
      q: `What is the RERA registration number of ${title}?`,
      a: `${title} is registered under MahaRERA with registration number ${p.rera}. You can verify this directly on the official MahaRERA website.`,
    });
  }

  if (p.config) {
    faqs.push({
      q: `What configurations are available at ${title}?`,
      a: `${title} offers ${p.config}${p.area ? `, with sizes ${p.area}` : ''}.`,
    });
  }

  faqs.push({
    q: `What is the price of homes at ${title}?`,
    a: p.price > 0
      ? `${title} is priced ${priceLabel(p)} onwards. Contact PROPHUNT LLP for the latest pricing and available payment plans.`
      : `Pricing for ${title} is available on request — contact PROPHUNT LLP's advisory team for the latest rates.`,
  });

  if (p.location) {
    faqs.push({
      q: `Where is ${title} located?`,
      a: `${title} is located at ${p.location}${p.developer ? `, developed by ${p.developer}` : ''}.`,
    });
  }

  if (p.developer) {
    faqs.push({
      q: `Who is the developer of ${title}?`,
      a: `${title} is developed by ${p.developer}.`,
    });
  }

  const status = possessionSentence(p, title);
  if (status) {
    faqs.push({ q: `Is ${title} ready to move in or under construction?`, a: status });
  }

  return faqs;
}

// Head tags: real title/description/canonical + OG/Twitter + JSON-LD
// (BreadcrumbList + RealEstateListing + FAQPage) so search engines and AI
// crawlers see genuine, page-specific signals without running JS. The
// FAQPage entity combines this project's own FAQs with the shared
// locality FAQs for its micro-market — the same content rendered visibly
// on the page by property.html.
function buildHeadBlock(p) {
  const title = `${p.title || 'Property'} | PROPHUNT LLP`;
  const desc  = metaDescription(p);
  const url   = `${SITE}${p.url}`;
  const image = absUrl(p.cover);
  const allFaqs = [...(p.project_faqs || []), ...(p.locality_faqs || [])];

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
      ...(allFaqs.length ? [{
        '@type': 'FAQPage',
        mainEntity: allFaqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }] : []),
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
    <div style="font-family:'Open Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--red);margin-bottom:8px">${escapeHtml(p.developer)}</div>
    <h1 style="font-family:'Open Sans',sans-serif;font-size:clamp(24px,4vw,34px);font-weight:700;line-height:1.2;color:var(--ink);margin-bottom:8px">${escapeHtml(p.title)}</h1>
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
  const merged = { slug, ...data, cover, url, body: body || '' };

  const micro_market = getMicroMarket(data.location);
  const locality = LOCALITY_CONTENT[micro_market] || null;

  return {
    ...merged,
    micro_market,
    locality_name: locality ? locality.name : '',
    project_faqs: generateProjectFAQs(merged),
    locality_faqs: locality ? locality.faqs : [],
    nearby_landmarks: locality ? locality.landmarks : {},
  };
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
