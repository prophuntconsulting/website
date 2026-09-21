/**
 * Build script: generates one "location hub" page per micro-market —
 * /location/baner, /location/wakad, etc. — plus a /location index linking
 * to all of them.
 *
 * Distinct from scripts/build-locality-pages.js's "[Category] in
 * [Locality]" pages (apartments-in-wakad, plots-in-khopoli): those are
 * narrow, category-specific bottom-funnel pages. A hub page is the broad,
 * top-of-funnel entity page for the locality itself — every category,
 * every project, plus the buyer-facing context (connectivity, demand,
 * FAQs) a bottom-funnel category page has no room for. They interlink:
 * each category page links up to its hub, each hub links down to the
 * category pages that exist for it.
 *
 * Only generated for the 9 micro-markets in locality-content.js — every
 * one of them has real, live inventory (checked against properties/
 * posts.json below). Building a hub for a locality with zero listings
 * would be exactly the thin/fabricated content the audit warns against.
 */


const fs   = require('fs');
const path = require('path');
const { LOCALITY_CONTENT } = require('./locality-content');
const {
  SITE, CATEGORY_META, escapeHtml, fmtLakhCr, priceRangeText, developersText, lifecycle,
  renderHubCard, faqAccordion, headBoilerplate, FOOTER_HTML,
} = require('./hub-shared');

const ROOT = path.join(__dirname, '..');

// Blog posts that actually mention this locality (title, excerpt or tags) —
// linked from the hub so articles and hubs reinforce each other.
let BLOG_POSTS = [];
try { BLOG_POSTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'blog', 'posts.json'), 'utf8')); } catch { /* no blog index yet */ }
function relatedPosts(locality) {
  const needle = new RegExp('\\b' + locality.name.replace(/[^a-z0-9 ]/gi, '') + '\\b', 'i');
  return BLOG_POSTS.filter(p => needle.test([p.title, p.excerpt, (p.tags || []).join(' ')].join(' ')));
}

function extractBHK(cfg) {
  if (!cfg) return [];
  return (cfg.match(/[\d.]+/g) || []).map(Number);
}

// A one-paragraph, data-derived "who buys here" summary — dominant
// category + configuration + real price range, nothing an independent
// market report would be needed to back up.
function buyerProfileParagraph(locality, matches) {
  const catCounts = {};
  matches.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
  const catMeta = CATEGORY_META[topCat ? topCat[0] : 'apartment'] || CATEGORY_META.apartment;

  const bhkCounts = {};
  matches.forEach(p => extractBHK(p.config).forEach(b => { bhkCounts[b] = (bhkCounts[b] || 0) + 1; }));
  const topBhk = Object.entries(bhkCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([b]) => Number(b)).sort((a, b) => a - b);
  const cfgText = topBhk.length ? `${topBhk.join(' & ')} BHK ` : '';

  const n = matches.length;
  return `PROPHUNT LLP currently tracks ${n} live project${n === 1 ? '' : 's'} in ${locality.name}, with demand concentrated in ${cfgText}${catMeta.lower} priced ${priceRangeText(matches)}. Buyers here range from end-users upgrading within Pune to investors evaluating ${locality.name} for its connectivity and ongoing developer activity.`;
}

function categoryBreakdown(bucket, matches) {
  const counts = {};
  matches.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  return Object.keys(CATEGORY_META)
    .filter(cat => counts[cat] > 0)
    .map(cat => ({ meta: CATEGORY_META[cat], count: counts[cat], url: `/${CATEGORY_META[cat].slug}-in-${bucket}` }));
}

