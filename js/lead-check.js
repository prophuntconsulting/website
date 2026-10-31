/**
 * PROPHUNT LLP — lead field checks.
 * Stops fake or mistyped phone numbers and junk names before a lead form is
 * sent. Runs on every form that has a name="phone" field: it listens for
 * submit in the capture phase, so it runs before the page's own handlers and
 * before the native post, and blocks both when a field is wrong.
 * A form that shows its own errors adds data-lead-check="own" and calls
 * window.phLeadCheck.phone() / .name() itself.
 * api/lead.js applies the same phone rules on the server.
 */
(function () {
  'use strict';

  var JUNK_NAMES = /^(test|testing|tester|asdf|asd|qwerty|abc|abcd|xyz|na|n\/a|none|nil|fake|dummy|sample|hello|hi|hey|user|name|no name|aaa|xxx)$/i;
  var RUNS = '01234567890123456789 98765432109876543210';

  // Returns { ok, value, msg }. value is the number as +<country><number>.
  function phone(raw) {
    var s = String(raw || '').trim();
    var plus = /^\+/.test(s) || /^00/.test(s.replace(/[\s().-]/g, ''));
    var d = s.replace(/\D/g, '');
    if (/^00/.test(d)) d = d.slice(2);
    var bad = { ok: false, msg: 'Please enter a valid 10-digit mobile number. For a number outside India, start with + and the country code.' };
    if (!d) return { ok: false, msg: 'Please enter your mobile number.' };

    var indian = !plus || /^91\d{10}$/.test(d);
    if (indian) {
      if (plus) d = d.slice(2);
      else if (d.length === 12 && d.slice(0, 2) === '91') d = d.slice(2);
      else if (d.length === 11 && d[0] === '0') d = d.slice(1);
      if (!/^[6-9]\d{9}$/.test(d)) return bad;
      if (junkDigits(d)) return { ok: false, msg: 'That number doesn\'t look real. Please enter your mobile number.' };
      return { ok: true, value: '+91' + d };
    }
    // International: E.164, 8 to 15 digits including the country code.
    if (!/^[1-9]\d{7,14}$/.test(d) || Object.keys(d.slice(-8).split('').reduce(function (o, c) { o[c] = 1; return o; }, {})).length <= 2) return bad;
    return { ok: true, value: '+' + d };
  }

  // Same digit throughout, two digits alternating, or a straight run like 9876543210.
  function junkDigits(d) {
    var distinct = {};
    for (var i = 0; i < d.length; i++) distinct[d[i]] = 1;
    return Object.keys(distinct).length <= 2 || RUNS.indexOf(d) >= 0;
  }

  function name(raw) {
    var s = String(raw || '').replace(/\s+/g, ' ').trim();
    var letters = (s.match(/\p{L}/gu) || []).length;
    if (letters < 2) return { ok: false, msg: 'Please enter your name.' };
    if (!/^[\p{L}\p{M} .'-]+$/u.test(s) || JUNK_NAMES.test(s) || /^(\p{L})\1+$/u.test(s.replace(/[ .'-]/g, '').toLowerCase()))
      return { ok: false, msg: 'Please enter your real name.' };
    return { ok: true, value: s };
  }

  window.phLeadCheck = { phone: phone, name: name };

  // Generic error display for forms without their own.
  function showError(input, msg) {
    var err = input.nextElementSibling && input.nextElementSibling.classList.contains('lc-err') ? input.nextElementSibling : null;
    if (!err) {
      err = document.createElement('span');
      err.className = 'lc-err';
      err.setAttribute('role', 'alert');
      err.style.cssText = 'display:block;margin:4px 0 8px;font-size:13px;line-height:1.4;color:#B42318;text-align:left';
      input.insertAdjacentElement('afterend', err);
    }
    err.textContent = msg;
    input.setAttribute('aria-invalid', 'true');
    input.style.borderColor = '#B42318';
  }
  function clearError(input) {
    var err = input.nextElementSibling;
    if (err && err.classList.contains('lc-err')) err.remove();
    input.removeAttribute('aria-invalid');
    input.style.borderColor = '';
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.dataset.leadCheck === 'own') return;
    var tel = form.querySelector('[name="phone"]');
    if (!tel) return;
    var nm = form.querySelector('[name="name"], [name="firstName"], [name="contactPerson"]');
    var checks = [[tel, phone(tel.value)]];
    if (nm && nm.type !== 'hidden') checks.unshift([nm, name(nm.value)]);
    var first = null;
    checks.forEach(function (c) {
      if (c[1].ok) { clearError(c[0]); return; }
      showError(c[0], c[1].msg);
      if (!first) first = c[0];
    });
    if (first) {
      e.preventDefault();
      e.stopImmediatePropagation();
      first.focus();
    }
  }, true);

  document.addEventListener('input', function (e) {
    if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') clearError(e.target);
  });
})();
