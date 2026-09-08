/**
 * Build script: generates "[Category] in [Locality]" browse pages —
 * e.g. /apartments-in-wakad, /plots-in-khopoli — the programmatic SEO
 * layer that mirrors what competitor sites do with "1BHK/2BHK... For
 * Sale/Rent in [Project]" links, adapted to how PROPHUNT LLP's data
 * actually works:
 *
 * - Grouped by category + micro-market, not by exact BHK count. Checked
 *   the real distribution first (see commit message) — BHK x locality is
 *   mostly 1-project cells across our 44 listings, which would ship
 *   dozens of near-empty pages. Category x locality has real depth for
 *   the localities that matter (17 Baner apartments, 12 Wakad apartments,
 *   6 Wakad commercial, etc.) and only generates a page where there's at
 *   least one genuine listing to show.
 * - No "For Rent" variant: PROPHUNT LLP is a new-project channel partner,
 *   not a rental marketplace — we have zero rental inventory, so a "for
 *   rent" page would be entirely fabricated content.
 * - Each page gets its own category-specific FAQ (real counts, real price
 *   range, real developer list — computed fresh per page) rather than
 *   reusing the shared per-locality FAQ set verbatim across every
 *   category page for that locality, which would read as duplicate
 *   content between e.g. apartments-in-wakad and commercial-in-wakad.
 *   The shared locality FAQ answer is used only once, as a one-paragraph
 *   "About [Locality]" blurb — the kind of supporting context real
 *   listing portals reuse across category pages without it being the
 *   substance of the page.
 */

const fs   = require('fs');
const path = require('path');
const { LOCALITY_CONTENT } = require('./locality-content');

const SITE = 'https://www.prophuntllp.com';
const ROOT = path.join(__dirname, '..');

const CATEGORY_META = {
  apartment:  { label: 'Apartments',             lower: 'apartments',             singular: 'apartment',            icon: 'building',  slug: 'apartments' },
  plot:       { label: 'Plots',                  lower: 'plots',                  singular: 'plot',                 icon: 'map',       slug: 'plots' },
  villa:      { label: 'Villas',                 lower: 'villas',                 singular: 'villa',                icon: 'home',      slug: 'villas' },
  commercial: { label: 'Commercial Properties',  lower: 'commercial properties',  singular: 'commercial property',  icon: 'briefcase', slug: 'commercial-properties' },
};

