/**
 * Landing-page forms (/mahindra-citadel, /treetopia, /dlf-westpark-andheri-west)
 * point at Web3Forms. Instead of letting the browser post there (Web3Forms then
 * shows its own success page whenever it won't redirect, e.g. off our domain on
 * the free plan), this sends the form in the background, copies the lead to the
 * ArthaLeads CRM (/api/lead), and opens our own thank-you page (the form's
 * "redirect" field). If the background send fails, the form falls back to the
 * native post so the lead is never lost.
 * Page scripts that validate a form run first; a submit they block is skipped.
 */
(function () {
  'use strict';
  var forms = document.querySelectorAll('form[action*="api.web3forms.com"]');
  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener('submit', function (e) {
      if (e.defaultPrevented || form.dataset.nativeSubmit) return;
      var bot = form.querySelector('[name="botcheck"]');
      if (bot && bot.checked) { e.preventDefault(); return; }
      var val = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? String(el.value || '').trim() : ''; };
      var name = val('name'), phone = val('phone');
      if (!name || !phone) return;
      e.preventDefault();

      // CRM copy: one "Label: value" per line, so the CRM files each as its own field.
      var project = val('project');
      var payload = JSON.stringify({
        name: name, phone: phone, email: val('email'),
        message: [project && 'Project: ' + project, val('budget') && 'Budget: ' + val('budget'),
                  val('cta') && 'Enquiry from: ' + val('cta'), val('ad_source') && 'Ad source: ' + val('ad_source')].filter(Boolean).join('\n'),
        form_name: val('from_name') || ('Landing page' + (project ? ' - ' + project : '')),
        page_url: window.location.href
      });
      try {
        if (!(navigator.sendBeacon && navigator.sendBeacon('/api/lead', new Blob([payload], { type: 'application/json' }))))
          fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function () {});
      } catch (err) { /* CRM copy is best-effort; Web3Forms still gets the lead */ }

      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; if (!btn.dataset.label) btn.dataset.label = btn.textContent; btn.textContent = 'Sending...'; }
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'redirect' && k !== 'botcheck') data[k] = v; });
      var thanks = val('redirect');
      var native = function () { form.dataset.nativeSubmit = '1'; HTMLFormElement.prototype.submit.call(form); };
      fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok || d.success === false) throw new Error(d.message || 'send failed'); }); })
        .then(function () {
          if (!thanks) { if (btn) btn.textContent = 'Sent, we will call you soon'; return; }
          // Our thank-you pages live on www.prophuntllp.com; keep the visitor on this host (also on previews).
          try { var u = new URL(thanks); window.location.href = u.pathname + u.search; } catch (err) { window.location.href = thanks; }
        })
        .catch(native);
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
