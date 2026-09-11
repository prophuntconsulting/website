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

const SITE = 'https://www.prophuntllp.com';
const ROOT = path.join(__dirname, '..');

const CATEGORY_META = {
  apartment:  { label: 'Apartments',            lower: 'apartments',            icon: 'building',  slug: 'apartments' },
  plot:       { label: 'Plots',                 lower: 'plots',                 icon: 'map',       slug: 'plots' },
  villa:      { label: 'Villas',                lower: 'villas',                icon: 'home',      slug: 'villas' },
  commercial: { label: 'Commercial Properties', lower: 'commercial properties', icon: 'briefcase', slug: 'commercial-properties' },
};

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  const min = Math.min(...priced), max = Math.max(...priced);
  return min === max ? `around ${fmtLakhCr(min)}` : `from ${fmtLakhCr(min)} to ${fmtLakhCr(max)}`;
}

function developersText(matches) {
  const devs = [...new Set(matches.map(p => p.developer).filter(Boolean))];
  if (!devs.length) return 'leading Pune developers';
  if (devs.length <= 3) return devs.join(', ');
  return devs.slice(0, 3).join(', ') + ` and ${devs.length - 3} more`;
}

// New launches and under-construction lead the grid, same ordering logic
// as js/projects.js's default sort, plus a visible stage badge per card —
// the location hub is the one place all three lifecycle stages sit
// side by side, so it's worth labelling.
function lifecycle(p) {
  if (p.status === 'coming-soon') return { label: 'New Launch', weight: 0 };
  const tl = (p.tagline || '').toLowerCase();
  if (tl.includes('ready') || tl.includes('oc received')) return { label: 'Ready to Move', weight: 2 };
  return { label: 'Under Construction', weight: 1 };
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

function renderHubCard(p) {
  const icon = p.category === 'plot' ? 'map' : p.category === 'villa' ? 'home' : p.category === 'commercial' ? 'briefcase' : 'building';
  const stage = lifecycle(p);
  const statusBadge = p.status === 'sold-out'
    ? '<span class="badge badge-black" style="font-size:.68rem;padding:.2rem .55rem">Sold Out</span>'
    : `<span class="badge badge-outline" style="font-size:.68rem;padding:.2rem .55rem;background:rgba(255,255,255,.92)">${escapeHtml(stage.label)}</span>`;
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
  return faqs.map(f => `
    <details class="loc-faq-item">
      <summary>${escapeHtml(f.q)}</summary>
      <p>${escapeHtml(f.a)}</p>
    </details>`).join('');
}

const SHARED_STYLE = `
.loc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
@media(max-width:1024px){.loc-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.loc-grid{grid-template-columns:1fr}}
.loc-about{font-size:1.02rem;line-height:1.8;color:var(--gray-600);max-width:760px;margin-bottom:1.5rem}
.loc-note{font-size:.85rem;color:var(--gray-400);max-width:760px;margin-bottom:2.5rem}
.loc-cat-pills{display:flex;flex-wrap:wrap;gap:.6rem;margin-bottom:2rem}
.loc-cat-pill{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1rem;border:1.5px solid var(--gray-200);border-radius:999px;font-size:.82rem;font-weight:600;color:var(--gray-700);transition:border-color .2s,color .2s}
.loc-cat-pill:hover{border-color:var(--red);color:var(--red)}
.loc-cat-pill i{color:var(--red)}
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
.loc-sibling-pills{display:flex;flex-wrap:wrap;gap:.6rem}
.loc-sibling-pill{padding:.5rem 1.1rem;border:1.5px solid var(--gray-200);border-radius:999px;font-size:.82rem;font-weight:600;color:var(--gray-700);transition:border-color .2s,color .2s}
.loc-sibling-pill:hover{border-color:var(--red);color:var(--red)}
.loc-hub-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
@media(max-width:900px){.loc-hub-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.loc-hub-grid{grid-template-columns:1fr}}
.loc-hub-card{display:block;background:#fff;border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:1.75rem;transition:box-shadow .2s,transform .2s}
.loc-hub-card:hover{box-shadow:0 12px 32px rgba(0,0,0,.08);transform:translateY(-2px)}
.loc-hub-card h3{margin-bottom:.4rem}
.loc-hub-card p{font-size:.85rem;color:var(--gray-400)}
`;

const NAV_HTML = `
<nav class="navbar" id="navbar">
  <div class="nav-container">
    <a href="/" class="nav-logo"><img src="/images/logo-black.png" alt="PROPHUNT LLP" class="logo-black"></a>
    <ul class="nav-links">
      <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
      <li class="nav-item"><a href="/projects" class="nav-link">Projects <i class="fas fa-chevron-down chevron"></i></a>
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
      <li><a href="/projects" class="mobile-nav-link">Projects</a></li>
      <li><a href="/services" class="mobile-nav-link">Services</a></li>
      <li><a href="/about" class="mobile-nav-link">About</a></li>
      <li><a href="/blog" class="mobile-nav-link">Blog</a></li>
    </ul>
    <div class="mobile-menu-footer">
      <a href="/contact" class="btn btn-primary">Enquire Now</a>
      <a href="tel:+917066880808" class="btn btn-ghost">Call Us</a>
    </div>
  </div>
</div>`;

const FOOTER_HTML = `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand"><a href="/" class="footer-logo"><img src="/images/logo-black.png" alt="PROPHUNT LLP"></a><div class="footer-tagline"><span class="sanskrit">भूमिं मृगयध्वम्</span><span class="translation">Hunt the Land</span></div><p class="footer-about-text">Pune's trusted real estate partner.</p><div class="footer-social"><a href="https://www.facebook.com/PropHuntLLP" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a><a href="https://www.instagram.com/prophunt_llp/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a><a href="https://www.linkedin.com/company/prophunt-llp/" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a><a href="https://wa.me/917447430431" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a></div></div>
      <div class="footer-col"><h5>Explore</h5><ul class="footer-links"><li><a href="/"><i class="fas fa-chevron-right"></i>Home</a></li><li><a href="/projects"><i class="fas fa-chevron-right"></i>All Projects</a></li><li><a href="/location"><i class="fas fa-chevron-right"></i>Browse by Location</a></li><li><a href="/developers"><i class="fas fa-chevron-right"></i>Developers</a></li><li><a href="/services"><i class="fas fa-chevron-right"></i>Services</a></li><li><a href="/about"><i class="fas fa-chevron-right"></i>About Us</a></li><li><a href="/blog"><i class="fas fa-chevron-right"></i>Blog</a></li><li><a href="/contact"><i class="fas fa-chevron-right"></i>Contact</a></li></ul></div>
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

function headBoilerplate({ title, desc, canonical, jsonLd, ogImage }) {
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
<style>${SHARED_STYLE}</style>
</head>
<body>
${NAV_HTML}
`;
}

function buildHubPage({ bucket, locality, matches, todayLabel }) {
  const title = `Properties in ${locality.name}, Pune | PROPHUNT LLP`;
  const canonical = `${SITE}/location/${bucket}`;
  const desc = `${matches.length} verified projects in ${locality.name}, Pune from ${developersText(matches)}. Prices ${priceRangeText(matches)}. RERA-verified listings curated by PROPHUNT LLP.`;
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
    <p>${matches.length} verified projects from ${escapeHtml(developersText(matches))}. Prices ${escapeHtml(priceRangeText(matches))}.</p>
    <div class="page-hero-meta">
      <div class="page-hero-meta-item"><i class="fas fa-check-circle"></i> RERA Verified</div>
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
  const desc = `Browse PROPHUNT LLP's verified real estate listings across ${buckets.length} Pune micro-markets — Baner, Wakad, Mahalunge and more — with local FAQs, connectivity and pricing.`;

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
        <p>${matches.length} verified project${matches.length === 1 ? '' : 's'} · Prices ${escapeHtml(priceRangeText(matches))}</p>
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
