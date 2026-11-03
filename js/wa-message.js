/**
 * PROPHUNT LLP — WhatsApp pre-filled messages.
 * Any WhatsApp link to us that has no message (?text=) gets one written for
 * the page it is on: the project, area, article or enquiry the visitor was
 * looking at, plus the page address so the advisor knows where the chat came
 * from. Links that already carry their own message are left alone.
 * Loaded by js/nav.js and js/landing-lead.js, so it runs on every page.
 */
(function () {
  'use strict';
  if (window.__phWaMessage) return;
  window.__phWaMessage = true;

  var WA = /^https?:\/\/(wa\.me|api\.whatsapp\.com|(www\.)?whatsapp\.com)\//i;
  var path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';

  function heading() {
    var h = document.querySelector('h1');
    if (!h) return '';
    var c = h.cloneNode(true);
    c.querySelectorAll('.sr-only, .visually-hidden, script, style').forEach(function (n) { n.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function titleName() {
    return (document.title || '').split(/\s[|:–—-]\s|,\s/)[0].trim();
  }

  function message() {
    var h = heading(), name = h || titleName(), m;
    if (/thank-you/.test(path)) {
      var project = (document.title || '').replace(/^Thank You\s*[-–:]\s*/i, '').split(/\s\|\s/)[0].trim();
      return 'Hi PROPHUNT, I just sent an enquiry' + (project && !/thank/i.test(project) ? ' for ' + project : '') + ' on your website. Please share the details.';
    }
    if ((m = path.match(/^\/projects\/([^/]+)(?:\/(\d[\d-]*-bhk))?$/)) && !/^(apartments|villas|plots|commercial)$/.test(m[1]))
      return 'Hi PROPHUNT, I\'m interested in ' + name + '. Please share the price, floor plans and availability.';
    if (/^\/blog\/[^/]+$/.test(path))
      return 'Hi PROPHUNT, I read your article "' + name + '" and have a question.';
    if (/stamp-duty-calculator/.test(path))
      return 'Hi PROPHUNT, I used your stamp duty calculator and have a question about the charges on my purchase.';
    if (path === '/' || /^\/(contact|about|services|blog|projects|developers|thank-you|rera-disclosure|privacy-policy|terms)$/.test(path))
      return 'Hi PROPHUNT, I\'d like help finding a property in Pune.';
    if (/^\/developers?\//.test(path) || /\/(location|developer)\//.test(path) || /-(in|near|on)-/.test(path) || /^\/projects\//.test(path))
      return 'Hi PROPHUNT, I\'m looking at ' + name + '. Please help me shortlist the right options.';
    // Landing pages and anything else: name what the page is about.
    return 'Hi PROPHUNT, I\'m interested in ' + name + '. Please share the details.';
  }

  var cached = null;
  function fill(a) {
    var href = a.getAttribute('href') || '';
    if (!WA.test(href)) return;
    var u;
    try { u = new URL(href); } catch (e) { return; }
    // Only chats to a number (not "share this page" links), and only when no message is set.
    var hasNumber = /\d{8,}/.test(u.pathname) || /\d{8,}/.test(u.searchParams.get('phone') || '');
    if (!hasNumber || (u.searchParams.get('text') || '').trim()) return;
    if (cached === null) cached = message() + '\n\n(' + location.host.replace(/^www\./, '') + path + ')';
    u.searchParams.set('text', cached);
    a.setAttribute('href', u.toString());
  }

  function fillAll(root) { (root || document).querySelectorAll('a[href]').forEach(fill); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { fillAll(); });
  else fillAll();
  // Links built after load (phone menu, pop-ups) are filled just before they open.
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) fill(a); }, true);
  document.addEventListener('pointerdown', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) fill(a); }, true);
})();
