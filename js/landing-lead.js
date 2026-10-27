/**
 * Landing-page forms (/mahindra-citadel, /treetopia) post natively to Web3Forms,
 * which emails the lead and redirects to the thank-you page. They never reached
 * the ArthaLeads CRM. This copies each submission to /api/lead as well, without
 * touching the native submit: sendBeacon survives the page navigating away.
 */
(function () {
  'use strict';
  var forms = document.querySelectorAll('form[action*="api.web3forms.com"]');
  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener('submit', function () {
      var bot = form.querySelector('[name="botcheck"]');
      if (bot && bot.checked) return;
      var val = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? String(el.value || '').trim() : ''; };
      var name = val('name'), phone = val('phone');
      if (!name || !phone) return;
      var project = val('project');
      var payload = JSON.stringify({
        name: name, phone: phone, email: val('email'),
        message: project ? 'Project: ' + project : '',
        form_name: val('from_name') || ('Landing page' + (project ? ' - ' + project : '')),
        page_url: window.location.href
      });
      try {
        if (navigator.sendBeacon && navigator.sendBeacon('/api/lead', new Blob([payload], { type: 'application/json' }))) return;
      } catch (e) { /* fall through to fetch */ }
      try {
        fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function () {});
      } catch (e) { /* CRM copy is best-effort; Web3Forms still gets the lead */ }
    });
  });

  // GA4: phone and WhatsApp taps count as leads (same events as js/nav.js).
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || typeof gtag !== 'function') return;
    var href = a.getAttribute('href');
    var name = /^tel:/i.test(href) ? 'phone_call'
      : /^https?:\/\/(wa\.me|api\.whatsapp\.com|(www\.)?whatsapp\.com)\//i.test(href) ? 'whatsapp_click' : '';
    if (!name) return;
    gtag('event', name, {
      link_url: href.split('?')[0],
      link_text: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 100),
      page_path: window.location.pathname,
      transport_type: 'beacon'
    });
  }, true);

  // GA4: forward the voice/chat widget's own events (same as js/nav.js).
  var WIDGET_ACTIONS = ['open', 'chat_opened', 'chat_message_sent', 'chat_ended', 'call_started', 'call_connected',
    'agent_joined', 'microphone_denied', 'consent_declined', 'post_call_cta_clicked', 'feedback_submitted', 'lead_submitted'];
  window.addEventListener('vistrow-widget', function (e) {
    var d = (e && e.detail) || {};
    if (typeof gtag !== 'function' || WIDGET_ACTIONS.indexOf(d.action) < 0) return;
    var params = { widget_mode: d.mode || '', page_path: window.location.pathname };
    if (d.rating) params.rating = d.rating;
    gtag('event', 'widget_' + d.action, params);
    if (d.action === 'lead_submitted') gtag('event', 'generate_lead', { form_name: 'Voice widget', page_path: window.location.pathname });
  });
})();
