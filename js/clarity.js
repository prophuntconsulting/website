/* Microsoft Clarity (project "Prophunt LLP", vv2dibcfgy): session recordings and heatmaps.
 * Tags each session with its ad source (utm_source, utm_campaign, utm_content) so
 * ChatGPT ad visitors can be filtered in Clarity under Filters > Custom tags.
 */
(function (c, l, a, r, i, t, y) {
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
  y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
})(window, document, 'clarity', 'script', 'vv2dibcfgy');

(function () {
  var q = new URLSearchParams(window.location.search), saved = {};
  try { saved = JSON.parse(sessionStorage.getItem('ph_utm') || '{}'); } catch (e) { /* storage blocked */ }
  ['utm_source', 'utm_campaign', 'utm_content'].forEach(function (k) {
    var v = q.get(k) || saved[k];
    if (!v) return;
    saved[k] = v;
    window.clarity('set', k, v);
  });
  try { sessionStorage.setItem('ph_utm', JSON.stringify(saved)); } catch (e) { /* storage blocked */ }
  if (/thank-you/.test(window.location.pathname)) window.clarity('event', 'lead_submitted');
})();
