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
})();