function countLabel(n, meta) {
  return `${n} verified ${n === 1 ? meta.singular : meta.lower}`;
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

function fmtLakhCr(v) {
  return v >= 100 ? '₹' + (v / 100).toFixed(2).replace(/\.?0+$/, '') + ' Cr' : '₹' + v + ' L';
}

function priceRangeText(matches) {
  const priced = matches.filter(p => p.price > 0).map(p => p.price);
  if (!priced.length) return 'available on request';
  const min = Math.min(...priced), max = Math.max(...priced);
  return min === max ? `around ${fmtLakhCr(min)}` : `from ${fmtLakhCr(min)} to ${fmtLakhCr(max)}`;
}

function developersText(matches) {
  const devs = [...new Set(matches.map(p => p.developer).filter(Boolean))];
  if (!devs.length) return 'leading Pune developers';
  if (devs.length <= 3) return devs.join(', ');
  return devs.slice(0, 3).join(', ') + ' and more';
}

function categoryFaqs(meta, locality, matches) {
  const n = matches.length;
  return [
    {
      q: `How many ${meta.lower} are available in ${locality.name}?`,
      a: `PROPHUNT LLP currently lists ${countLabel(n, meta)} in ${locality.name}, Pune.`,
    },
    {
      q: `What is the price range for ${meta.lower} in ${locality.name}?`,
      a: `${meta.label} in ${locality.name} are priced ${priceRangeText(matches)}. Contact PROPHUNT LLP for the latest pricing and payment plans.`,
    },
    {
      q: `Which developers are building ${meta.lower} in ${locality.name}?`,
      a: `${meta.label} in ${locality.name} are being developed by ${developersText(matches)}.`,
    },
  ];
}

function renderProjectCard(p) {
  const icon = p.category === 'plot' ? 'map' : p.category === 'villa' ? 'home' : p.category === 'commercial' ? 'briefcase' : 'building';
  const statusBadge = p.status === 'sold-out'
    ? '<span class="badge badge-black" style="font-size:.68rem;padding:.2rem .55rem">Sold Out</span>' : '';
  return `
    <a href="${p.url}" class="prop-card" aria-label="View Details: ${escapeHtml(p.title)}">
      <div class="prop-card-img">
        <div style="background-image:url('${p.cover || ''}');">${p.cover ? '' : `<span class="prop-card-img-empty"><i class="fas fa-${icon}"></i></span>`}</div>
        <div class="prop-card-badge"><span class="badge badge-red">${escapeHtml(p.developer || '')}</span>${statusBadge}</div>
        <div class="prop-card-price">${priceLabel(p)}</div>
      </div>
      <div class="prop-card-body">
        <div class="prop-card-dev">${escapeHtml(p.developer || '')}</div>
        <h3 class="prop-card-title">${escapeHtml(p.title || '')}</h3>
        <p class="prop-card-loc"><i class="fas fa-map-marker-alt"></i>${escapeHtml(p.location || '')}</p>
        <div class="prop-card-specs">
          <span><i class="fas fa-${icon}"></i>${escapeHtml(p.config || '')}</span>
          <span><i class="fas fa-ruler-combined"></i>${escapeHtml(p.area || '')}</span>
        </div>
        <div class="prop-card-footer">
          <span class="prop-card-status">View on PROPHUNT</span>
          <span class="prop-card-link">View Details <i class="fas fa-arrow-right"></i></span>
        </div>
      </div>
    </a>`;
}

function faqAccordion(faqs) {
  // Native <details>/<summary> — a fully crawlable, zero-JS accordion.
  return faqs.map(f => `
    <details class="loc-faq-item">
      <summary>${escapeHtml(f.q)}</summary>
      <p>${escapeHtml(f.a)}</p>
    </details>`).join('');
}

function buildPage({ slug, url, meta, locality, bucket, matches }) {
  const title = `${meta.label} in ${locality.name}, Pune`;
  const fullTitle = `${title} | PROPHUNT LLP`;
  const desc = `Explore ${countLabel(matches.length, meta)} in ${locality.name}, Pune from ${developersText(matches)}. Prices ${priceRangeText(matches)}. RERA-verified listings curated by PROPHUNT LLP.`;
  const canonical = `${SITE}${url}`;
  const aboutBlurb = locality.faqs && locality.faqs[0] ? locality.faqs[0].a : '';
  const faqs = categoryFaqs(meta, locality, matches);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE}/projects` },
          { '@type': 'ListItem', position: 3, name: title, item: canonical },
        ],
      },
      {
        '@type': 'ItemList',
        name: title,
        description: desc,
        numberOfItems: matches.length,
        itemListElement: matches.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, name: p.title, item: `${SITE}${p.url}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YR6CRE6BNN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YR6CRE6BNN');
</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${escapeHtml(fullTitle)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${matches[0] && matches[0].cover ? (matches[0].cover.startsWith('http') ? matches[0].cover : SITE + matches[0].cover) : SITE + '/images/og-home.jpg'}">
<meta property="og:site_name" content="PROPHUNT LLP">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(fullTitle)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
<meta name="theme-color" content="#C8362B">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&family=Rubik:wght@400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet"></noscript>
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></noscript>
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/pages.css">
<style>
.loc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
@media(max-width:1024px){.loc-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.loc-grid{grid-template-columns:1fr}}
.loc-about{font-size:1.02rem;line-height:1.8;color:var(--gray-600);max-width:760px;margin-bottom:2.5rem}
.loc-faq-list{max-width:760px}
.loc-faq-item{border-bottom:1px solid var(--gray-200);padding:16px 2px}
.loc-faq-item:last-child{border-bottom:none}
.loc-faq-item summary{font-family:var(--font-head);font-size:14.5px;font-weight:700;color:var(--black);cursor:pointer;list-style:none}
.loc-faq-item summary::-webkit-details-marker{display:none}
.loc-faq-item summary::after{content:'+';float:right;color:var(--red);font-weight:700}
.loc-faq-item[open] summary::after{content:'−'}
.loc-faq-item p{margin-top:10px;font-size:13.5px;color:var(--gray-600);line-height:1.7}
.loc-landmarks-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.25rem}
.loc-landmark-chip{font-size:12.5px;color:var(--gray-700);background:var(--gray-100);border:1px solid var(--gray-200);border-radius:4px;padding:6px 12px}
.loc-landmark-cat-title{font-family:var(--font-head);font-size:13px;font-weight:700;color:var(--black);margin-bottom:.6rem}
.loc-cta{background:var(--black);border-radius:var(--radius-lg);padding:2.5rem;text-align:center;color:#fff}
.loc-cta h3{color:#fff;margin-bottom:.5rem}
.loc-cta p{color:rgba(255,255,255,.65);margin-bottom:1.5rem}
</style>
</head>
<body>

<nav class="navbar" id="navbar">
  <div class="nav-container">
    <a href="/" class="nav-logo"><img src="/images/logo-black.png" alt="PROPHUNT LLP" class="logo-black"></a>
    <ul class="nav-links">
      <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
      <li class="nav-item"><a href="/projects" class="nav-link active">Projects <i class="fas fa-chevron-down chevron"></i></a>
        <div class="dropdown">
          <a href="/projects" class="dropdown-link"><i class="fas fa-th"></i> All Projects</a>
          <a href="/projects?type=apartment" class="dropdown-link"><i class="fas fa-building"></i> Apartments</a>
          <a href="/projects?type=plot" class="dropdown-link"><i class="fas fa-map"></i> Plots</a><a href="/projects?type=villa" class="dropdown-link"><i class="fas fa-home"></i> Villas</a>
          <hr class="dropdown-divider">
          <a href="/developers" class="dropdown-link"><i class="fas fa-sitemap"></i> Developer Partnerships</a>
        </div>
      </li>
      <li class="nav-item"><a href="/services" class="nav-link">Services</a></li>
      <li class="nav-item"><a href="/about" class="nav-link">About</a></li>
      <li class="nav-item"><a href="/blog" class="nav-link">Blog</a></li>
      <li class="nav-item"><a href="/contact" class="nav-link">Contact</a></li>
    </ul>
    <div class="nav-actions">
      <a href="/contact" class="btn btn-primary btn-sm">Book a Site Visit</a>
      <button class="hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <div class="mobile-menu-inner">
    <ul class="mobile-nav-links">
      <li><a href="/" class="mobile-nav-link">Home</a></li>
      <li><a href="/projects" class="mobile-nav-link active">Projects</a></li>
      <li><a href="/services" class="mobile-nav-link">Services</a></li>
      <li><a href="/about" class="mobile-nav-link">About</a></li>
      <li><a href="/blog" class="mobile-nav-link">Blog</a></li>
    </ul>
    <div class="mobile-menu-footer">
      <a href="/contact" class="btn btn-primary">Enquire Now</a>
      <a href="tel:+917066880808" class="btn btn-ghost">Call Us</a>
    </div>
  </div>
</div>

<section class="page-hero">
  <div class="container page-hero-inner">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><a href="/projects">Projects</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><span class="current">${escapeHtml(title)}</span></nav>
    <span class="section-label"><i class="fas fa-${meta.icon}"></i> ${escapeHtml(meta.label)} · ${escapeHtml(locality.name)}</span>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(countLabel(matches.length, meta))} from ${escapeHtml(developersText(matches))}. Prices ${escapeHtml(priceRangeText(matches))}.</p>
    <div class="page-hero-meta">
      <div class="page-hero-meta-item"><i class="fas fa-check-circle"></i> RERA Verified</div>
      <div class="page-hero-meta-item"><i class="fas fa-${meta.icon}"></i> ${matches.length} Listed</div>
      <div class="page-hero-meta-item"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(locality.name)}, Pune</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    ${aboutBlurb ? `<p class="loc-about">${escapeHtml(aboutBlurb)}</p>` : ''}

    <div class="loc-grid">${matches.map(renderProjectCard).join('')}</div>

    <div class="section-cta" style="margin-top:2.5rem">
      <a href="/projects?type=${encodeURIComponent(Object.keys(CATEGORY_META).find(k => CATEGORY_META[k] === meta))}&location=${encodeURIComponent(bucket)}" class="btn btn-outline btn-lg">See All ${escapeHtml(meta.label)} Filters <i class="fas fa-arrow-right"></i></a>
    </div>
  </div>
</section>

${locality.landmarks && Object.keys(locality.landmarks).length ? `
<section class="section section--tinted">
  <div class="container">
    <span class="section-label"><i class="fas fa-location-dot"></i> Connectivity</span>
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
    <h2 class="section-title">${escapeHtml(meta.label)} in ${escapeHtml(locality.name)} — Frequently Asked Questions</h2>
    <div class="ph-divider" style="width:36px;height:3px;background:var(--red);border-radius:2px;margin:10px 0 24px"></div>
    <div class="loc-faq-list">${faqAccordion(faqs)}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="loc-cta">
      <h3>Looking for ${escapeHtml(meta.lower)} in ${escapeHtml(locality.name)}?</h3>
      <p>Talk to a PROPHUNT advisor — free consultation, no pressure, just clarity on pricing &amp; the best projects.</p>
      <a href="/contact" class="btn btn-primary">Book a Free Consultation</a>
    </div>
  </div>
</section>

<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand"><a href="/" class="footer-logo"><img src="/images/logo-black.png" alt="PROPHUNT LLP"></a><div class="footer-tagline"><span class="sanskrit">भूमिं मृगयध्वम्</span><span class="translation">Hunt the Land</span></div><p class="footer-about-text">Pune's trusted real estate partner.</p><div class="footer-social"><a href="https://www.facebook.com/PropHuntLLP" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a><a href="https://www.instagram.com/prophunt_llp/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a><a href="https://www.linkedin.com/company/prophunt-llp/" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a><a href="https://wa.me/917447430431" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a></div></div>
      <div class="footer-col"><h5>Explore</h5><ul class="footer-links"><li><a href="/"><i class="fas fa-chevron-right"></i>Home</a></li><li><a href="/projects"><i class="fas fa-chevron-right"></i>All Projects</a></li><li><a href="/developers"><i class="fas fa-chevron-right"></i>Developers</a></li><li><a href="/services"><i class="fas fa-chevron-right"></i>Services</a></li><li><a href="/about"><i class="fas fa-chevron-right"></i>About Us</a></li><li><a href="/blog"><i class="fas fa-chevron-right"></i>Blog</a></li><li><a href="/contact"><i class="fas fa-chevron-right"></i>Contact</a></li></ul></div>
      <div class="footer-col"><h5>Browse</h5><ul class="footer-links"><li><a href="/apartments-in-wakad"><i class="fas fa-chevron-right"></i>Apartments in Wakad</a></li><li><a href="/apartments-in-baner"><i class="fas fa-chevron-right"></i>Apartments in Baner</a></li><li><a href="/projects.html?type=plot"><i class="fas fa-chevron-right"></i>Plots</a></li><li><a href="/privacy-policy"><i class="fas fa-chevron-right"></i>Privacy Policy</a></li><li><a href="/terms"><i class="fas fa-chevron-right"></i>Terms of Service</a></li></ul></div>
      <div class="footer-newsletter"><h5>Stay Updated</h5><p>Get market insights and new project alerts.</p><form class="newsletter-form" id="newsletterForm" novalidate><input type="email" name="newsletterEmail" placeholder="Your email" aria-label="Email" required><button type="submit" aria-label="Subscribe"><i class="fas fa-arrow-right"></i></button></form></div>
    </div>
    <hr class="divider" style="border-color:rgba(255,255,255,.08);">
    <div class="footer-rera" style="text-align:center;padding:.75rem 0;font-size:.78rem;color:rgba(255,255,255,.35);border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:.85rem;">MahaRERA Agent Registration No. <a href="/rera-disclosure" style="color:rgba(200,54,43,.7);font-weight:700;">A52100037156</a> &nbsp;|&nbsp; Registered under Real Estate (Regulation &amp; Development) Act, 2016 &nbsp;|&nbsp; <a href="https://maharera.mahaonline.gov.in" target="_blank" rel="noopener" style="color:rgba(255,255,255,.35);">maharera.mahaonline.gov.in <i class="fas fa-external-link-alt" style="font-size:.65rem;"></i></a></div>
    <div class="footer-bottom"><span>&copy; 2026 PROPHUNT LLP. All rights reserved.</span><span style="color:#C8362B;font-family:var(--font-head);">भूमिं मृगयध्वम् | Hunt the Land</span><div class="footer-bottom-links"><a href="/rera-disclosure">RERA</a><a href="/privacy-policy">Privacy</a><a href="/terms">Terms</a></div></div>
  </div>
</footer>

<button class="back-to-top" id="backToTop" aria-label="Back to top"><i class="fas fa-arrow-up"></i></button>
<a href="https://wa.me/917447430431" class="wa-float" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>

<script src="/js/nav.js"></script>
</body>
</html>
`;
}

const properties = JSON.parse(fs.readFileSync(path.join(ROOT, 'properties', 'posts.json'), 'utf8'));
const active = properties.filter(p => p.status !== 'sold-out');

let built = 0;
const generatedUrls = [];

Object.keys(CATEGORY_META).forEach(category => {
  const meta = CATEGORY_META[category];
  Object.keys(LOCALITY_CONTENT).forEach(bucket => {
    const matches = active.filter(p => p.category === category && p.micro_market === bucket);
    if (!matches.length) return;

    const locality = LOCALITY_CONTENT[bucket];
    const slug = `${meta.slug}-in-${bucket}`;
    const url  = `/${slug}`;

    const html = buildPage({ slug, url, meta, locality, bucket, matches });
    const outDir = path.join(ROOT, slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    generatedUrls.push(url);
    built++;
    console.log(`  → ${slug}/index.html (${matches.length} listing${matches.length === 1 ? '' : 's'})`);
  });
});

fs.writeFileSync(path.join(ROOT, 'scripts', '.locality-pages.json'), JSON.stringify(generatedUrls));
console.log(`Built ${built} locality browse pages`);

module.exports = { generatedUrls };