function buildHubPage({ bucket, locality, matches, todayLabel }) {
  const title = `Properties in ${locality.name}, Pune | PROPHUNT LLP`;
  const canonical = `${SITE}/location/${bucket}`;
  const desc = `${matches.length} curated projects in ${locality.name}, Pune from ${developersText(matches)}. Prices ${priceRangeText(matches)}. Curated listings with MahaRERA details, by PROPHUNT LLP.`;
  const aboutBlurb = locality.faqs && locality.faqs[0] ? locality.faqs[0].a : '';
  const cats = categoryBreakdown(bucket, matches);
  const sorted = [...matches].sort((a, b) => lifecycle(a).weight - lifecycle(b).weight);
  const siblings = Object.keys(LOCALITY_CONTENT).filter(b => b !== bucket);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Locations', item: `${SITE}/location` },
          { '@type': 'ListItem', position: 3, name: locality.name, item: canonical },
        ],
      },
      {
        '@type': 'ItemList',
        name: title,
        description: desc,
        numberOfItems: sorted.length,
        itemListElement: sorted.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, item: `${SITE}${p.url}` })),
      },
      ...(locality.faqs && locality.faqs.length ? [{
        '@type': 'FAQPage',
        mainEntity: locality.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }] : []),
    ],
  };

  const ogImage = matches[0] && matches[0].cover
    ? (matches[0].cover.startsWith('http') ? matches[0].cover : SITE + matches[0].cover)
    : SITE + '/images/og-home.jpg';

  return headBoilerplate({ title, desc, canonical, jsonLd, ogImage }) + `
<section class="page-hero">
  <div class="container page-hero-inner">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><a href="/location">Locations</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><span class="current">${escapeHtml(locality.name)}</span></nav>
    <span class="section-label"><i class="fas fa-location-dot"></i> Location Guide</span>
    <h1>Properties in ${escapeHtml(locality.name)}, Pune</h1>
    <p>${matches.length} curated projects from ${escapeHtml(developersText(matches))}. Prices ${escapeHtml(priceRangeText(matches))}.</p>
    <div class="page-hero-meta">
      <div class="page-hero-meta-item"><i class="fas fa-check-circle"></i> MahaRERA details listed</div>
      <div class="page-hero-meta-item"><i class="fas fa-building"></i> ${matches.length} Listed</div>
      <div class="page-hero-meta-item"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(locality.name)}, Pune</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    ${aboutBlurb ? `<p class="loc-about">${escapeHtml(aboutBlurb)}</p>` : ''}
    <p class="loc-about">${escapeHtml(buyerProfileParagraph(locality, matches))}</p>
    <p class="loc-note">Prices and availability reflect live PROPHUNT LLP listings as of ${escapeHtml(todayLabel)} and are subject to change — always confirm current pricing and inventory with our advisory team or the developer directly.</p>

    ${cats.length ? `<div class="loc-cat-pills">${cats.map(c => `<a href="${c.url}" class="loc-cat-pill"><i class="fas fa-${c.meta.icon}"></i> ${c.count} ${escapeHtml(c.count === 1 ? c.meta.label.replace(/s$/, '') : c.meta.label)}</a>`).join('')}</div>` : ''}

    <div class="loc-grid">${sorted.map(renderHubCard).join('')}</div>
  </div>
</section>

${locality.landmarks && Object.keys(locality.landmarks).length ? `
<section class="section section--tinted">
  <div class="container">
    <span class="section-label"><i class="fas fa-map-signs"></i> Connectivity</span>
    <h2 class="section-title">Explore Around ${escapeHtml(locality.name)}</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    ${Object.entries(locality.landmarks).map(([cat, items]) => items && items.length ? `
      <div style="margin-bottom:1.25rem">
        <div class="loc-landmark-cat-title">${escapeHtml(cat.charAt(0).toUpperCase() + cat.slice(1))}</div>
        <div class="loc-landmarks-chips">${items.map(l => `<span class="loc-landmark-chip">${escapeHtml(l)}</span>`).join('')}</div>
      </div>` : '').join('')}
  </div>
</section>` : ''}

<section class="section">
  <div class="container">
    <span class="section-label"><i class="fas fa-circle-question"></i> FAQs</span>
    <h2 class="section-title">${escapeHtml(locality.name)} — Frequently Asked Questions</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    <div class="loc-faq-list">${faqAccordion(locality.faqs || [])}</div>
  </div>
</section>

${relatedPosts(locality).length ? `
<section class="section">
  <div class="container">
    <span class="section-label"><i class="fas fa-book-open"></i> Related Reading</span>
    <h2 class="section-title">Guides Mentioning ${escapeHtml(locality.name)}</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    <ul class="loc-guide-list">${relatedPosts(locality).map(p => `<li><a href="${escapeHtml(p.url)}">${escapeHtml(p.title)}</a></li>`).join('')}</ul>
  </div>
