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

// New launches and under-construction projects rank above "ready to move" /
// established ones — mirrors js/projects.js's statusWeight() so the
// prerendered /projects grid (below) matches the order the client JS
// produces with default (no filter, no sort) settings.
function statusWeight(p) {
  if (p.status === 'coming-soon') return 0;
  const tl = (p.tagline || '').toLowerCase();
  if (tl.includes('ready') || tl.includes('oc received')) return 2;
  return 1;
}

// Mirrors js/projects.js's renderCard() exactly (same markup/classes, same
// lack of escaping — this data comes from our own frontmatter, not user
// input) so the server-rendered grid and the client-hydrated one are
// pixel-identical and there's no flash of different content on load.
function renderProjectCard(p) {
  const isExternal = /^https?:\/\//.test(p.url);
  const linkAttrs  = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
  const linkLabel  = isExternal ? 'View Project' : 'View Details';
  const icon       = p.category === 'plot' ? 'map' : p.category === 'villa' ? 'home' : p.category === 'commercial' ? 'briefcase' : 'building';
  const statusBadge = p.status === 'sold-out'
    ? '<span class="badge badge-gray" style="font-size:.68rem;padding:.2rem .55rem;background:#6b7280">Sold Out</span>'
    : '';
  const priceLbl = p.price_label || (p.price > 0 ? '₹' + p.price + ' L*' : 'Price on request');
  const areaSpec = p.area ? `<span><i class="fas fa-ruler-combined"></i>${p.area}</span>` : '';
  return `
        <a href="${p.url}" ${linkAttrs} class="prop-card" data-category="${p.category}" aria-label="${linkLabel}: ${p.title}">
          <div class="prop-card-img">
            <div style="background-image:url('${p.cover || ''}');">${p.cover ? '' : `<span class="prop-card-img-empty"><i class="fas fa-${icon}"></i></span>`}</div>
            <div class="prop-card-badge"><span class="badge badge-red">${p.developer}</span>${statusBadge}</div>
            <div class="prop-card-price">${priceLbl}</div>
          </div>
          <div class="prop-card-body">
            <div class="prop-card-dev">${p.developer}</div>
            <h3 class="prop-card-title">${p.title}</h3>
            <p class="prop-card-loc"><i class="fas fa-map-marker-alt"></i>${p.location}</p>
            <div class="prop-card-specs">
              <span><i class="fas fa-${icon}"></i>${p.config}</span>
              ${areaSpec}
            </div>
            <div class="prop-card-footer">
              <span class="prop-card-status">${isExternal ? 'Official project page' : 'View on PROPHUNT'}</span>
              <span class="prop-card-link">${linkLabel} <i class="fas fa-arrow-right"></i></span>
            </div>
          </div>
        </a>`;
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
function clampAtWord(s, max) {
  s = s.trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:–-]+$/, '') + '…';
}

function metaDescription(p) {
  const title = p.title || 'This project';
  const bits = [];
  bits.push(`${title}${p.location ? ` in ${p.location}` : ''}${p.developer ? ` by ${p.developer}` : ''} offers ${p.config || 'premium homes'}${p.category ? ` (${p.category})` : ''}.`);
  const status = possessionSentence(p, title);
  if (status) bits.push(status);
  bits.push('Explore amenities, pricing, floor plans and RERA details on PROPHUNT LLP.');
  const generated = bits.join(' ');
  // Prefer the editor's overview when present, but never cut it mid-word.
  return clampAtWord(p.overview ? p.overview : generated, 160);
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

// properties/posts.json is fetched by every page that needs the property
// list — the projects listing page and the homepage's featured grid
// included, neither of which uses project_faqs/locality_faqs/
// nearby_landmarks. Shipping those to every visitor of those pages more
// than doubled the payload (104KB -> 235KB) for content only the
// individual property detail page (property.html) actually renders.
// Keep this file lean; the FAQ/landmark content ships separately below.
const leanProperties = properties.map(({ project_faqs, locality_faqs, nearby_landmarks, ...rest }) => rest);
fs.writeFileSync(outFile, JSON.stringify(leanProperties, null, 2));
console.log(`Built properties/posts.json — ${properties.length} properties`);

// Separate, de-duplicated SEO content for property.html only: locality
// FAQs/landmarks are identical for every property in the same
// micro-market, so they're shipped once per locality (9 entries) instead
// of once per property (44 duplicated copies) — the bulk of the savings
// above. Project FAQs are genuinely per-project and stay keyed by slug.
const seoContent = {
  locality: LOCALITY_CONTENT,
  projects: Object.fromEntries(properties.map(p => [p.slug, p.project_faqs])),
};
fs.writeFileSync(path.join(__dirname, '..', 'properties', 'seo-content.json'), JSON.stringify(seoContent, null, 2));
console.log(`Built properties/seo-content.json — ${Object.keys(seoContent.locality).length} localities, ${properties.length} project FAQ sets`);

// Generate a static detail page for each property at projects/{slug}/index.html
const templatePath = path.join(__dirname, '..', 'property.html');
if (fs.existsSync(templatePath)) {
  // Normalise to LF. The HEAD_MARKER / LOADING_MARKER template literals below are
  // LF at runtime (the JS spec normalises CRLF in template literals to \n), but
  // property.html is checked out with CRLF endings on Windows — so the raw
  // fs.readFileSync text would never match the markers and every .replace() here
  // silently no-op'd, shipping every project page with a generic <title>, no
  // canonical, no OG tags, no JSON-LD and no prerender block.
  const template = fs.readFileSync(templatePath, 'utf8').replace(/\r\n/g, '\n');

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

// Prerender the /projects listing grid itself. Previously #projectsGrid was
// an empty <div> filled only by js/projects.js after a fetch — a crawler
// (or anything reading the raw HTML) saw zero project links on the page
// that's supposed to be the hub for all of them. js/projects.js's
// applyFilters() still overwrites this on load with the exact same markup
// (default filters = no filter), so real visitors see no visual change.
const projectsPagePath = path.join(__dirname, '..', 'projects.html');
if (fs.existsSync(projectsPagePath)) {
  const listed = properties.filter(p => p.status !== 'sold-out');
  const sorted = [...listed].sort((a, b) => statusWeight(a) - statusWeight(b));
  const cardsHtml = sorted.map(renderProjectCard).join('');

  let html = fs.readFileSync(projectsPagePath, 'utf8').replace(/\r\n/g, '\n');

  const GRID_MARKER = `<div class="proj-grid" id="projectsGrid" data-reveal></div>`;
  html = html.replace(GRID_MARKER, `<div class="proj-grid" id="projectsGrid" data-reveal>${cardsHtml}</div>`);

  html = html.replace(
    `<strong id="projectCount">0</strong>`,
    `<strong id="projectCount">${sorted.length}</strong>`
  );

  // Replace the stale hand-written ItemList (10 hardcoded slugs, some no
  // longer representative) with the real, complete list so the structured
  // data matches what's actually on the page.
  const listingJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE}/projects` },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Premium Real Estate Projects in Pune',
        description: "RERA-verified residential projects in Pune by India's top developers",
        numberOfItems: sorted.length,
        itemListElement: sorted.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, item: `${SITE}${p.url}` })),
      },
    ],
  };
  html = html.replace(/<script type="application\/ld\+json">\n\{[\s\S]*?\n\}\n<\/script>/, `<script type="application/ld+json">\n${JSON.stringify(listingJsonLd, null, 2)}\n</script>`);

  fs.writeFileSync(projectsPagePath, html);
  console.log(`Prerendered projects.html — ${sorted.length} project cards`);
}

module.exports = { properties };
