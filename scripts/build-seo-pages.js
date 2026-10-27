/**
 * Build script: search-intent landing pages + per-project "Related searches"
 * and "What's nearby" data. Runs after build-properties.js and the hub
 * builders (it links to their pages), before build-sitemap.js.
 *
 * Pages generated — each only where our own data has something real to say
 * (no empty "0 results" pages, no rent pages — we have no rental inventory):
 *
 *   /projects/{slug}/{n}-bhk     "Mahindra Citadel 2 BHK price & size" — only
 *                                for projects with 2+ BHK types AND a unit row
 *                                specific to that BHK (its own size/price).
 *   /{n}-bhk-flats-in-{locality} "2 BHK flats in Wakad" — only where 2+ live
 *                                projects in that micro-market offer that BHK.
 *   /flats-near-{landmark}       "Flats near Hinjewadi Phase 1" — residential
 *   /plots-near-{landmark}       projects within NEAR_KM straight-line of a
 *   /office-space-near-{landmark} landmark, only from projects whose map
 *                                location is project- or street-level (never a
 *                                locality centroid), and only with 2+ matches.
 *
 * It also writes properties/seo-content.json `related` and `nearby` keys and
 * fills the <!--SEO-RELATED--> / <!--SEO-NEARBY--> placeholders that
 * build-properties.js leaves in each project page's prerendered block, so
 * crawlers and visitors see the same links.
 */

const fs   = require('fs');
const path = require('path');
const { LOCALITY_CONTENT } = require('./locality-content');
const {
  SITE, escapeHtml, priceRangeText, developersText, renderHubCard, faqAccordion,
  headBoilerplate, FOOTER_HTML, fitTitle,
} = require('./hub-shared');

const ROOT = path.join(__dirname, '..');
const NEAR_KM = 3;          // radius for "near {landmark}" pages
const NEARBY_KM = 12;       // radius for a project's "What's nearby" list
const NEARBY_MAX = 10;

const readJson = (rel, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); } catch { return fallback; } };

const all = readJson('properties/posts.json', []);
const live = all.filter(p => p.status !== 'sold-out');
const landmarks = readJson('properties/landmarks.json', []);
const { LANDMARK_GUIDES, renderGuide } = require('./area-guides');
const existingUrls = new Set([
  ...readJson('scripts/.locality-pages.json', []),
  ...readJson('scripts/.location-hubs.json', []),
  ...readJson('scripts/.developer-hubs.json', []),
  ...readJson('scripts/.category-pages.json', []),
]);

/* ── helpers ─────────────────────────────────────────────────────────── */

// "2, 2.5, 3 & 3.5 BHK" -> [2, 2.5, 3, 3.5]; "3 & 4 BHK+" -> [3, 4]; "2+2, 3 & 4 BHK" -> [2, 3, 4]
function parseBhks(str) {
  const out = new Set();
  for (const m of String(str || '').matchAll(/((?:\d(?:\.\d)?(?:\+\d)?\s*(?:,|&|and)?\s*)+)BHK/gi)) {
    for (const n of m[1].matchAll(/(\d(?:\.\d)?)(?:\+\d)?/g)) out.add(Number(n[1]));
  }
  return [...out].filter(n => n >= 1 && n <= 6).sort((a, b) => a - b);
}
const bhkLabel = n => `${n} BHK`;
const bhkSlug  = n => `${String(n).replace('.', '-')}-bhk`;

function unitRows(p) {
  return [1, 2, 3].map(i => ({ type: p[`unit_${i}_type`], area: p[`unit_${i}_area`], price: p[`unit_${i}_price`] }))
    .filter(u => u.type);
}
// Unit rows that describe exactly one BHK type (so their size/price is specific to it).
function specificRows(p, n) {
  return unitRows(p).filter(u => { const b = parseBhks(u.type); return b.length === 1 && b[0] === n; });
}
// Any row that mentions this BHK (possibly combined, e.g. "2 & 3 BHK").
function anyRow(p, n) {
  return unitRows(p).find(u => parseBhks(u.type).includes(n));
}
const isResidential = p => p.category === 'apartment' || p.category === 'villa';
const projectBhks = p => isResidential(p) ? parseBhks([p.config, ...unitRows(p).map(u => u.type)].join(' ; ')) : [];
const shortLoc = p => (p.location || '').split(',')[0].trim();
const localityName = p => (LOCALITY_CONTENT[p.micro_market] || {}).name || shortLoc(p);
const cleanPrice = s => String(s || '').replace(/\*+$/, '').trim();
const hasPrice = s => s && !/request/i.test(s);

