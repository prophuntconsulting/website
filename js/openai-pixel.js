/* ChatGPT ads (OpenAI Ads) measurement pixel, from Ads Manager > Conversions.
 * Every page that includes this sends a page view; a page that includes it with
 * data-event="lead" (the lead thank-you pages) also records lead_created.
 * Add ?oaiq_debug=1 to a URL to see the pixel's own logging in the console.
 */
(function (w, d) {
  'use strict';
  var me = d.currentScript;
  !function (w, d, s, u) { if (w.oaiq) return; var q = function () { q.q.push(arguments); }; q.q = []; w.oaiq = q; var j = d.createElement(s); j.async = 1; j.src = u; var f = d.getElementsByTagName(s)[0]; f.parentNode.insertBefore(j, f); }(w, d, 'script', 'https://bzrcdn.openai.com/sdk/oaiq.min.js');

  oaiq('init', { pixelId: 'QA9T1B4Wwv6kxjVsRS3NJG', debug: /[?&]oaiq_debug=1/.test(w.location.search) });
  oaiq('measure', 'page_viewed', { type: 'contents', contents: [{ id: w.location.pathname, name: d.title.slice(0, 120) }] });

  // Keep the ad click id (oppref) for the server-side copy of a lead (js/landing-lead.js).
  var store = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };
  var oppref = new URLSearchParams(w.location.search).get('oppref');
  if (oppref) store('oaiq_oppref', oppref);

  if (me && me.dataset.event === 'lead') {
    // Same id /api/lead sent from the server for this lead, so OpenAI counts it once.
    var id = store('oaiq_lead_id') || 'lead_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    oaiq('measure', 'lead_created', { type: 'customer_action' }, { event_id: id });
    store('oaiq_lead_id', '');
  }
})(window, document);
