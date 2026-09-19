/**
 * Build script: generates one "developer hub" page per developer with at
 * least DEV_HUB_MIN live projects on the site — /developer/anp-corp,
 * /developer/lodha, etc. — plus a /developer index.
 *
 * Buyer-facing counterpart to /developers (the B2B "list your project with
 * us" page). Hubs aggregate a developer's live projects, where they are, at
 * what stage and price, and the MahaRERA number listed for each. Everything
 * is derived from properties/posts.json — no developer bios or track-record
 * claims we can't source. Developers with a single project don't get a hub
 * (it would just duplicate the project page — thin content).
 */

const fs   = require('fs');
const path = require('path');
const { LOCALITY_CONTENT } = require('./locality-content');
const {
  SITE, CATEGORY_META, escapeHtml, priceLabel, fmtLakhCr, priceRangeText,
  lifecycle, renderHubCard, faqAccordion, headBoilerplate, FOOTER_HTML,
  DEV_HUB_MIN, developerSlug,
} = require('./hub-shared');

const ROOT = path.join(__dirname, '..');
const MAHARERA_URL = 'https://maharera.mahaonline.gov.in';

function joinList(items) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

// Honest price summary: a range over the priced listings, plus how many are
// "price on request" — never present one priced project as the whole story.
function devPriceText(matches) {
  const priced = matches.filter(p => p.price > 0);
  if (!priced.length) return 'on request';
  const range = priceRangeText(priced);
  return priced.length === matches.length ? range : `${range} for ${priced.length} of ${matches.length} projects (others on request)`;
}

function localitiesOf(matches) {
  const seen = new Map();
  matches.forEach(p => {
    const name = p.locality_name || (p.location || '').split(',').slice(-2)[0].trim();
    const key = p.micro_market || name;
    if (!seen.has(key)) seen.set(key, { bucket: p.micro_market, name, count: 0 });
    seen.get(key).count++;
  });
  return [...seen.values()].sort((a, b) => b.count - a.count);
}

function stageCounts(matches) {
  const c = { 'New Launch': 0, 'Under Construction': 0, 'Ready to Move': 0 };
  matches.forEach(p => { c[lifecycle(p).label]++; });
  return Object.entries(c).filter(([, n]) => n > 0);
}

function categoriesOf(matches) {
  const counts = {};
  matches.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  return Object.keys(CATEGORY_META).filter(c => counts[c]).map(c => ({ meta: CATEGORY_META[c], n: counts[c] }));
}

function buildFaqs(dev, matches, locs, todayLabel) {
  const n = matches.length;
  const withRera = matches.filter(p => p.rera).length;
  const priced = matches.filter(p => p.price > 0);
  const faqs = [
    {
      q: `How many ${dev} projects does PROPHUNT LLP list?`,
      a: `PROPHUNT LLP currently lists ${n} live ${dev} projects: ${matches.map(p => p.title).join(', ')}. Availability changes, so confirm the latest inventory with our advisory team.`,
    },
    {
      q: `Where are the ${dev} projects PROPHUNT LLP lists?`,
      a: `The ${dev} projects listed on PROPHUNT LLP are in ${joinList(locs.map(l => l.name))}.`,
    },
  ];
  if (priced.length) {
    faqs.push({
      q: `What is the starting price of ${dev} projects?`,
      a: `Listed ${dev} projects are priced ${devPriceText(matches)} (as of ${todayLabel}). Prices are indicative and exclusive of taxes and other charges — ask PROPHUNT LLP for the current cost sheet.`,
    });
  }
  faqs.push({
    q: `Are ${dev} projects registered under MahaRERA?`,
    a: withRera === n
      ? `A MahaRERA project registration number is listed on PROPHUNT LLP for all ${n} ${dev} projects shown here. Verify each one independently on the official MahaRERA portal before booking.`
      : `A MahaRERA project registration number is listed for ${withRera} of the ${n} ${dev} projects shown here. For any project without a listed number, ask PROPHUNT LLP for it or search the project name on the MahaRERA portal before booking.`,
  });
  faqs.push({
    q: `Do I pay PROPHUNT LLP to view or buy ${dev} projects?`,
    a: `PROPHUNT LLP's property discovery, project comparison and site-visit advisory is available at no direct cost to buyers. Optional third-party legal or specialist services may involve separately disclosed fees.`,
  });
  return faqs;
}

