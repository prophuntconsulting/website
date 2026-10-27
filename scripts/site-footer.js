/**
 * The one site footer. Every page gets exactly this markup: apply-footer.js
 * swaps it into static pages, templates and generated pages at the end of the
 * build, so a link added here appears everywhere and the footers cannot drift.
 */
const li = (href, label) => `<li><a href="${href}">${label}</a></li>`;

const SOCIAL = [
  ['https://www.facebook.com/PropHuntLLP', 'Facebook', 'fab fa-facebook-f'],
  ['https://www.instagram.com/prophunt_llp/', 'Instagram', 'fab fa-instagram'],
  ['https://www.linkedin.com/company/prophunt-llp/', 'LinkedIn', 'fab fa-linkedin-in'],
  ['https://www.youtube.com/channel/UCX9xvRLtAiDhEqrbSgl5IFg', 'YouTube', 'fab fa-youtube'],
  ['https://wa.me/917447430431', 'WhatsApp', 'fab fa-whatsapp'],
];

const FOOTER_HTML = `<footer class="footer" role="contentinfo">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" class="footer-logo"><img src="/images/logo-black.png" alt="PROPHUNT LLP" width="140" height="34" loading="lazy"></a>
        <div class="footer-tagline"><span class="sanskrit">भूमिं मृगयध्वम्</span><span class="translation">Hunt the Land</span></div>
        <p class="footer-about-text">MahaRERA-registered real estate advisors in Baner, Pune. We help buyers compare RERA-registered projects from trusted developers, at no cost to buyers.</p>
        <div class="footer-social">${SOCIAL.map(([href, label, icon]) => `<a href="${href}" target="_blank" rel="noopener" aria-label="${label}"><i class="${icon}"></i></a>`).join('')}</div>
      </div>
      <nav class="footer-col" aria-label="Explore"><h2 class="footer-h">Explore</h2><ul class="footer-links">${[
        li('/', 'Home'), li('/projects', 'All Projects'), li('/developers', 'Developers'), li('/services', 'Services'),
        li('/about', 'About Us'), li('/blog', 'Blog'), li('/contact', 'Contact'),
      ].join('')}</ul></nav>
      <nav class="footer-col" aria-label="Find a home"><h2 class="footer-h">Find a Home</h2><ul class="footer-links">${[
        li('/projects/apartments', 'Apartments'), li('/projects/plots', 'Plots'), li('/projects/villas', 'Villas'),
        li('/projects/commercial', 'Commercial'), li('/location', 'Browse by Location'), li('/developer', 'Browse by Developer'),
        li('/stamp-duty-calculator-pune', 'Stamp Duty Calculator'),
      ].join('')}</ul></nav>
      <nav class="footer-col footer-legal" aria-label="Legal"><h2 class="footer-h">Legal</h2><ul class="footer-links">${[
        li('/rera-disclosure', 'RERA Disclosure'), li('/privacy-policy', 'Privacy Policy'), li('/terms', 'Terms &amp; Conditions'),
      ].join('')}</ul></nav>
      <div class="footer-newsletter"><h2 class="footer-h">Stay Updated</h2><p>New launches, price updates and market insights, in your inbox.</p>
        <form class="newsletter-form" id="newsletterForm" novalidate><input type="email" name="newsletterEmail" placeholder="Your email" aria-label="Email address" required><button type="submit" aria-label="Subscribe"><i class="fas fa-arrow-right"></i></button></form>
        <h2 class="footer-h footer-subhead">Contact</h2><ul class="footer-contact-list">
          <li><i class="fas fa-phone" aria-hidden="true"></i><a href="tel:+917066880808">+91 70668 80808</a></li>
          <li><i class="fas fa-envelope" aria-hidden="true"></i><a href="mailto:info@prophuntllp.com">info@prophuntllp.com</a></li>
          <li><i class="fas fa-map-marker-alt" aria-hidden="true"></i><span>Work Katta, 291/3, Pancard Club Road, Baner, Pune 411069</span></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 PROPHUNT LLP. All rights reserved.</span>
      <span class="footer-rera">MahaRERA Agent Reg. No. <a href="/rera-disclosure">A52100037156</a> · <a href="https://maharera.maharashtra.gov.in" target="_blank" rel="noopener">maharera.maharashtra.gov.in</a></span>
    </div>
  </div>
</footer>`;

const FOOTER_RE = /<footer class="(?:footer|ph-footer)"[^>]*>[\s\S]*?<\/footer>/;

// Replace the page's footer with the site footer. Pages without one are returned unchanged.
function applyFooter(html) {
  return FOOTER_RE.test(html) ? html.replace(FOOTER_RE, FOOTER_HTML) : html;
}

module.exports = { FOOTER_HTML, applyFooter };
