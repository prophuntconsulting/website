/**
 * Build script: generates top-level project category pages:
 * /projects/apartments, /projects/villas, /projects/plots, /projects/commercial
 *
 * These pages give search engines canonical, crawlable category URLs instead
 * of relying on query-string filters such as /projects.html?type=commercial.
 */

const fs = require('fs');
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
    intro: 'Compare verified apartment projects across Pune micro-markets including Baner, Wakad, Mahalunge, Pimpri-Chinchwad and Sinhagad Road.',
  },
  villa: {
    slug: 'villas',
    label: 'Villas',
    lower: 'villas',
    singular: 'villa',
    icon: 'home',
    intro: 'Explore limited villa and row-house opportunities listed by PROPHUNT LLP, with configuration, pricing and project context in one place.',
  },
  plot: {
    slug: 'plots',
    label: 'Plots',
    lower: 'plots',
    singular: 'plot',
    icon: 'map',
    intro: 'Browse curated plotted development and weekend-home opportunities around Pune, Khopoli and Karjat with advisory support before booking.',
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
    <a href="${escapeHtml(p.url)}" class="prop-card" aria-label="View Details: ${escapeHtml(p.title)}">
      <div class="prop-card-img">
        <div style="background-image:url('${escapeHtml(p.cover || '')}');">${p.cover ? '' : `<span class="prop-card-img-empty"><i class="fas fa-${meta.icon}"></i></span>`}</div>
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

function buildPage(category, matches) {
  const meta = CATEGORY_META[category];
  const sorted = [...matches].sort((a, b) => statusWeight(a) - statusWeight(b) || String(a.title).localeCompare(String(b.title)));
  const url = `/projects/${meta.slug}`;
  const canonical = `${SITE}${url}`;
  const title = `${meta.label} in Pune | PROPHUNT LLP`;
  const desc = `Browse ${sorted.length} verified ${meta.lower} in Pune from ${developersText(sorted)}. Prices ${priceRangeText(sorted)} with RERA-aware advisory from PROPHUNT LLP.`;
  const ogImage = sorted[0] && sorted[0].cover ? (sorted[0].cover.startsWith('http') ? sorted[0].cover : SITE + sorted[0].cover) : SITE + '/images/og-home.jpg';
  const faqs = [
    {
      q: `How many ${meta.lower} does PROPHUNT LLP list in Pune?`,
      a: `PROPHUNT LLP currently lists ${sorted.length} verified ${sorted.length === 1 ? meta.singular : meta.lower} in this category. Availability and pricing can change, so confirm the latest status before shortlisting.`,
    },
    {
      q: `What is the price range for ${meta.lower} in Pune?`,
      a: `${meta.label} listed here are priced ${priceRangeText(sorted)}. Final pricing, payment plans and offers should be confirmed with the developer and your PROPHUNT advisor.`,
    },
    {
      q: `Which developers are active in this category?`,
      a: `${meta.label} in this category include projects from ${developersText(sorted)}.`,
    },
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
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YR6CRE6BNN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YR6CRE6BNN');
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&family=Rubik:wght@400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet"></noscript>
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></noscript>
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/pages.css">
<style>
.cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
@media(max-width:1024px){.cat-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.cat-grid{grid-template-columns:1fr}}
.cat-intro{font-size:1.02rem;line-height:1.8;color:var(--gray-600);max-width:780px;margin-bottom:1rem}
.cat-note{font-size:.9rem;line-height:1.7;color:var(--gray-500);max-width:780px;margin-bottom:2.5rem}
.loc-faq-list{max-width:760px}
.loc-faq-item{border-bottom:1px solid var(--gray-200);padding:16px 2px}
.loc-faq-item:last-child{border-bottom:none}
.loc-faq-item summary{font-family:var(--font-head);font-size:14.5px;font-weight:700;color:var(--black);cursor:pointer;list-style:none}
.loc-faq-item summary::-webkit-details-marker{display:none}
.loc-faq-item summary::after{content:'+';float:right;color:var(--red);font-weight:700}
.loc-faq-item[open] summary::after{content:'-'}
.loc-faq-item p{margin-top:10px;font-size:13.5px;color:var(--gray-600);line-height:1.7}
</style>
</head>
<body>
<nav class="navbar" id="navbar">
  <div class="nav-container">
    <a href="/" class="nav-logo"><img src="/images/logo-black.png" alt="PROPHUNT LLP"></a>
    <div class="nav-menu">
      <a href="/" class="nav-link">Home</a>
      <a href="/projects" class="nav-link active">Projects</a>
      <a href="/services" class="nav-link">Services</a>
      <a href="/about" class="nav-link">About</a>
      <a href="/blog" class="nav-link">Blog</a>
      <a href="/contact" class="nav-link">Contact</a>
    </div>
    <a href="/contact" class="btn btn-primary nav-cta">Book a Site Visit</a>
    <button class="mobile-toggle" id="mobileToggle" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <div class="mobile-menu-overlay" id="mobileOverlay"></div>
  <div class="mobile-menu-panel">
    <div class="mobile-menu-header"><img src="/images/logo-black.png" alt="PROPHUNT LLP"><button class="mobile-close" id="mobileClose"><i class="fas fa-times"></i></button></div>
    <div class="mobile-menu-links"><a href="/" class="mobile-nav-link">Home</a><a href="/projects" class="mobile-nav-link active">Projects</a><a href="/services" class="mobile-nav-link">Services</a><a href="/about" class="mobile-nav-link">About</a><a href="/blog" class="mobile-nav-link">Blog</a><a href="/contact" class="mobile-nav-link">Contact</a></div>
    <div class="mobile-menu-footer"><a href="/contact" class="btn btn-primary">Enquire Now</a><a href="tel:+917066880808" class="btn btn-ghost">Call Us</a></div>
  </div>
</div>

<section class="page-hero">
  <div class="container page-hero-inner">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><a href="/projects">Projects</a><span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span><span class="current">${escapeHtml(meta.label)}</span></nav>
    <span class="section-label"><i class="fas fa-${meta.icon}"></i> Project Category</span>
    <h1>${escapeHtml(meta.label)} in Pune</h1>
    <p>${sorted.length} verified ${sorted.length === 1 ? meta.singular : meta.lower} from ${escapeHtml(developersText(sorted))}. Prices ${escapeHtml(priceRangeText(sorted))}.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <p class="cat-intro">${escapeHtml(meta.intro)}</p>
    <p class="cat-note">Pricing, configuration, possession, offers and availability are subject to developer confirmation and buyer verification. Use these category pages as a shortlisting layer before comparing individual project pages.</p>
    <div class="cat-grid">${sorted.map(renderProjectCard).join('')}</div>
  </div>
</section>

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

<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand"><a href="/" class="footer-logo"><img src="/images/logo-black.png" alt="PROPHUNT LLP"></a><div class="footer-tagline"><span class="sanskrit">भूमिं मृगयध्वम्</span><span class="translation">Hunt the Land</span></div><p class="footer-about-text">Pune's trusted real estate partner.</p></div>
      <div class="footer-col"><h5>Explore</h5><ul class="footer-links"><li><a href="/"><i class="fas fa-chevron-right"></i>Home</a></li><li><a href="/projects"><i class="fas fa-chevron-right"></i>All Projects</a></li><li><a href="/location"><i class="fas fa-chevron-right"></i>Browse by Location</a></li><li><a href="/developers"><i class="fas fa-chevron-right"></i>Developers</a></li><li><a href="/services"><i class="fas fa-chevron-right"></i>Services</a></li><li><a href="/about"><i class="fas fa-chevron-right"></i>About Us</a></li><li><a href="/blog"><i class="fas fa-chevron-right"></i>Blog</a></li><li><a href="/contact"><i class="fas fa-chevron-right"></i>Contact</a></li></ul></div>
      <div class="footer-col"><h5>Browse</h5><ul class="footer-links"><li><a href="/projects/apartments"><i class="fas fa-chevron-right"></i>Apartments</a></li><li><a href="/projects/villas"><i class="fas fa-chevron-right"></i>Villas</a></li><li><a href="/projects/plots"><i class="fas fa-chevron-right"></i>Plots</a></li><li><a href="/projects/commercial"><i class="fas fa-chevron-right"></i>Commercial</a></li></ul></div>
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
  fs.writeFileSync(path.join(outDir, 'index.html'), buildPage(category, matches));
  generatedUrls.push(`/projects/${meta.slug}`);
  console.log(`  → projects/${meta.slug}/index.html (${matches.length} listing${matches.length === 1 ? '' : 's'})`);
});

fs.writeFileSync(path.join(ROOT, 'scripts', '.category-pages.json'), JSON.stringify(generatedUrls));
console.log(`Built ${generatedUrls.length} top-level category pages`);
