/**
 * Build script: generates top-level project category pages:
 * /projects/apartments, /projects/villas, /projects/plots, /projects/commercial
 *
 * These pages give search engines canonical, crawlable category URLs instead
 * of relying on query-string filters such as /projects.html?type=commercial.
 */

const fs = require('fs');
const { FOOTER_HTML } = require('./site-footer');
// The same header as every other generated page (dropdown, hamburger), with Projects marked current.
const CATEGORY_NAV = require('./hub-shared').NAV_HTML.trim()
  .replace('<a href="/projects" class="nav-link">', '<a href="/projects" class="nav-link active" aria-current="page">');
const { INDEX_GUIDES, renderGuide } = require('./area-guides');
const path = require('path');

const SITE = 'https://www.prophuntllp.com';
const ROOT = path.join(__dirname, '..');

const CATEGORY_META = {
  apartment: {
    slug: 'apartments',
    label: 'Apartments',
    lower: 'apartments',
    singular: 'apartment',
    icon: 'building',
    intro: 'Compare curated apartment projects across Pune micro-markets including Baner, Wakad, Mahalunge, Pimpri-Chinchwad and Sinhagad Road.',
  },
  villa: {
    slug: 'villas',
    label: 'Villas',
    lower: 'villas',
    singular: 'villa',
    icon: 'home',
    intro: 'Explore limited villa and row-house opportunities listed by PROPHUNT LLP, with configuration, pricing and project context in one place.',
    // Searchers type "villa projects in pune" / "villas in pune" (Search Console, Keyword Planner Nov 2026).
    seoTitle: 'Villa Projects in Pune (2026): Villas & Row Houses',
    h1: 'Villa Projects in Pune: Villas, Row Houses and Townhouses',
    unitMatch: /villa|row ?house|townhouse|villament|bungalow/i,
    unitLabel: 'villa, row house and townhouse',
    links: [['/villas-in-ravet-gahunje', 'Villas in Ravet–Gahunje'], ['/location/hadapsar', 'Hadapsar area guide'], ['/blog/luxury-apartments-in-pune-complete-buyer-s-guide-2026', 'Luxury homes in Pune: buyer guide'], ['/blog/pune-ring-road', 'Pune Ring Road'], ['/stamp-duty-calculator-pune', 'Stamp duty calculator']],
  },
  plot: {
    slug: 'plots',
    label: 'Plots',
    lower: 'plots',
    singular: 'plot',
    icon: 'map',
    intro: 'Browse curated plotted development and weekend-home opportunities around Pune, Khopoli and Karjat with advisory support before booking.',
    // "plots in pune" gets 1K-10K searches a month (Keyword Planner, Nov 2026).
    seoTitle: 'Plots in Pune (2026): NA & RERA Plot Projects for Sale',
    h1: 'Plots for Sale in Pune: NA and RERA Plot Projects',
    unitMatch: /plot/i,
    unitLabel: 'plot',
    links: [['/plots-in-hadapsar', 'Plots in Hadapsar'], ['/plots-in-khopoli', 'Plots in Khopoli'], ['/blog/na-plots-near-pune-checklist', 'NA plots near Pune: checklist'], ['/blog/7-12-utara-online', '7/12 utara online'], ['/blog/pmrda-zone-certificate', 'PMRDA zone certificate'], ['/blog/purandar-airport', 'Purandar airport'], ['/blog/pune-ring-road', 'Pune Ring Road']],
  },
  commercial: {
    slug: 'commercial',
    label: 'Commercial Properties',
    lower: 'commercial properties',
    singular: 'commercial property',
    icon: 'briefcase',
    intro: 'Review commercial offices, showrooms and investment-ready business spaces across Wakad and Pune business corridors.',
  },
};

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function priceLabel(p) {
  if (p.price_label) return p.price_label;
  if (!p.price || p.price === 0) return 'Price on Request';
  if (p.price >= 100) return '₹' + (p.price / 100).toFixed(2).replace(/\.?0+$/, '') + ' Cr*';
  return '₹' + p.price + ' L*';
}

function fmtLakhCr(v) {
  return v >= 100 ? '₹' + (v / 100).toFixed(2).replace(/\.?0+$/, '') + ' Cr' : '₹' + v + ' L';
}

function priceRangeText(matches) {
  const priced = matches.filter(p => p.price > 0).map(p => p.price);
  if (!priced.length) return 'available on request';
  const min = Math.min(...priced);
  const max = Math.max(...priced);
  return min === max ? `around ${fmtLakhCr(min)}` : `from ${fmtLakhCr(min)} to ${fmtLakhCr(max)}`;
}

function developersText(matches) {
  const devs = [...new Set(matches.map(p => p.developer).filter(Boolean))];
  if (!devs.length) return 'leading developers';
  if (devs.length <= 3) return devs.join(', ');
  return devs.slice(0, 3).join(', ') + ' and more';
}