</section>` : ''}

<section class="section">
  <div class="container">
    <span class="section-label"><i class="fas fa-map"></i> Compare Locations</span>
    <h2 class="section-title">Other Pune Micro-Markets</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    <div class="loc-sibling-pills">${siblings.map(b => `<a href="/location/${b}" class="loc-sibling-pill">${escapeHtml(LOCALITY_CONTENT[b].name)}</a>`).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="loc-cta">
      <h3>Looking for a property in ${escapeHtml(locality.name)}?</h3>
      <p>Talk to a PROPHUNT advisor — free consultation, no pressure, just clarity on pricing &amp; the best projects.</p>
      <a href="/contact" class="btn btn-primary">Book a Free Consultation</a>
    </div>
  </div>
</section>
` + FOOTER_HTML;
}

function buildIndexPage(buckets) {
  const title = 'Properties by Location in Pune | PROPHUNT LLP';
  const canonical = `${SITE}/location`;
  const desc = `Browse PROPHUNT LLP's curated real estate listings across ${buckets.length} Pune micro-markets — Baner, Wakad, Mahalunge and more — with local FAQs, connectivity and pricing.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Locations', item: canonical },
        ],
      },
      {
        '@type': 'ItemList',
        name: title,
        numberOfItems: buckets.length,
        itemListElement: buckets.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.locality.name, item: `${SITE}/location/${b.bucket}` })),
      },
    ],
  };

  return headBoilerplate({ title, desc, canonical, jsonLd, ogImage: SITE + '/images/og-home.jpg' }) + `
<section class="page-hero">
  <div class="container page-hero-inner">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><span class="current">Locations</span></nav>
    <span class="section-label"><i class="fas fa-location-dot"></i> Pune Micro-Markets</span>
    <h1>Explore Properties by Location in Pune</h1>
    <p>Verified projects, local FAQs and connectivity for every Pune micro-market PROPHUNT LLP actively covers.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="loc-hub-grid">
      ${buckets.map(({ bucket, locality, matches }) => `
      <a href="/location/${bucket}" class="loc-hub-card">
        <h3>${escapeHtml(locality.name)}</h3>
        <p>${matches.length} curated project${matches.length === 1 ? '' : 's'} · Prices ${escapeHtml(priceRangeText(matches))}</p>
      </a>`).join('')}
    </div>
  </div>
</section>
` + FOOTER_HTML;
}

const properties = JSON.parse(fs.readFileSync(path.join(ROOT, 'properties', 'posts.json'), 'utf8'));
const active = properties.filter(p => p.status !== 'sold-out');
const todayLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const buckets = Object.keys(LOCALITY_CONTENT)
  .map(bucket => ({ bucket, locality: LOCALITY_CONTENT[bucket], matches: active.filter(p => p.micro_market === bucket) }))
  .filter(b => b.matches.length > 0);

const generatedUrls = [];

buckets.forEach(({ bucket, locality, matches }) => {
  const html = buildHubPage({ bucket, locality, matches, todayLabel });
  const outDir = path.join(ROOT, 'location', bucket);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  generatedUrls.push(`/location/${bucket}`);
  console.log(`  → location/${bucket}/index.html (${matches.length} listing${matches.length === 1 ? '' : 's'})`);
});

const indexOutDir = path.join(ROOT, 'location');
fs.mkdirSync(indexOutDir, { recursive: true });
fs.writeFileSync(path.join(indexOutDir, 'index.html'), buildIndexPage(buckets));
generatedUrls.push('/location');
console.log(`  → location/index.html (${buckets.length} locations)`);

fs.writeFileSync(path.join(ROOT, 'scripts', '.location-hubs.json'), JSON.stringify(generatedUrls));
console.log(`Built ${generatedUrls.length} location hub pages`);

module.exports = { generatedUrls };
