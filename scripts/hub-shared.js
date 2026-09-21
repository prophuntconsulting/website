/**
 * Shared scaffolding for the generated hub pages (location hubs, developer
 * hubs): head/nav/footer/styles boilerplate, the project card, and the small
 * formatting helpers they all use. Pure functions and constants only — no
 * file output happens on require.
 */

const SITE = 'https://www.prophuntllp.com';

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

function renderHubCard(p) {
  const icon = p.category === 'plot' ? 'map' : p.category === 'villa' ? 'home' : p.category === 'commercial' ? 'briefcase' : 'building';
  const stage = lifecycle(p);
  const statusBadge = p.status === 'sold-out'
    ? '<span class="badge badge-black" style="font-size:.68rem;padding:.2rem .55rem">Sold Out</span>'
    : `<span class="badge badge-outline" style="font-size:.68rem;padding:.2rem .55rem;background:rgba(255,255,255,.92)">${escapeHtml(stage.label)}</span>`;
  return `
    <a href="${p.url}" class="prop-card" aria-label="View Details: ${escapeHtml(p.title)}">
      <div class="prop-card-img">
        <div>${p.cover ? `<img src="${escapeHtml(p.thumb || p.cover)}" alt="${escapeHtml(p.title || '')}" width="600" height="372" loading="lazy" decoding="async">` : `<span class="prop-card-img-empty"><i class="fas fa-${icon}"></i></span>`}</div>
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
.loc-guide-list{margin:0;padding-left:1.2rem;line-height:2}
.loc-guide-list a{color:var(--red);font-weight:600}
.ph-snapshot{width:100%;border-collapse:collapse;font-size:14px;background:#fff;border:1px solid var(--gray-200);border-radius:var(--radius);overflow:hidden}
.ph-snapshot th,.ph-snapshot td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--gray-200);vertical-align:top;line-height:1.5}
.ph-snapshot tr:last-child td{border-bottom:0}
.ph-snapshot thead th{background:var(--gray-100);color:var(--gray-600);font-size:12px;letter-spacing:.5px;text-transform:uppercase}
.ph-snapshot td a{color:var(--red);font-weight:600}
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
          <a href="/projects/apartments" class="dropdown-link"><i class="fas fa-building"></i> Apartments</a>
          <a href="/projects/plots" class="dropdown-link"><i class="fas fa-map"></i> Plots</a><a href="/projects/villas" class="dropdown-link"><i class="fas fa-home"></i> Villas</a><a href="/projects/commercial" class="dropdown-link"><i class="fas fa-store"></i> Commercial</a>
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
      <div class="footer-col"><h5>Explore</h5><ul class="footer-links"><li><a href="/"><i class="fas fa-chevron-right"></i>Home</a></li><li><a href="/projects"><i class="fas fa-chevron-right"></i>All Projects</a></li><li><a href="/location"><i class="fas fa-chevron-right"></i>Browse by Location</a></li><li><a href="/developer"><i class="fas fa-chevron-right"></i>Browse by Developer</a></li><li><a href="/developers"><i class="fas fa-chevron-right"></i>Developers</a></li><li><a href="/services"><i class="fas fa-chevron-right"></i>Services</a></li><li><a href="/about"><i class="fas fa-chevron-right"></i>About Us</a></li><li><a href="/blog"><i class="fas fa-chevron-right"></i>Blog</a></li><li><a href="/contact"><i class="fas fa-chevron-right"></i>Contact</a></li></ul></div>
      <div class="footer-col"><h5>Browse</h5><ul class="footer-links"><li><a href="/apartments-in-wakad"><i class="fas fa-chevron-right"></i>Apartments in Wakad</a></li><li><a href="/apartments-in-baner"><i class="fas fa-chevron-right"></i>Apartments in Baner</a></li><li><a href="/projects/plots"><i class="fas fa-chevron-right"></i>Plots</a></li><li><a href="/privacy-policy"><i class="fas fa-chevron-right"></i>Privacy Policy</a></li><li><a href="/terms"><i class="fas fa-chevron-right"></i>Terms of Service</a></li></ul></div>
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
<style>${SHARED_STYLE}</style>
</head>
<body>
${NAV_HTML}
`;
}

// One canonical slug rule + threshold, shared by the developer-hub generator
// and build-properties.js (which tags each project with its hub URL).
const DEV_HUB_MIN = 2;
function developerSlug(name) {
  return String(name || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

module.exports = {
  SITE, CATEGORY_META, escapeHtml, priceLabel, fmtLakhCr, priceRangeText, developersText,
  lifecycle, renderHubCard, faqAccordion, SHARED_STYLE, NAV_HTML, FOOTER_HTML, headBoilerplate,
  DEV_HUB_MIN, developerSlug,
};
