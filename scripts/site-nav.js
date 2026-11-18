/**
 * The single site navigation (desktop bar + mobile menu), like site-footer.js.
 * scripts/apply-nav.js swaps it into every page during `npm run build`, so the
 * static pages, templates and generated pages can't drift apart. Each page keeps
 * its own opening <nav> tag (some use the white "nav-white" variant); everything
 * inside it, and the mobile menu after it, comes from here.
 */

const WA = 'https://wa.me/917447430431?text=Hi+PROPHUNT%2C+I%27d+like+help+finding+a+property+in+Pune.%0A%0A%28prophuntllp.com%29';

// Which top-level item to highlight for a URL path.
function sectionFor(urlPath) {
  const p = (urlPath || '/').replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  if (p === '/') return '/';
  if (/^\/(developers|developer)(\/|$)/.test(p)) return '/developers';
  if (/^\/services(\/|$)/.test(p)) return '/services';
  if (/^\/about(\/|$)/.test(p)) return '/about';
  if (/^\/(blog|stamp-duty-calculator-pune)(\/|$)/.test(p)) return '/blog';
  if (/^\/contact(\/|$)/.test(p)) return '/contact';
  if (/^\/(privacy-policy|terms|rera-disclosure)$/.test(p)) return '';
  // Projects, categories, area, BHK and landmark pages all sit under Projects.
  return '/projects';
}

function navInner(active) {
  const a = href => (href === active ? ' active' : '');
  return `
  <div class="nav-container">
    <a href="/" class="nav-logo" aria-label="PROPHUNT LLP Home">
      <img src="/images/logo-black.png" alt="PROPHUNT LLP" class="logo-black">
    </a>
    <ul class="nav-links" role="list">
      <li class="nav-item"><a href="/" class="nav-link${a('/')}">Home</a></li>
      <li class="nav-item">
        <a href="/projects" class="nav-link${a('/projects')}">Projects <i class="fas fa-chevron-down chevron"></i></a>
        <div class="dropdown" role="menu">
          <a href="/projects" class="dropdown-link" role="menuitem"><i class="fas fa-th"></i> All Projects</a>
          <a href="/projects/apartments" class="dropdown-link" role="menuitem"><i class="fas fa-building"></i> Apartments</a>
          <a href="/projects/plots" class="dropdown-link" role="menuitem"><i class="fas fa-map"></i> Plots</a>
          <a href="/projects/villas" class="dropdown-link" role="menuitem"><i class="fas fa-home"></i> Villas</a>
          <a href="/projects/commercial" class="dropdown-link" role="menuitem"><i class="fas fa-store"></i> Commercial</a>
        </div>
      </li>
      <li class="nav-item"><a href="/developers" class="nav-link${a('/developers')}">Developers</a></li>
      <li class="nav-item"><a href="/services" class="nav-link${a('/services')}">Services</a></li>
      <li class="nav-item"><a href="/about" class="nav-link${a('/about')}">About</a></li>
      <li class="nav-item"><a href="/blog" class="nav-link${a('/blog')}">Blog</a></li>
      <li class="nav-item"><a href="/contact" class="nav-link${a('/contact')}">Contact</a></li>
    </ul>
    <div class="nav-actions">
      <a href="tel:+917066880808" class="nav-phone" aria-label="Call us"><i class="fas fa-phone"></i> +91 70668 80808</a>
      <a href="/contact" class="btn btn-primary btn-sm">Book a Site Visit</a>
      <button class="hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
`;
}

function mobileMenu(active) {
  const a = href => (href === active ? ' active' : '');
  return `<div class="mobile-menu" id="mobileMenu" role="dialog" aria-label="Mobile navigation">
  <div class="mobile-menu-inner">
    <ul class="mobile-nav-links">
      <li><a href="/" class="mobile-nav-link${a('/')}">Home</a></li>
      <li>
        <a href="/projects" class="mobile-nav-link${a('/projects')}">Projects</a>
        <div class="mobile-sub">
          <a href="/projects/apartments" class="mobile-sub-link">Apartments</a>
          <a href="/projects/plots" class="mobile-sub-link">Plots</a>
          <a href="/projects/villas" class="mobile-sub-link">Villas</a>
          <a href="/projects/commercial" class="mobile-sub-link">Commercial</a>
        </div>
      </li>
      <li><a href="/developers" class="mobile-nav-link${a('/developers')}">Developers</a></li>
      <li><a href="/services" class="mobile-nav-link${a('/services')}">Services</a></li>
      <li><a href="/about" class="mobile-nav-link${a('/about')}">About</a></li>
      <li><a href="/blog" class="mobile-nav-link${a('/blog')}">Blog</a></li>
      <li><a href="/contact" class="mobile-nav-link${a('/contact')}">Contact</a></li>
    </ul>
    <div class="mobile-menu-footer">
      <a href="/contact" class="btn btn-primary">Book a Site Visit</a>
      <a href="tel:+917066880808" class="btn btn-ghost">Call Us</a>
      <div class="mobile-contact-info">
        <a href="tel:+917066880808"><i class="fas fa-phone"></i> +91 70668 80808</a>
        <a href="mailto:info@prophuntllp.com"><i class="fas fa-envelope"></i> info@prophuntllp.com</a>
        <a href="${WA}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp Us</a>
      </div>
    </div>
  </div>
</div>`;
}

// Full block for generators that write the nav themselves (hub-shared.js).
function navHtml(urlPath) {
  const active = sectionFor(urlPath);
  return `<nav class="navbar" id="navbar" role="navigation" aria-label="Main navigation">${navInner(active)}</nav>\n${mobileMenu(active)}\n`;
}

// End index of the <div> that starts at `start`, counting nested divs.
function divEnd(html, start) {
  const re = /<div\b|<\/div>/g; re.lastIndex = start; let depth = 0, m;
  while ((m = re.exec(html))) { depth += m[0] === '</div>' ? -1 : 1; if (depth === 0) return m.index + 6; }
  return -1;
}

// Replace the site navbar (inside of the page's own <nav class="navbar ..."> tag) and its mobile menu.
function applyNav(html, urlPath) {
  const open = html.match(/<nav class="navbar(?: nav-white)?"[^>]*\bid="navbar"[^>]*>/);
  if (!open) return html;
  const start = open.index, innerStart = start + open[0].length;
  const end = html.indexOf('</nav>', innerStart);
  if (end < 0) return html;
  const active = sectionFor(urlPath);
  let tag = open[0];
  if (!/\brole=/.test(tag)) tag = tag.replace(/>$/, ' role="navigation">');
  if (!/aria-label=/.test(tag)) tag = tag.replace(/>$/, ' aria-label="Main navigation">');
  let out = html.slice(0, start) + tag + navInner(active) + html.slice(end);
  const afterNav = out.indexOf('</nav>', start) + 6;
  const mm = out.indexOf('<div class="mobile-menu"', afterNav);
  // The mobile menu normally follows the nav (often after a comment); only touch it if it's close by.
  if (mm >= 0 && mm - afterNav < 400) {
    const mEnd = divEnd(out, mm);
    if (mEnd > 0) out = out.slice(0, mm) + mobileMenu(active) + out.slice(mEnd);
  } else {
    out = out.slice(0, afterNav) + '\n' + mobileMenu(active) + out.slice(afterNav);
  }
  return out;
}

module.exports = { navHtml, applyNav, sectionFor };