// Unit rows of one type across every listing, including villas or plots inside mixed
// projects (Kalpataru Aria's townhouses and serviced plots, for example).
function unitRowsFor(category, all) {
  const meta = CATEGORY_META[category];
  if (!meta.unitMatch) return [];
  const rows = [];
  for (const p of all) {
    const units = [1, 2, 3].map(i => ({ type: p['unit_' + i + '_type'], area: p['unit_' + i + '_area'], price: p['unit_' + i + '_price'] })).filter(u => u.type);
    const hits = units.filter(u => p.category === category || meta.unitMatch.test(u.type));
    if (hits.length) hits.forEach(u => rows.push({ p, ...u }));
    else if (p.category !== category && meta.unitMatch.test(p.config || '')) rows.push({ p, type: p.config, area: '', price: '' });
  }
  const lakh = t => { const m = String(t || '').match(/([\d.]+)\s*(Cr|L)/i); return m ? parseFloat(m[1]) * (/cr/i.test(m[2]) ? 100 : 1) : Infinity; };
  return rows.map(r => ({ ...r, price: r.price && !/request/i.test(r.price) ? String(r.price).replace(/\*+/g, '').trim() : 'On request', area: r.area || 'On request' }))
    .sort((a, b) => lakh(a.price) - lakh(b.price) || a.p.title.localeCompare(b.p.title));
}
const pageExists = url => fs.existsSync(path.join(ROOT, url.replace(/^\//, ''), 'index.html')) || fs.existsSync(path.join(ROOT, url.replace(/^\//, '') + '.html'));

function statusWeight(p) {
  if (p.status === 'coming-soon') return 0;
  const tl = (p.tagline || '').toLowerCase();
  if (tl.includes('ready') || tl.includes('oc received')) return 2;
  return 1;
}

function renderProjectCard(p) {
  const meta = CATEGORY_META[p.category] || CATEGORY_META.apartment;
  const statusBadge = p.status === 'sold-out'
    ? '<span class="badge badge-black" style="font-size:.68rem;padding:.2rem .55rem">Sold Out</span>'
    : '';
  const areaSpec = p.area ? `<span><i class="fas fa-ruler-combined"></i>${escapeHtml(p.area)}</span>` : '';
  return `
    <a href="${escapeHtml(p.url)}" class="prop-card">
      <div class="prop-card-img">
        <div>${p.cover ? `<img src="${escapeHtml(p.thumb || p.cover)}" alt="${escapeHtml(p.title || '')}" width="600" height="372" loading="lazy" decoding="async">` : `<span class="prop-card-img-empty"><i class="fas fa-${meta.icon}"></i></span>`}</div>
        <div class="prop-card-badge"><span class="badge badge-red">${escapeHtml(p.developer || '')}</span>${statusBadge}</div>
        <div class="prop-card-price">${escapeHtml(priceLabel(p))}</div>
      </div>
      <div class="prop-card-body">
        <div class="prop-card-dev">${escapeHtml(p.developer || '')}</div>
        <h3 class="prop-card-title">${escapeHtml(p.title || '')}</h3>
        <p class="prop-card-loc"><i class="fas fa-map-marker-alt"></i>${escapeHtml(p.location || '')}</p>
        <div class="prop-card-specs">
          <span><i class="fas fa-${meta.icon}"></i>${escapeHtml(p.config || '')}</span>
          ${areaSpec}
        </div>
        <div class="prop-card-footer">
          <span class="prop-card-status">View on PROPHUNT</span>
          <span class="prop-card-link">View Details <i class="fas fa-arrow-right"></i></span>
        </div>
      </div>
    </a>`;
}

function faqAccordion(faqs) {
  return faqs.map(f => `
    <details class="loc-faq-item">
      <summary>${escapeHtml(f.q)}</summary>
      <p>${escapeHtml(f.a)}</p>
    </details>`).join('');
}

function buildPage(category, matches, all) {
  const meta = CATEGORY_META[category];
  const sorted = [...matches].sort((a, b) => statusWeight(a) - statusWeight(b) || String(a.title).localeCompare(String(b.title)));
  const url = `/projects/${meta.slug}`;
  const canonical = `${SITE}${url}`;
  const unitRows = unitRowsFor(category, all || matches);
  const unitProjects = new Set(unitRows.map(r => r.p.slug)).size;
  const title = meta.seoTitle || `${meta.label} for Sale in Pune: ${sorted.length} Project${sorted.length === 1 ? "" : "s"} | PROPHUNT LLP`;
  const desc = meta.seoTitle
    ? `${meta.h1.split(':')[0]}: compare ${unitProjects} projects with ${meta.unitLabel} options, sizes, developer prices and MahaRERA numbers before you buy.`
    : `Browse ${sorted.length} curated ${meta.lower} in Pune from ${developersText(sorted)}. Prices ${priceRangeText(sorted)} with RERA-aware advisory from PROPHUNT LLP.`;
  const ogImage = sorted[0] && sorted[0].cover ? (sorted[0].cover.startsWith('http') ? sorted[0].cover : SITE + sorted[0].cover) : SITE + '/images/og-home.jpg';
  const faqs = [
    {
      q: `How many ${meta.lower} does PROPHUNT LLP list in Pune?`,
      a: `PROPHUNT LLP currently lists ${sorted.length} curated ${sorted.length === 1 ? meta.singular : meta.lower} in this category. Availability and pricing can change, so confirm the latest status before shortlisting.`,
    },
    {
      q: `What is the price range for ${meta.lower} in Pune?`,
      a: `${meta.label} listed here are priced ${priceRangeText(sorted)}. Final pricing, payment plans and offers should be confirmed with the developer and your PROPHUNT advisor.`,
    },
    {
      q: `Which developers are active in this category?`,
      a: `${meta.label} in this category include projects from ${developersText(sorted)}.`,
    },
    ...((INDEX_GUIDES[category] || {}).faqs || []),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE}/projects` },
          { '@type': 'ListItem', position: 3, name: meta.label, item: canonical },
        ],
      },
      {
        '@type': 'ItemList',
        name: title,
        description: desc,
        numberOfItems: sorted.length,
        itemListElement: sorted.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, item: `${SITE}${p.url}` })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YR6CRE6BNN');
  // gtag.js (~170KB) loads after the page has finished loading so it can't compete with
  // first paint; the calls above queue in dataLayer and are sent when it arrives.
  (function(){
    var load = function(){ var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=G-YR6CRE6BNN'; document.head.appendChild(s); };
    if (document.readyState === 'complete') setTimeout(load, 1500);
    else window.addEventListener('load', function(){ setTimeout(load, 1500); });
  })();
</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:site_name" content="PROPHUNT LLP">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
<meta name="theme-color" content="#C8362B">
<link rel="stylesheet" href="/css/vendor.css">
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/pages.css">
<style>
/* Comparison table: same look as the area and BHK pages (scripts/hub-shared.js). */
.ph-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--card-border);border-radius:var(--radius);background:#fff;margin-bottom:.75rem}
.ph-snapshot{width:100%;border-collapse:collapse;font-size:14px;background:#fff}
@media(max-width:600px){.ph-snapshot{min-width:560px}.ph-snapshot th,.ph-snapshot td{padding:10px 12px}}
.ph-snapshot th,.ph-snapshot td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--gray-200);vertical-align:top;line-height:1.5}
.ph-snapshot tr:last-child td{border-bottom:0}
.ph-snapshot thead th{background:var(--gray-100);color:var(--gray-600);font-size:12px;letter-spacing:.5px;text-transform:uppercase}
.ph-snapshot td a{color:var(--red);font-weight:600}
@media(max-width:768px){.ph-snapshot td a{display:inline-flex;align-items:center;min-height:44px}}
.loc-sibling-pills{display:flex;flex-wrap:wrap;gap:.6rem}
.loc-sibling-pill{display:inline-flex;align-items:center;min-height:44px;padding:.5rem 1.1rem;border:1.5px solid var(--gray-200);border-radius:999px;font-size:.82rem;font-weight:600;color:var(--gray-700);transition:border-color .2s,color .2s}
.loc-sibling-pill:hover{border-color:var(--red);color:var(--red)}
.cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
@media(max-width:1024px){.cat-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.cat-grid{grid-template-columns:1fr}}
.cat-intro{font-size:1.02rem;line-height:1.8;color:var(--gray-600);max-width:780px;margin-bottom:1rem}
.cat-note{font-size:.9rem;line-height:1.7;color:var(--gray-500);max-width:780px;margin-bottom:2.5rem}
.loc-faq-list{max-width:760px}
.loc-faq-item{border-bottom:1px solid var(--gray-200);padding:6px 0}
.loc-faq-item:last-child{border-bottom:none}
.loc-faq-item summary{display:block;padding:10px 0;min-height:44px;font-family:var(--font-head);font-size:14.5px;font-weight:700;color:var(--black);cursor:pointer;list-style:none}
.loc-faq-item summary::-webkit-details-marker{display:none}
.loc-faq-item summary::after{content:'+';float:right;color:var(--red);font-weight:700}
.loc-faq-item[open] summary::after{content:'-'}
.loc-faq-item p{margin:0 0 12px;font-size:13.5px;color:var(--gray-600);line-height:1.7}
</style>
</head>
<body>
${CATEGORY_NAV}

<section class="page-hero">
  <div class="container page-hero-inner">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><a href="/projects">Projects</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><span class="current">${escapeHtml(meta.label)}</span></nav>
    <span class="section-label"><i class="fas fa-${meta.icon}"></i> Project Category</span>
    <h1>${escapeHtml(meta.h1 || meta.label + ' in Pune')}</h1>
    <p>${sorted.length} curated ${sorted.length === 1 ? meta.singular : meta.lower} from ${escapeHtml(developersText(sorted))}. Prices ${escapeHtml(priceRangeText(sorted))}.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <p class="cat-intro">${escapeHtml(meta.intro)}</p>
    <p class="cat-note">Pricing, configuration, possession, offers and availability are subject to developer confirmation and buyer verification. Use these category pages as a shortlisting layer before comparing individual project pages.</p>
    <div class="cat-grid">${sorted.map(renderProjectCard).join('')}</div>
  </div>
</section>
${unitRows.length ? `
<section class="section section--tinted">
  <div class="container">
    <span class="section-label"><i class="fas fa-table"></i> Compare</span>
    <h2 class="section-title">${escapeHtml(meta.h1.split(':')[0])}: Sizes, Prices and MahaRERA</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    <p class="cat-intro">Every ${escapeHtml(meta.unitLabel)} option we list around Pune, including those inside larger projects, with the size and starting price the developer publishes.</p>
    <div class="ph-table-wrap"><table class="ph-snapshot"><thead><tr><th>Project</th><th>Location</th><th>Type</th><th>Size</th><th>Developer price</th><th>MahaRERA no.</th></tr></thead><tbody>${unitRows.map(r => `<tr><td><a href="${escapeHtml(r.p.url)}">${escapeHtml(r.p.title)}</a></td><td>${escapeHtml((r.p.location || '').replace(/, (Pune|Maharashtra)$/, ''))}</td><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.area)}</td><td>${escapeHtml(r.price)}</td><td>${escapeHtml(r.p.rera || 'Not listed')}</td></tr>`).join('')}</tbody></table></div>
    <p class="cat-note">Developer-published figures, excluding taxes and charges; "On request" means the developer shares the price only on enquiry. Confirm the current price sheet and MahaRERA details before booking.</p>
  </div>
</section>` : ''}
${(meta.links || []).filter(([u]) => pageExists(u)).length ? `
<section class="section">
  <div class="container">
    <span class="section-label"><i class="fas fa-link"></i> Related</span>
    <h2 class="section-title">Guides and Areas</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    <div class="loc-sibling-pills">${meta.links.filter(([u]) => pageExists(u)).map(([u, t]) => `<a class="loc-sibling-pill" href="${u}">${escapeHtml(t)}</a>`).join('')}</div>
  </div>
</section>` : ''}

<section class="section section--tinted">
  <div class="container">
    <span class="section-label"><i class="fas fa-circle-question"></i> FAQs</span>
    <h2 class="section-title">${escapeHtml(meta.label)} in Pune — Frequently Asked Questions</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    <div class="loc-faq-list">${faqAccordion(faqs)}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div style="background:var(--black);border-radius:8px;padding:2rem;color:#fff;text-align:center">
      <h3 style="color:#fff;font-family:var(--font-head);font-size:1.5rem;margin-bottom:.5rem">Need help comparing ${escapeHtml(meta.lower)}?</h3>
      <p style="color:rgba(255,255,255,.72);margin-bottom:1.25rem">Talk to a PROPHUNT advisor for pricing clarity, site-visit planning and shortlist support.</p>
      <a href="/contact" class="btn btn-primary">Talk to an Advisor</a>
    </div>
  </div>
</section>
${renderGuide(`Buying ${meta.lower} in Pune: what to know`, (INDEX_GUIDES[category] || {}).sections, 'Buyer guide')}

${FOOTER_HTML}
<button class="back-to-top" id="backToTop" aria-label="Back to top"><i class="fas fa-arrow-up"></i></button>
<a href="https://wa.me/917447430431" class="wa-float" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
<script src="/js/nav.js"></script>
</body>
</html>`;
}

const properties = JSON.parse(fs.readFileSync(path.join(ROOT, 'properties', 'posts.json'), 'utf8'));
const active = properties.filter(p => p.status !== 'sold-out');
const generatedUrls = [];

Object.entries(CATEGORY_META).forEach(([category, meta]) => {
  const matches = active.filter(p => p.category === category);
  if (!matches.length) return;
  const outDir = path.join(ROOT, 'projects', meta.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), buildPage(category, matches, active));
  generatedUrls.push(`/projects/${meta.slug}`);
  console.log(`  → projects/${meta.slug}/index.html (${matches.length} listing${matches.length === 1 ? '' : 's'})`);
});

fs.writeFileSync(path.join(ROOT, 'scripts', '.category-pages.json'), JSON.stringify(generatedUrls));
console.log(`Built ${generatedUrls.length} top-level category pages`);