function buildDeveloperPage({ dev, slug, matches, todayLabel, otherDevs }) {
  const n = matches.length;
  const locs = localitiesOf(matches);
  const cats = categoriesOf(matches);
  const sorted = [...matches].sort((a, b) => lifecycle(a).weight - lifecycle(b).weight);
  const canonical = `${SITE}/developer/${slug}`;
  const title = `${dev} Projects in Pune | PROPHUNT LLP`;
  const desc = `${n} ${dev} projects in ${joinList(locs.map(l => l.name))}. Prices ${devPriceText(matches)}. MahaRERA details listed, compared by PROPHUNT LLP.`;
  const faqs = buildFaqs(dev, matches, locs, todayLabel);
  const stages = stageCounts(matches);

  const about = `PROPHUNT LLP currently lists ${n} live ${dev} projects across ${joinList(locs.map(l => l.name))}` +
    `${cats.length ? `, covering ${joinList(cats.map(c => c.meta.lower))}` : ''}. Prices ${devPriceText(matches)}. ` +
    `${stages.length ? `By stage: ${joinList(stages.map(([label, k]) => `${k} ${label.toLowerCase()}`))}.` : ''}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Developers', item: `${SITE}/developer` },
          { '@type': 'ListItem', position: 3, name: dev, item: canonical },
        ],
      },
      {
        '@type': 'ItemList',
        name: title,
        numberOfItems: n,
        itemListElement: sorted.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, item: `${SITE}${p.url}` })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  };

  const first = matches.find(p => p.cover);
  const ogImage = first ? (first.cover.startsWith('http') ? first.cover : SITE + first.cover) : SITE + '/images/og-home.jpg';

  const reraRows = sorted.map(p => `<tr><td><a href="${escapeHtml(p.url)}">${escapeHtml(p.title)}</a></td><td>${escapeHtml(p.locality_name || p.location || '')}</td><td>${escapeHtml(p.config || '—')}</td><td>${escapeHtml(priceLabel(p))}</td><td>${p.rera ? escapeHtml(p.rera) : 'Ask us'}</td></tr>`).join('');

  return headBoilerplate({ title, desc, canonical, jsonLd, ogImage }) + `
<section class="page-hero">
  <div class="container page-hero-inner">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><a href="/developer">Developers</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><span class="current">${escapeHtml(dev)}</span></nav>
    <span class="section-label"><i class="fas fa-building"></i> Developer Portfolio</span>
    <h1>${escapeHtml(dev)} Projects in Pune</h1>
    <p>${n} live projects across ${escapeHtml(joinList(locs.map(l => l.name)))}. Prices ${escapeHtml(devPriceText(matches))}.</p>
    <div class="page-hero-meta">
      <div class="page-hero-meta-item"><i class="fas fa-check-circle"></i> MahaRERA details listed</div>
      <div class="page-hero-meta-item"><i class="fas fa-building"></i> ${n} Listed</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <p class="loc-about">${escapeHtml(about)}</p>
    <p class="loc-note">Prices and availability reflect live PROPHUNT LLP listings as of ${escapeHtml(todayLabel)} and are subject to change — always confirm current pricing and inventory with our advisory team or the developer directly.</p>
    <div class="loc-cat-pills">${locs.filter(l => l.bucket && LOCALITY_CONTENT[l.bucket]).map(l => `<a href="/location/${l.bucket}" class="loc-cat-pill"><i class="fas fa-location-dot"></i> ${escapeHtml(l.name)} · ${l.count}</a>`).join('')}</div>
    <div class="loc-grid">${sorted.map(renderHubCard).join('')}</div>
  </div>
</section>

<section class="section section--tinted">
  <div class="container">
    <span class="section-label"><i class="fas fa-shield-halved"></i> Registration</span>
    <h2 class="section-title">${escapeHtml(dev)} — MahaRERA Numbers</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    <div style="overflow-x:auto"><table class="ph-snapshot"><thead><tr><th>Project</th><th>Location</th><th>Configuration</th><th>Price</th><th>MahaRERA no.</th></tr></thead><tbody>${reraRows}</tbody></table></div>
    <p class="ph-disclaimer" style="margin-top:14px;font-size:.85rem;color:var(--gray-500,#777)">Registration numbers are shown as provided for each project. Buyers should independently verify every project on the <a href="${MAHARERA_URL}" target="_blank" rel="noopener" style="color:var(--red)">MahaRERA portal</a> before purchase.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <span class="section-label"><i class="fas fa-circle-question"></i> FAQs</span>
    <h2 class="section-title">${escapeHtml(dev)} — Frequently Asked Questions</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    <div class="loc-faq-list">${faqAccordion(faqs)}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <span class="section-label"><i class="fas fa-sitemap"></i> Compare Developers</span>
    <h2 class="section-title">Other Developers on PROPHUNT LLP</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    <div class="loc-sibling-pills">${otherDevs.filter(d => d.slug !== slug).map(d => `<a href="/developer/${d.slug}" class="loc-sibling-pill">${escapeHtml(d.dev)}</a>`).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="loc-cta">
      <h3>Considering a ${escapeHtml(dev)} project?</h3>
      <p>Talk to a PROPHUNT advisor — free consultation, no pressure, just clarity on pricing &amp; suitable projects.</p>
      <a href="/contact" class="btn btn-primary">Book a Free Consultation</a>
    </div>
  </div>
</section>
` + FOOTER_HTML;
}

function buildIndexPage(devs) {
  const canonical = `${SITE}/developer`;
  const title = 'Real Estate Developers in Pune | PROPHUNT LLP';
  const desc = `Browse projects by developer on PROPHUNT LLP — ${devs.map(d => d.dev).slice(0, 4).join(', ')} and more — with MahaRERA details, locations and prices.`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Developers', item: canonical },
        ],
      },
      {
        '@type': 'ItemList',
        name: title,
        numberOfItems: devs.length,
        itemListElement: devs.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d.dev, item: `${SITE}/developer/${d.slug}` })),
      },
    ],
  };
  return headBoilerplate({ title, desc, canonical, jsonLd, ogImage: SITE + '/images/og-home.jpg' }) + `
<section class="page-hero">
  <div class="container page-hero-inner">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><span class="current">Developers</span></nav>
    <span class="section-label"><i class="fas fa-building"></i> Developer Portfolios</span>
    <h1>Explore Projects by Developer</h1>
    <p>Every live project PROPHUNT LLP lists for developers with multiple projects in our portfolio, with locations, prices and MahaRERA numbers.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="loc-hub-grid">
      ${devs.map(({ dev, slug, matches }) => `
      <a href="/developer/${slug}" class="loc-hub-card">
        <h3>${escapeHtml(dev)}</h3>
        <p>${matches.length} project${matches.length === 1 ? '' : 's'} · Prices ${escapeHtml(devPriceText(matches))}</p>
      </a>`).join('')}
    </div>
  </div>
</section>
` + FOOTER_HTML;
}

const properties = JSON.parse(fs.readFileSync(path.join(ROOT, 'properties', 'posts.json'), 'utf8'));
const active = properties.filter(p => p.status !== 'sold-out' && p.developer);
const todayLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const byDev = new Map();
active.forEach(p => {
  if (!byDev.has(p.developer)) byDev.set(p.developer, []);
  byDev.get(p.developer).push(p);
});

const devs = [...byDev.entries()]
  .filter(([, m]) => m.length >= DEV_HUB_MIN)
  .map(([dev, matches]) => ({ dev, slug: developerSlug(dev), matches }))
  .sort((a, b) => b.matches.length - a.matches.length || a.dev.localeCompare(b.dev));

const generatedUrls = [];
devs.forEach(d => {
  const outDir = path.join(ROOT, 'developer', d.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), buildDeveloperPage({ ...d, todayLabel, otherDevs: devs }));
  generatedUrls.push(`/developer/${d.slug}`);
  console.log(`  → developer/${d.slug}/index.html (${d.matches.length} projects)`);
});

fs.mkdirSync(path.join(ROOT, 'developer'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'developer', 'index.html'), buildIndexPage(devs));
generatedUrls.push('/developer');

fs.writeFileSync(path.join(ROOT, 'scripts', '.developer-hubs.json'), JSON.stringify(generatedUrls));
console.log(`Built ${generatedUrls.length} developer hub pages`);

module.exports = { generatedUrls };
