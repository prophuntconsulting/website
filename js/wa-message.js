/**
 * PROPHUNT LLP — WhatsApp pre-filled messages.
 * Any WhatsApp link to us that has no message (?text=) gets one written for
 * the page it is on: the project, area, article or enquiry the visitor was
 * looking at, plus the page address so the advisor knows where the chat came
 * from. Links that already carry their own message are left alone.
 *
 * The build (scripts/wa-prefill.js) writes these messages into every page's
 * links using waMessageFor() below; in the browser this file (loaded by
 * js/nav.js and js/landing-lead.js) fills any link the HTML didn't have, such
 * as the phone menu and pop-ups built by script.
 */
(function (root) {
  'use strict';

  // path: "/projects/nyati-emerald"; heading: the page's H1 text; title: <title> text.
  function waMessageFor(path, heading, title) {
    path = String(path || '/').replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    var titleName = String(title || '').split(/\s[|:–—-]\s|,\s/)[0].trim();
    var name = heading || titleName, m;
    if (/thank-you/.test(path)) {
      var project = String(title || '').replace(/^Thank You\s*[-–:]\s*/i, '').split(/\s\|\s/)[0].trim();
      return 'Hi PROPHUNT, I just sent an enquiry' + (project && !/thank/i.test(project) ? ' for ' + project : '') + ' on your website. Please share the details.';
    }
    if ((m = path.match(/^\/projects\/([^/]+)(?:\/(\d[\d-]*-bhk))?$/)) && !/^(apartments|villas|plots|commercial)$/.test(m[1]))
      return 'Hi PROPHUNT, I\'m interested in ' + name + '. Please share the price, floor plans and availability.';
    if (/^\/blog\/[^/]+$/.test(path))
      return 'Hi PROPHUNT, I read your article "' + name + '" and have a question.';
    if (/stamp-duty-calculator/.test(path))
      return 'Hi PROPHUNT, I used your stamp duty calculator and have a question about the charges on my purchase.';
    if (path === '/' || /^\/(contact|about|services|blog|projects|developers|thank-you|rera-disclosure|privacy-policy|terms|404)$/.test(path))
      return 'Hi PROPHUNT, I\'d like help finding a property in Pune.';
    if (/^\/developers?\//.test(path) || /\/(location|developer)\//.test(path) || /-(in|near|on)-/.test(path) || /^\/projects\//.test(path))
      return 'Hi PROPHUNT, I\'m looking at ' + name + '. Please help me shortlist the right options.';
    // Landing pages and anything else: name what the page is about.
    return 'Hi PROPHUNT, I\'m interested in ' + name + '. Please share the details.';
  }

  // Full text for a link: the message plus the page address.
  function waTextFor(path, heading, title) {
    var p = String(path || '/').replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    return waMessageFor(path, heading, title) + '\n\n(prophuntllp.com' + (p === '/' ? '' : p) + ')';
  }

  var WA = /^https?:\/\/(wa\.me|api\.whatsapp\.com|(www\.)?whatsapp\.com)\//i;
  // Returns the href with ?text= added, or null when it is not a chat to a number or already has a message.
  function withText(href, text) {
    if (!WA.test(href)) return null;
    var u;
    try { u = new URL(href.replace(/&amp;/g, '&')); } catch (e) { return null; }
    var hasNumber = /\d{8,}/.test(u.pathname) || /\d{8,}/.test(u.searchParams.get('phone') || '');
    if (!hasNumber || (u.searchParams.get('text') || '').trim()) return null;
    u.searchParams.set('text', text);
    return u.toString();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { waMessageFor: waMessageFor, waTextFor: waTextFor, withText: withText };
    return;
  }

  // ── Browser ──
  if (root.__phWaMessage) return;
  root.__phWaMessage = true;
  var doc = root.document;

  function heading() {
    var h = doc.querySelector('h1');
    if (!h) return '';
    var c = h.cloneNode(true);
    c.querySelectorAll('.sr-only, .visually-hidden, script, style').forEach(function (n) { n.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  var cached = null;
  function fill(a) {
    if (cached === null) cached = waTextFor(root.location.pathname, heading(), doc.title);
    var next = withText(a.getAttribute('href') || '', cached);
    if (next) a.setAttribute('href', next);
  }
  function fillAll() { doc.querySelectorAll('a[href]').forEach(fill); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fillAll);
  else fillAll();
  // Links built after load (phone menu, pop-ups) are filled just before they open.
  ['pointerdown', 'click'].forEach(function (ev) {
    doc.addEventListener(ev, function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) fill(a); }, true);
  });
})(typeof window !== 'undefined' ? window : this);