function haversineKm(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// Only project- or street-level coordinates are precise enough to quote a distance.
const geoOf = p => (Number.isFinite(+p.lat) && Number.isFinite(+p.lng) && p.lat !== '' && ['exact', 'street'].includes(p.geo_confidence || 'exact'))
  ? { lat: +p.lat, lng: +p.lng } : null;
const kmText = km => km < 1 ? `${Math.round(km * 1000 / 50) * 50} m` : `${km.toFixed(1)} km`;

function writePage(url, html) {
  const outDir = path.join(ROOT, url.replace(/^\//, ''));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

function jsonLdFor({ crumbs, list, faqs }) {
  const graph = [{
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${SITE}${c.url}` })),
  }];
  if (list) graph.push({
    '@type': 'ItemList', name: list.name, numberOfItems: list.items.length,
    itemListElement: list.items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, item: `${SITE}${p.url}` })),
  });
  if (faqs && faqs.length) graph.push({
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}

const breadcrumbHtml = crumbs => `<nav class="breadcrumb" aria-label="Breadcrumb">${crumbs.map((c, i) => i === crumbs.length - 1
  ? `<span class="current">${escapeHtml(c.name)}</span>`
  : `<a href="${c.url}">${escapeHtml(c.name)}</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span>`).join('')}</nav>`;

const pillLinks = links => links.length
  ? `<div class="loc-sibling-pills">${links.map(l => `<a href="${l.url}" class="loc-sibling-pill">${escapeHtml(l.label)}</a>`).join('')}</div>` : '';

const sectionHead = (icon, label, title) => `<span class="section-label"><i class="fas fa-${icon}"></i> ${escapeHtml(label)}</span>
    <h2 class="section-title">${escapeHtml(title)}</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>`;

const ctaHtml = (heading, text, waMsg) => `
<section class="section">
  <div class="container">
    <div class="loc-cta">
      <h3>${escapeHtml(heading)}</h3>
      <p>${escapeHtml(text)}</p>
      <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">
        <a href="/contact" class="btn btn-primary">Book a Free Site Visit</a>
        <a href="https://wa.me/917447430431?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener" class="btn btn-ghost"><i class="fab fa-whatsapp"></i> WhatsApp an Advisor</a>
      </div>
    </div>
  </div>
</section>`;

const todayLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const ogImg = p => p && p.cover ? (p.cover.startsWith('http') ? p.cover : SITE + p.cover) : SITE + '/images/og-home.jpg';

const generated = [];            // every URL this script writes (for the sitemap)
const related = {};              // slug -> [{label, url}]
const addRelated = (slug, label, url) => {
  related[slug] = related[slug] || [];
  if (!related[slug].some(r => r.url === url)) related[slug].push({ label, url });
};

/* ── 1. Project × BHK pages ─────────────────────────────────────────── */

const projectBhkPages = {};       // slug -> [{n, url}]
for (const p of live) {
  const bhks = projectBhks(p);
  if (bhks.length < 2) continue;  // single-config project: the project page already is the "X BHK in project" page
  const pages = bhks.filter(n => specificRows(p, n).length).map(n => ({ n, url: `${p.url}/${bhkSlug(n)}` }));
  if (pages.length) projectBhkPages[p.slug] = pages;
}

for (const p of live) {
  const pages = projectBhkPages[p.slug];
  if (!pages) continue;
  const loc = localityName(p);
  const otherBhks = projectBhks(p);
  for (const { n, url } of pages) {
    const rows = specificRows(p, n);
    const priced = rows.filter(r => hasPrice(r.price));
    const sized = rows.filter(r => r.area);
    const priceTxt = priced.length ? priced.map(r => cleanPrice(r.price)).join(' / ') : '';
    const sizeTxt = sized.length ? sized.map(r => r.area).join(' / ') : '';
    const rowText = rows.map(r => r.type).join(' ');
    const noun = /townhouse/i.test(rowText) ? 'Townhouse' : /villa/i.test(rowText) || p.category === 'villa' ? 'Villa' : /penthouse|chalet/i.test(rowText) ? 'Residence' : 'Flat';
    const h1 = `${bhkLabel(n)} ${noun}s in ${p.title}, ${loc}`;
    const core = `${p.title} ${bhkLabel(n)} Price${sizeTxt ? ', Size' : ''} & Details`;
    const title = fitTitle([`${core} | PROPHUNT LLP`, `${core} | PROPHUNT`, core, `${p.title} ${bhkLabel(n)} Price | PROPHUNT`, `${p.title} ${bhkLabel(n)} Price`]);
    const desc = `${bhkLabel(n)} ${noun.toLowerCase()}s at ${p.title} by ${p.developer} in ${loc}, Pune.` +
      (priceTxt ? ` Price ${priceTxt}.` : '') + (sizeTxt ? ` Size ${sizeTxt}.` : '') +
      (p.rera ? ' MahaRERA registered.' : '') + ' Get the cost sheet and book a site visit with PROPHUNT LLP.';
    const crumbs = [{ name: 'Home', url: '/' }, { name: 'Projects', url: '/projects' }, { name: p.title, url: p.url }, { name: bhkLabel(n), url }];
    const faqs = [
      { q: `What is the price of a ${bhkLabel(n)} in ${p.title}?`, a: priceTxt
        ? `${bhkLabel(n)} homes at ${p.title} are listed at ${priceTxt} (indicative, excluding taxes and other charges). Contact PROPHUNT LLP for the current cost sheet and any offers.`
        : `The developer has not published a ${bhkLabel(n)} price for ${p.title} yet. Contact PROPHUNT LLP for the current cost sheet.` },
      ...(sizeTxt ? [{ q: `What is the size of a ${bhkLabel(n)} in ${p.title}?`, a: `${bhkLabel(n)} units at ${p.title} are ${sizeTxt}, as published for the project. Ask our advisors for the floor plan and exact carpet area of the unit you are considering.` }] : []),
      { q: `Where is ${p.title} located?`, a: `${p.title} is in ${p.location}. ${LOCALITY_CONTENT[p.micro_market] ? `See all projects in ${loc} on our ${loc} location guide.` : ''}`.trim() },
      ...(p.rera ? [{ q: `Is ${p.title} RERA registered?`, a: `Yes. ${p.title} is registered with MahaRERA under ${p.rera}. You can verify it on the MahaRERA portal.` }] : []),
      { q: `What other configurations are available in ${p.title}?`, a: `${p.title} offers ${p.config}.` },
    ];
    const siblingLinks = pages.filter(x => x.n !== n).map(x => ({ label: `${bhkLabel(x.n)} in ${p.title}`, url: x.url }));
    const otherList = otherBhks.filter(x => x !== n).map(bhkLabel).join(', ');

    const html = headBoilerplate({ title, desc, canonical: `${SITE}${url}`, jsonLd: jsonLdFor({ crumbs, faqs }), ogImage: ogImg(p) }) + `
<section class="page-hero">
  <div class="container page-hero-inner">
    ${breadcrumbHtml(crumbs)}
    <span class="section-label"><i class="fas fa-building"></i> ${escapeHtml(p.developer || '')}</span>
    <h1>${escapeHtml(h1)}</h1>
    <p>${escapeHtml([priceTxt && `Price ${priceTxt}`, sizeTxt && `Size ${sizeTxt}`, p.rera && 'MahaRERA registered'].filter(Boolean).join(' · ') || p.config)}</p>
  </div>
</section>

<section class="section">
  <div class="container" style="max-width:900px">
    ${sectionHead('tags', 'Configuration', `${bhkLabel(n)} at ${p.title}`)}
    <table class="ph-snapshot"><thead><tr><th>Unit</th><th>Size</th><th>Price</th></tr></thead><tbody>${rows.map(r =>
      `<tr><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.area || 'On request')}</td><td>${escapeHtml(hasPrice(r.price) ? r.price : 'Price on Request')}</td></tr>`).join('')}</tbody></table>
    <p class="loc-note" style="margin-top:.75rem">Indicative prices as listed in ${escapeHtml(todayLabel)}, exclusive of taxes and other charges. Always confirm the current cost sheet with PROPHUNT LLP or the developer.</p>
    ${p.overview ? `<p class="loc-about">${escapeHtml(p.overview)}</p>` : ''}
    <table class="ph-snapshot" style="margin-bottom:2rem"><tbody>
      <tr><th>Project</th><td><a href="${p.url}">${escapeHtml(p.title)}</a></td></tr>
      <tr><th>Developer</th><td>${p.developer_hub ? `<a href="${p.developer_hub}">${escapeHtml(p.developer)}</a>` : escapeHtml(p.developer || '')}</td></tr>
      <tr><th>Location</th><td>${escapeHtml(p.location || '')}</td></tr>
      ${otherList ? `<tr><th>Other configurations</th><td>${escapeHtml(otherList)}</td></tr>` : ''}
      ${p.rera ? `<tr><th>MahaRERA</th><td>${escapeHtml(p.rera)}</td></tr>` : ''}
    </tbody></table>
    <p><a href="${p.url}" class="btn btn-primary">View full ${escapeHtml(p.title)} details <i class="fas fa-arrow-right"></i></a></p>
  </div>
</section>

${Array.isArray(p.amenities) && p.amenities.length ? `
<section class="section section--tinted">
  <div class="container" style="max-width:900px">
    ${sectionHead('swimming-pool', 'Amenities', `Amenities at ${p.title}`)}
    <div class="loc-landmarks-chips">${p.amenities.map(a => `<span class="loc-landmark-chip">${escapeHtml(a)}</span>`).join('')}</div>
  </div>
</section>` : ''}

<section class="section">
  <div class="container" style="max-width:900px">
    ${sectionHead('circle-question', 'FAQs', `${p.title} ${bhkLabel(n)}: Frequently Asked Questions`)}
    <div class="loc-faq-list">${faqAccordion(faqs)}</div>
  </div>
</section>

<section class="section section--tinted">
  <div class="container" style="max-width:900px">
    ${sectionHead('link', 'Related', 'Related Searches')}
    <!--BHK-PAGE-RELATED:${p.slug}:${n}-->
  </div>
</section>
${ctaHtml(`Interested in a ${bhkLabel(n)} at ${p.title}?`, 'Get the latest cost sheet, floor plans and available inventory from a PROPHUNT advisor. Free for buyers.', `Hi PROPHUNT LLP, I'm interested in a ${bhkLabel(n)} at ${p.title}. Please share the cost sheet and floor plan.`)}
` + FOOTER_HTML;
    writePage(url, html);
    generated.push(url);
    addRelated(p.slug, `${p.title} ${bhkLabel(n)} price`, url);
    projectBhkPages[p.slug].find(x => x.n === n).siblings = siblingLinks;
  }
}

/* ── 2. Locality × BHK pages ───────────────────────────────────────── */

const byLocBhk = {};
for (const p of live) {
  if (!p.micro_market || !LOCALITY_CONTENT[p.micro_market]) continue;
  for (const n of projectBhks(p)) {
    const k = `${p.micro_market}|${n}`;
    (byLocBhk[k] = byLocBhk[k] || []).push(p);
  }
}
const locBhkPages = Object.entries(byLocBhk).filter(([, ps]) => ps.length >= 2).map(([k, ps]) => {
  const [mm, n] = k.split('|');
  return { mm, n: Number(n), projects: ps, url: `/${bhkSlug(Number(n))}-flats-in-${mm}` };
});
const locBhkUrl = (mm, n) => (locBhkPages.find(x => x.mm === mm && x.n === n) || {}).url;

for (const pg of locBhkPages) {
  const { mm, n, projects, url } = pg;
  const loc = LOCALITY_CONTENT[mm];
  const label = `${bhkLabel(n)} Flats in ${loc.name}`;
  const rowsFor = p => {
    const s = specificRows(p, n);
    if (s.length) return { size: s.map(r => r.area).filter(Boolean).join(' / ') || 'On request', price: s.map(r => hasPrice(r.price) ? cleanPrice(r.price) : '').filter(Boolean).join(' / ') || 'On request', specific: true };
    const r = anyRow(p, n);
    return { size: r && r.area ? `${r.area} (project range)` : 'On request', price: 'On request', specific: false };
  };
  const pricedProjects = projects.filter(p => rowsFor(p).price !== 'On request');
  const sorted = [...projects].sort((a, b) => (a.status === 'coming-soon') - (b.status === 'coming-soon') || a.title.localeCompare(b.title));
  const reraCount = projects.filter(p => p.rera).length;
  const title = fitTitle([`${label}, Pune: ${projects.length} New Projects & Prices | PROPHUNT LLP`, `${label}, Pune: ${projects.length} New Projects & Prices`, `${label}, Pune: ${projects.length} New Projects | PROPHUNT`, `${label}: ${projects.length} New Projects & Prices`]);
  const desc = `Compare ${projects.length} new ${bhkLabel(n)} flat projects in ${loc.name}, Pune from ${developersText(projects)}.` +
    (pricedProjects.length ? ` ${bhkLabel(n)} prices from ${pricedProjects.map(p => rowsFor(p).price).sort()[0]}.` : '') + ' Sizes, MahaRERA numbers and free site visits with PROPHUNT LLP.';
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Locations', url: '/location' }, { name: loc.name, url: `/location/${mm}` }, { name: label, url }];
  const faqs = [
    { q: `How many ${bhkLabel(n)} projects are available in ${loc.name}?`, a: `PROPHUNT LLP currently lists ${projects.length} projects in ${loc.name} offering ${bhkLabel(n)} homes: ${projects.map(p => p.title).join(', ')}.` },
    { q: `What is the price of a ${bhkLabel(n)} flat in ${loc.name}?`, a: pricedProjects.length
      ? `Published ${bhkLabel(n)} prices in ${loc.name}: ${pricedProjects.map(p => `${p.title} ${rowsFor(p).price}`).join('; ')} (indicative, excluding taxes). For the other projects the developer shares pricing on request; our advisors can get you the current cost sheets.`
      : `Developers in ${loc.name} share ${bhkLabel(n)} pricing on request. PROPHUNT LLP can get you current cost sheets for all ${projects.length} projects at no charge.` },
    { q: `Which developers offer ${bhkLabel(n)} flats in ${loc.name}?`, a: `${[...new Set(projects.map(p => p.developer))].join(', ')}.` },
    { q: `Are these ${bhkLabel(n)} projects in ${loc.name} RERA registered?`, a: `${reraCount} of the ${projects.length} projects list a MahaRERA registration number on their PROPHUNT LLP page.${reraCount < projects.length ? ' For the rest, ask our advisors for the current registration status before booking.' : ''}` },
  ];
  const sameBhkElsewhere = locBhkPages.filter(x => x.n === n && x.mm !== mm).map(x => ({ label: `${bhkLabel(n)} flats in ${LOCALITY_CONTENT[x.mm].name}`, url: x.url }));
  const otherBhkHere = locBhkPages.filter(x => x.mm === mm && x.n !== n).sort((a, b) => a.n - b.n).map(x => ({ label: `${bhkLabel(x.n)} flats in ${loc.name}`, url: x.url }));
  const hubLinks = [`/location/${mm}`, `/apartments-in-${mm}`].filter(u => existingUrls.has(u))
    .map(u => ({ label: u.startsWith('/location') ? `All properties in ${loc.name}` : `All apartments in ${loc.name}`, url: u }));
  const aboutBlurb = loc.faqs && loc.faqs[0] ? loc.faqs[0].a : '';

  const html = headBoilerplate({ title, desc, canonical: `${SITE}${url}`, jsonLd: jsonLdFor({ crumbs, list: { name: label, items: sorted }, faqs }), ogImage: ogImg(sorted[0]) }) + `
<section class="page-hero">
  <div class="container page-hero-inner">
    ${breadcrumbHtml(crumbs)}
    <span class="section-label"><i class="fas fa-building"></i> ${escapeHtml(loc.name)}, Pune</span>
    <h1>${escapeHtml(label)}, Pune</h1>
    <p>${projects.length} new projects offering ${bhkLabel(n)} homes in ${escapeHtml(loc.name)}, from ${escapeHtml(developersText(projects))}.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    ${aboutBlurb ? `<p class="loc-about">${escapeHtml(aboutBlurb)}</p>` : ''}
    ${sectionHead('table', 'Compare', `${bhkLabel(n)} Size & Price by Project`)}
    <div style="overflow-x:auto;margin-bottom:.75rem"><table class="ph-snapshot"><thead><tr><th>Project</th><th>Developer</th><th>${bhkLabel(n)} size</th><th>${bhkLabel(n)} price</th></tr></thead><tbody>${sorted.map(p => {
      const r = rowsFor(p);
      return `<tr><td><a href="${(projectBhkPages[p.slug] || []).find(x => x.n === n)?.url || p.url}">${escapeHtml(p.title)}</a>${p.status === 'coming-soon' ? ' <small>(new launch)</small>' : ''}</td><td>${escapeHtml(p.developer || '')}</td><td>${escapeHtml(r.size)}</td><td>${escapeHtml(r.price)}</td></tr>`;
    }).join('')}</tbody></table></div>
    <p class="loc-note">Indicative, as listed in ${escapeHtml(todayLabel)}; excludes taxes and charges. "Project range" means the developer publishes one size range across configurations.</p>
    <div class="loc-grid">${sorted.map(renderHubCard).join('')}</div>
  </div>
</section>

<section class="section section--tinted">
  <div class="container">
    ${sectionHead('circle-question', 'FAQs', `${label}: Frequently Asked Questions`)}
    <div class="loc-faq-list">${faqAccordion(faqs)}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    ${sectionHead('link', 'Related', 'Related Searches')}
    ${pillLinks([...otherBhkHere, ...hubLinks, ...sameBhkElsewhere])}
  </div>
</section>
${ctaHtml(`Looking for a ${bhkLabel(n)} in ${loc.name}?`, 'Tell us your budget and timeline. A PROPHUNT advisor will shortlist the right projects and arrange site visits, free for buyers.', `Hi PROPHUNT LLP, I'm looking for a ${bhkLabel(n)} flat in ${loc.name}. Please share options.`)}
` + FOOTER_HTML;
  writePage(url, html);
  generated.push(url);
  for (const p of projects) addRelated(p.slug, `${bhkLabel(n)} flats in ${loc.name}`, url);
}

/* ── 3. Near-landmark pages + per-project nearby places ─────────────── */

const NEAR_TYPES = [
  { key: 'flats', match: isResidential, prefix: 'flats-near', noun: 'Flats', nounLower: 'flats and homes' },
  { key: 'plots', match: p => p.category === 'plot', prefix: 'plots-near', noun: 'Plots', nounLower: 'plots' },
  { key: 'office', match: p => p.category === 'commercial', prefix: 'office-space-near', noun: 'Office Space', nounLower: 'office and commercial spaces' },
];
const CAT_LABEL = { 'it-park': 'IT park', mall: 'shopping', hospital: 'healthcare', transit: 'transit', education: 'education', other: 'landmark' };
// Landmarks close to each other (a metro station beside a mall beside an IT
// park) would otherwise yield pages listing the same projects — near-duplicate
// doorway pages. Take landmarks in search-demand order and keep a page only if
// its project set is clearly different from every page already kept for that
// type (Jaccard similarity below MAX_OVERLAP).
const CAT_PRIORITY = ['it-park', 'transit', 'mall', 'hospital', 'education', 'other'];
// Landmarks buyers actually search "flats near ..." for go first; the rest follow by category.
const PRIORITY_SLUGS = ['hinjewadi-phase-1', 'hinjewadi-phase-2', 'hinjewadi-phase-3', 'balewadi-high-street',
  'phoenix-mall-of-the-millennium', 'wakad-chowk-metro', 'baner-metro', 'eon-it-park-kharadi', 'magarpatta-city',
  'pcmc-metro-station', 'pune-university-metro', 'aditya-birla-memorial-hospital', 'jupiter-hospital-baner'];
const rank = lm => { const i = PRIORITY_SLUGS.indexOf(lm.slug); return i >= 0 ? i : PRIORITY_SLUGS.length + CAT_PRIORITY.indexOf(lm.category); };
const MAX_OVERLAP = 0.6;
const jaccard = (a, b) => { const A = new Set(a); const inter = b.filter(x => A.has(x)).length; return inter / (A.size + b.length - inter); };
const orderedLandmarks = landmarks.filter(lm => Number.isFinite(lm.lat) && Number.isFinite(lm.lng))
  .map((lm, i) => ({ lm, i })).sort((a, b) => (rank(a.lm) - rank(b.lm)) || a.i - b.i).map(x => x.lm);
const nearPages = [];
for (const lm of orderedLandmarks) {
  for (const t of NEAR_TYPES) {
    const matches = live.filter(t.match).map(p => ({ p, g: geoOf(p) })).filter(x => x.g)
      .map(x => ({ p: x.p, km: haversineKm(x.g, lm) })).filter(x => x.km <= NEAR_KM).sort((a, b) => a.km - b.km);
    if (matches.length < 2) continue;
    const slugs = matches.map(m => m.p.slug);
    if (nearPages.some(x => x.t === t && jaccard(x.matches.map(m => m.p.slug), slugs) >= MAX_OVERLAP)) continue;
    nearPages.push({ lm, t, matches, url: `/${t.prefix}-${lm.slug}` });
  }
}

for (const pg of nearPages) {
  const { lm, t, matches, url } = pg;
  const label = `${t.noun} near ${lm.short_name || lm.name}`;
  const ps = matches.map(m => m.p);
  const title = fitTitle([`${label}, Pune: ${matches.length} Projects within ${NEAR_KM} km | PROPHUNT LLP`, `${label}, Pune: ${matches.length} Projects within ${NEAR_KM} km`, `${label}: ${matches.length} Projects within ${NEAR_KM} km`, `${label}: ${matches.length} Projects`]);
  const desc = `${matches.length} new ${t.nounLower} projects within ${NEAR_KM} km of ${lm.name}, sorted by distance: ${matches.slice(0, 3).map(m => `${m.p.title} (${kmText(m.km)})`).join(', ')}${matches.length > 3 ? ' and more' : ''}. Prices, MahaRERA details and site visits with PROPHUNT LLP.`;
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Projects', url: '/projects' }, { name: label, url }];
  const faqs = [
    { q: `Which new projects are closest to ${lm.name}?`, a: `By straight-line distance: ${matches.slice(0, 5).map(m => `${m.p.title} (about ${kmText(m.km)})`).join(', ')}.` },
    { q: `What is the price range of ${t.nounLower} near ${lm.short_name || lm.name}?`, a: `Across the ${matches.length} projects listed here, published starting prices are ${priceRangeText(ps)}. Many developers share pricing on request; our advisors can get you current cost sheets.` },
    { q: `How are the distances on this page measured?`, a: `Distances are approximate straight-line distances between each project's map location and ${lm.name}. Actual travel distance by road is longer and depends on route and traffic.` },
    ...((LANDMARK_GUIDES[url.slice(1)] || {}).faqs || []),
  ];
  const otherNear = nearPages.filter(x => x !== pg && (x.lm === lm || x.t === t)).slice(0, 12)
    .map(x => ({ label: `${x.t.noun} near ${x.lm.short_name || x.lm.name}`, url: x.url }));
  const html = headBoilerplate({ title, desc, canonical: `${SITE}${url}`, jsonLd: jsonLdFor({ crumbs, list: { name: label, items: ps }, faqs }), ogImage: ogImg(ps[0]) }) + `
<section class="page-hero">
  <div class="container page-hero-inner">
    ${breadcrumbHtml(crumbs)}
    <span class="section-label"><i class="fas fa-location-crosshairs"></i> Near ${escapeHtml(CAT_LABEL[lm.category] || 'landmark')}</span>
    <h1>${escapeHtml(label)}</h1>
    <p>${matches.length} projects within ${NEAR_KM} km of ${escapeHtml(lm.name)}, nearest first.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    ${sectionHead('route', 'By Distance', `Projects near ${lm.short_name || lm.name}`)}
    <div style="overflow-x:auto;margin-bottom:.75rem"><table class="ph-snapshot"><thead><tr><th>Project</th><th>Locality</th><th>Configuration</th><th>Approx. distance</th></tr></thead><tbody>${matches.map(m =>
      `<tr><td><a href="${m.p.url}">${escapeHtml(m.p.title)}</a></td><td>${escapeHtml(localityName(m.p))}</td><td>${escapeHtml(m.p.config || '')}</td><td>${kmText(m.km)}</td></tr>`).join('')}</tbody></table></div>
    <p class="loc-note">Approximate straight-line distance from each project's map location to ${escapeHtml(lm.name)}. Road distance is longer.</p>
    <div class="loc-grid">${ps.map(renderHubCard).join('')}</div>
  </div>
</section>
${renderGuide(`Living and working near ${lm.short_name || lm.name}`, (LANDMARK_GUIDES[url.slice(1)] || {}).sections, 'Area guide')}

<section class="section section--tinted">
  <div class="container">
    ${sectionHead('circle-question', 'FAQs', `${label}: Frequently Asked Questions`)}
    <div class="loc-faq-list">${faqAccordion(faqs)}</div>
  </div>
</section>

${otherNear.length ? `
<section class="section">
  <div class="container">
    ${sectionHead('link', 'Related', 'Related Searches')}
    ${pillLinks(otherNear)}
  </div>
</section>` : ''}
${ctaHtml(`Want a home near ${lm.short_name || lm.name}?`, 'Share your commute, budget and timeline. A PROPHUNT advisor will shortlist the right projects and arrange site visits, free for buyers.', `Hi PROPHUNT LLP, I'm looking for ${t.nounLower} near ${lm.name}. Please share options.`)}
` + FOOTER_HTML;
  writePage(url, html);
  generated.push(url);
  for (const m of matches) addRelated(m.p.slug, `${t.noun} near ${lm.short_name || lm.name}`, url);
}

// Per-project "What's nearby": nearest landmarks with straight-line distance.
const nearby = {};
for (const p of all) {
  const g = geoOf(p);
  if (!g || !landmarks.length) continue;
  const list = landmarks.filter(l => Number.isFinite(l.lat)).map(l => ({ name: l.name, category: l.category, km: haversineKm(g, l) }))
    .filter(x => x.km <= NEARBY_KM).sort((a, b) => a.km - b.km).slice(0, NEARBY_MAX)
    .map(x => ({ name: x.name, category: x.category, km: Math.round(x.km * 10) / 10, label: kmText(x.km) }));
  if (list.length) nearby[p.slug] = list;
}

/* ── 3b. Sub-area pages ────────────────────────────────────────────────
   Areas buyers search by name that sit inside one of our micro-markets
   (Search Console / Autocomplete, Oct 2026: "flats in tathawade",
   "flats on pan card club road baner"). Membership is decided by data, not
   by guesswork: an explicit area_alias (verified against coordinates), a
   project-level map point within radiusKm of the area centre, or the street
   named in the listing's own location. A page is only built with 3+
   projects. Punawale was checked and has none within 2.5 km, so no page. */
const AREA_PAGES = [
  {
    slug: 'flats-in-tathawade', name: 'Tathawade', parent: 'wakad', noun: 'Flats',
    centre: { lat: 18.6153997, lng: 73.7501907 }, radiusKm: 1.2,
    match: p => p.area_alias === 'Tathawade',
    intro: 'Tathawade is a residential locality in Pimpri-Chinchwad on the Mumbai-Bengaluru highway, between Wakad and Punawale, close to the Hinjewadi IT parks. Many projects marketed as "Downtown Wakad" or "New Wakad" are in Tathawade.',
  },
  {
    slug: 'flats-on-pan-card-club-road-baner', name: 'Pan Card Club Road, Baner', short: 'Pan Card Club Road', parent: 'baner', noun: 'Flats',
    match: p => /pan ?card/i.test(p.location || ''),
    intro: 'Pan Card Club Road is a residential stretch in Baner, west Pune, with a concentration of larger-format 3, 4 and 5 BHK projects from established developers.',
  },
];
const areaPages = [];
for (const a of AREA_PAGES) {
  const inRadius = p => a.centre && geoOf(p) && haversineKm(geoOf(p), a.centre) <= a.radiusKm;
  const matches = live.filter(p => isResidential(p) && (a.match(p) || inRadius(p)));
  if (matches.length < 3) continue;
  const url = `/${a.slug}`;
  const short = a.short || a.name;
  const loc = LOCALITY_CONTENT[a.parent];
  const sorted = [...matches].sort((x, y) => (x.status === 'coming-soon') - (y.status === 'coming-soon') || x.title.localeCompare(y.title));
  const bhks = [...new Set(matches.flatMap(projectBhks))].sort((x, y) => x - y);
  const pts = matches.map(geoOf).filter(Boolean);
  const centre = a.centre || (pts.length ? { lat: pts.reduce((s, g) => s + g.lat, 0) / pts.length, lng: pts.reduce((s, g) => s + g.lng, 0) / pts.length } : null);
  const around = centre ? landmarks.filter(l => Number.isFinite(l.lat)).map(l => ({ name: l.name, km: haversineKm(centre, l) }))
    .filter(x => x.km <= 8).sort((x, y) => x.km - y.km).slice(0, 8) : [];
  const label = `${a.noun} ${a.slug.includes('-on-') ? 'on' : 'in'} ${a.name}`;
  const title = fitTitle([`${label}, Pune: ${matches.length} New Projects & Prices | PROPHUNT LLP`, `${label}, Pune: ${matches.length} New Projects & Prices`, `${label}: ${matches.length} New Projects & Prices`, `${label}: ${matches.length} New Projects`]);
  const desc = `${matches.length} new residential projects ${a.slug.includes('-on-') ? 'on' : 'in'} ${a.name}, Pune from ${developersText(matches)}. ${bhks.map(bhkLabel).join(', ')} homes, prices ${priceRangeText(matches)}. MahaRERA details and free site visits.`;
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Locations', url: '/location' }, ...(loc ? [{ name: loc.name, url: `/location/${a.parent}` }] : []), { name: short, url }];
  const reraCount = matches.filter(p => p.rera).length;
  const faqs = [
    { q: `Which new projects are ${a.slug.includes('-on-') ? 'on' : 'in'} ${short}?`, a: `PROPHUNT LLP currently lists ${matches.length} projects: ${sorted.map(p => `${p.title} by ${p.developer}`).join('; ')}.` },
    { q: `What configurations are available in ${short}?`, a: `Across these projects: ${bhks.map(bhkLabel).join(', ')}. See each project for its exact unit mix.` },
    { q: `What is the price range of flats in ${short}?`, a: `Published starting prices are ${priceRangeText(matches)}. Several developers share pricing on request; our advisors can get you current cost sheets at no charge.` },
    { q: `Are these ${short} projects RERA registered?`, a: `${reraCount} of the ${matches.length} projects list a MahaRERA registration number on their PROPHUNT LLP page.${reraCount < matches.length ? ' For the others, ask our advisors for the current status before booking.' : ''}` },
  ];
  const sibling = [
    ...(loc && existingUrls.has(`/location/${a.parent}`) ? [{ label: `All projects in ${loc.name}`, url: `/location/${a.parent}` }] : []),
    ...locBhkPages.filter(x => x.mm === a.parent).sort((x, y) => x.n - y.n).map(x => ({ label: `${bhkLabel(x.n)} flats in ${LOCALITY_CONTENT[x.mm].name}`, url: x.url })),
  ];
  const html = headBoilerplate({ title, desc, canonical: `${SITE}${url}`, jsonLd: jsonLdFor({ crumbs, list: { name: label, items: sorted }, faqs }), ogImage: ogImg(sorted[0]) }) + `
<section class="page-hero">
  <div class="container page-hero-inner">
    ${breadcrumbHtml(crumbs)}
    <span class="section-label"><i class="fas fa-location-dot"></i> ${escapeHtml(short)}, Pune</span>
    <h1>${escapeHtml(label)}, Pune</h1>
    <p>${matches.length} new projects from ${escapeHtml(developersText(matches))}. ${escapeHtml(bhks.map(bhkLabel).join(', '))} homes.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <p class="loc-about">${escapeHtml(a.intro)}</p>
    ${sectionHead('table', 'Compare', `Projects ${a.slug.includes('-on-') ? 'on' : 'in'} ${short}`)}
    <div style="overflow-x:auto;margin-bottom:.75rem"><table class="ph-snapshot"><thead><tr><th>Project</th><th>Developer</th><th>Configuration</th><th>Starting price</th></tr></thead><tbody>${sorted.map(p =>
      `<tr><td><a href="${p.url}">${escapeHtml(p.title)}</a>${p.status === 'coming-soon' ? ' <small>(new launch)</small>' : ''}</td><td>${escapeHtml(p.developer || '')}</td><td>${escapeHtml(p.config || '')}</td><td>${escapeHtml(p.price > 0 ? (p.price >= 100 ? '₹' + (p.price / 100).toFixed(2).replace(/\.?0+$/, '') + ' Cr' : '₹' + p.price + ' L') : 'On request')}</td></tr>`).join('')}</tbody></table></div>
    <p class="loc-note">Indicative, as listed in ${escapeHtml(todayLabel)}; excludes taxes and charges.</p>
    <div class="loc-grid">${sorted.map(renderHubCard).join('')}</div>
  </div>
</section>
${around.length ? `
<section class="section section--tinted">
  <div class="container">
    ${sectionHead('map-signs', 'Connectivity', `What's near ${short}`)}
    <ul class="loc-guide-list">${around.map(x => `<li>${escapeHtml(x.name)}: about ${kmText(x.km)}</li>`).join('')}</ul>
    <p class="loc-note">Approximate straight-line distances from the centre of ${escapeHtml(short)}.</p>
  </div>
</section>` : ''}

<section class="section">
  <div class="container">
    ${sectionHead('circle-question', 'FAQs', `${short}: Frequently Asked Questions`)}
    <div class="loc-faq-list">${faqAccordion(faqs)}</div>
  </div>
</section>
${sibling.length ? `
<section class="section">
  <div class="container">
    ${sectionHead('link', 'Related', 'Related Searches')}
    ${pillLinks(sibling)}
  </div>
</section>` : ''}
${ctaHtml(`Looking for a home ${a.slug.includes('-on-') ? 'on' : 'in'} ${short}?`, 'Tell us your budget and timeline. A PROPHUNT advisor will shortlist the right projects and arrange site visits, free for buyers.', `Hi PROPHUNT LLP, I'm looking for a flat ${a.slug.includes('-on-') ? 'on' : 'in'} ${a.name}. Please share options.`)}
` + FOOTER_HTML;
  writePage(url, html);
  generated.push(url);
  areaPages.push({ url, short, name: a.name, matches });
  for (const p of matches) addRelated(p.slug, label, url);
}

/* ── 4. Finish related searches: hubs that already exist ───────────── */

for (const p of live) {
  const loc = LOCALITY_CONTENT[p.micro_market];
  if (loc) {
    const catSlug = { apartment: 'apartments', plot: 'plots', villa: 'villas', commercial: 'commercial-properties' }[p.category];
    const catUrl = `/${catSlug}-in-${p.micro_market}`;
    if (existingUrls.has(catUrl)) addRelated(p.slug, `${{ apartment: 'Apartments', plot: 'Plots', villa: 'Villas', commercial: 'Commercial properties' }[p.category]} in ${loc.name}`, catUrl);
    if (existingUrls.has(`/location/${p.micro_market}`)) addRelated(p.slug, `New projects in ${loc.name}`, `/location/${p.micro_market}`);
  }
  if (p.developer_hub && existingUrls.has(p.developer_hub)) addRelated(p.slug, `${p.developer} projects in Pune`, p.developer_hub);
}

// Fill the related block on each project × BHK page (now that all pages exist).
for (const [slug, pages] of Object.entries(projectBhkPages)) {
  const p = live.find(x => x.slug === slug);
  for (const pg of pages) {
    const file = path.join(ROOT, pg.url.replace(/^\//, ''), 'index.html');
    const links = [...(pg.siblings || []), ...(related[slug] || []).filter(r => r.url !== pg.url && !r.url.startsWith(p.url + '/'))];
    const locUrl = locBhkUrl(p.micro_market, pg.n);
    if (locUrl && !links.some(l => l.url === locUrl)) links.unshift({ label: `${bhkLabel(pg.n)} flats in ${localityName(p)}`, url: locUrl });
    const html = fs.readFileSync(file, 'utf8').replace(`<!--BHK-PAGE-RELATED:${slug}:${pg.n}-->`, pillLinks(links));
    fs.writeFileSync(file, html);
  }
}

/* ── 5. Inject into project pages + seo-content.json ────────────────── */

const relatedHtml = links => links && links.length ? `<div id="related-searches" class="ph-section"><div class="ph-section-label">Related Searches</div>
      <ul class="ph-verify ph-cols">${links.map(l => `<li><a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a></li>`).join('')}</ul></div>` : '';
const nearbyHtml = list => list && list.length ? `<div id="whats-nearby" class="ph-section"><div class="ph-section-label">What's Nearby</div>
      <ul class="ph-verify ph-cols">${list.map(x => `<li>${escapeHtml(x.name)} <strong>${escapeHtml(x.label)}</strong></li>`).join('')}</ul>
      <p class="ph-disclaimer">Approximate straight-line distances from the project's map location.</p></div>` : '';

for (const p of all) {
  const file = path.join(ROOT, 'projects', p.slug, 'index.html');
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('<!--SEO-RELATED-->', relatedHtml(p.status === 'sold-out' ? [] : related[p.slug]))
             .replace('<!--SEO-NEARBY-->', nearbyHtml(nearby[p.slug]));
  fs.writeFileSync(file, html);
}

const seoPath = path.join(ROOT, 'properties', 'seo-content.json');
const seo = readJson('properties/seo-content.json', {});
seo.related = Object.fromEntries(live.filter(p => related[p.slug]).map(p => [p.slug, related[p.slug]]));
seo.nearby = nearby;
fs.writeFileSync(seoPath, JSON.stringify(seo, null, 2));

fs.writeFileSync(path.join(ROOT, 'scripts', '.seo-pages.json'), JSON.stringify(generated));

/* ── 6. Homepage "Popular searches" ────────────────────────────────────
   Search Console (Oct 2026) showed Google had discovered but never crawled
   ~70 project/location/developer pages, and the homepage, the page Google
   crawls most, linked to only 6 of them. This block gives every hub and
   search page a plain HTML link from the homepage; regenerated each build
   between the markers so it never goes stale. */
const homePath = path.join(ROOT, 'index.html');
if (fs.existsSync(homePath)) {
  const devName = {};
  live.forEach(p => { if (p.developer_hub) devName[p.developer_hub] = p.developer; });
  const groups = [
    ['Projects by location', readJson('scripts/.location-hubs.json', []).filter(u => u !== '/location')
      .map(u => ({ label: `New projects in ${(LOCALITY_CONTENT[u.split('/').pop()] || {}).name || u.split('/').pop()}`, url: u }))],
    ['Popular areas', areaPages.map(x => ({ label: `Flats ${x.url.includes('-on-') ? 'on' : 'in'} ${x.name}`, url: x.url }))],
    ['Flats by size', [...locBhkPages].sort((a, b) => a.mm.localeCompare(b.mm) || a.n - b.n)
      .map(x => ({ label: `${bhkLabel(x.n)} flats in ${LOCALITY_CONTENT[x.mm].name}`, url: x.url }))],
    ['Near work & transit', nearPages.map(x => ({ label: `${x.t.noun} near ${x.lm.short_name || x.lm.name}`, url: x.url }))],
    ['Projects by developer', readJson('scripts/.developer-hubs.json', []).filter(u => u !== '/developer' && devName[u])
      .map(u => ({ label: `${devName[u]} projects`, url: u }))],
  ].filter(([, links]) => links.length);
  const block = `<!--POPULAR-SEARCHES-START-->
<section class="section" id="popular-searches" aria-labelledby="popularSearchesTitle">
  <div class="container">
    <div class="section-header centered">
      <span class="section-label"><i class="fas fa-magnifying-glass"></i> Popular Searches</span>
      <h2 class="section-title" id="popularSearchesTitle">Explore Pune Projects</h2>
    </div>
    <div class="popular-searches-grid">
      ${groups.map(([title, links]) => `<details class="popular-searches-group" open><summary class="popular-searches-title">${escapeHtml(title)} <span class="n">${links.length}</span></summary><ul class="popular-searches-list">${links.map(l => `<li><a href="${l.url}">${escapeHtml(l.label)}</a></li>`).join('')}</ul></details>`).join('\n      ')}
    </div>
  </div>
</section>
<style>
.popular-searches-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:2rem;margin-top:2rem}
@media(max-width:1100px){.popular-searches-grid{grid-template-columns:repeat(3,1fr)}}
.popular-searches-title{display:flex;align-items:center;gap:.5rem;font-family:var(--font-head);font-size:.95rem;font-weight:700;margin-bottom:.75rem;color:var(--black);list-style:none;pointer-events:none}
.popular-searches-title::-webkit-details-marker{display:none}
.popular-searches-title .n{display:none}
.popular-searches-list{list-style:none;margin:0;padding:0}
.popular-searches-list li{padding:.3rem 0}
.popular-searches-list a{font-size:.9rem;color:var(--gray-600);transition:color .2s}
.popular-searches-list a:hover{color:var(--red)}
/* Phones: each group is a tap-to-open row instead of one 40-link column. */
@media(max-width:640px){
  .popular-searches-grid{grid-template-columns:1fr;gap:0;border-top:1px solid var(--gray-200)}
  .popular-searches-group{border-bottom:1px solid var(--gray-200)}
  .popular-searches-title{pointer-events:auto;cursor:pointer;margin:0;padding:1rem 0}
  .popular-searches-title .n{display:inline-flex;margin-left:auto;font-size:.75rem;font-weight:600;color:var(--gray-600);background:var(--gray-100);border-radius:99px;padding:.1rem .55rem}
  .popular-searches-title::after{content:"\\f078";font-family:"Font Awesome 6 Free";font-weight:900;font-size:.7rem;color:var(--red);transition:transform .2s}
  .popular-searches-group[open] .popular-searches-title::after{transform:rotate(180deg)}
  .popular-searches-list{padding:0 0 .9rem}
}
</style>
<script>if(matchMedia('(max-width:640px)').matches)document.querySelectorAll('.popular-searches-group').forEach(function(d){d.open=false})</script>
<!--POPULAR-SEARCHES-END-->`;
  const home = fs.readFileSync(homePath, 'utf8');
  const next = home.replace(/<!--POPULAR-SEARCHES-START-->[\s\S]*?<!--POPULAR-SEARCHES-END-->/, block);
  if (next !== home) fs.writeFileSync(homePath, next);
}
const count = re => generated.filter(u => re.test(u)).length;
console.log(`Built ${generated.length} search pages: ${count(/^\/projects\//)} project×BHK, ${count(/-flats-in-/)} locality×BHK, ${count(/-near-/)} near-landmark, ${areaPages.length} area; nearby data for ${Object.keys(nearby).length} projects`);
