/* Styled dropdowns for landing-page forms (/khopoli-plots, /new-projects-in-andheri-west).
 * Turns every <select data-dd> into a button plus an option list we can style (a native
 * select's open list can't be). The select stays in the form, hidden, and keeps the value,
 * so js/landing-lead.js and Web3Forms read it as before.
 * A required select blocks the send with a message until something is picked.
 * Code that sets select.value itself should dispatch a 'change' event so the label updates.
 */
(function () {
  'use strict';
  var css = '.dd{position:relative}' +
    '.dd-native{position:absolute!important;opacity:0!important;pointer-events:none!important;width:1px!important;height:1px!important;min-height:0!important;padding:0!important;border:0!important;left:0;bottom:0;overflow:hidden;clip:rect(0 0 0 0)}' +
    '.dd .dd-btn{width:100%;height:48px;display:flex;align-items:center;justify-content:space-between!important;gap:10px;padding:0 14px;border:1px solid var(--gray-400,#bbb);border-radius:var(--radius,8px);background:#fff;font:inherit;font-size:1rem;font-weight:600;color:var(--black,#111);text-align:left;cursor:pointer;transition:border-color .2s,box-shadow .2s}' +
    '.dd-btn:hover{border-color:var(--red,#C8362B)}' +
    '.dd-btn:focus-visible,.dd.open .dd-btn{outline:none;border-color:var(--red,#C8362B);box-shadow:0 0 0 3px rgba(200,54,43,.15)}' +
    '.dd-btn.dd-empty .dd-val{color:var(--gray-600,#666);font-weight:500}' +
    '.dd-chev{flex:none;width:16px;height:16px;transition:transform .2s;color:var(--red,#C8362B)}' +
    '.dd.open .dd-chev{transform:rotate(180deg)}' +
    '.dd-list{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:80;margin:0;padding:6px;list-style:none;background:#fff;border:1px solid #E4DED7;border-radius:12px;box-shadow:0 18px 40px rgba(17,17,17,.18);max-height:260px;overflow:auto;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .15s,transform .15s}' +
    '.dd.open .dd-list{opacity:1;transform:none;pointer-events:auto}' +
    // Opens inline, so a section with overflow:hidden (the hero) can't clip it.
    '.dd-list{position:relative;top:auto;margin-top:6px;display:none}.dd.open .dd-list{display:block}' +
    '.dd-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border-radius:8px;font-size:.95rem;font-weight:500;color:var(--black,#111);cursor:pointer}' +
    '.dd-opt:hover,.dd-opt.dd-active{background:#F6F2EE}' +
    '.dd-opt[aria-selected=true]{color:var(--red,#C8362B);font-weight:700}' +
    '.dd-opt[aria-selected=true]::after{content:"";width:6px;height:11px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(45deg) translateY(-2px)}' +
    '.dd-err[hidden]{display:none!important}' +
    '.dd-err{display:block;margin-top:6px;font-size:.82rem;font-weight:600;color:var(--red,#C8362B)}' +
    '.dd.dd-invalid .dd-btn{border-color:var(--red,#C8362B)}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var CHEV = '<svg class="dd-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  var n = 0;

  document.querySelectorAll('select[data-dd]').forEach(function (sel) {
    var id = 'dd' + (++n);
    var required = sel.required;
    sel.required = false; // a hidden required select can't show the browser's message; we show our own
    var placeholder = (sel.querySelector('option[value=""]') || {}).textContent || 'Select';
    var wrap = document.createElement('div'); wrap.className = 'dd';
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
    sel.classList.add('dd-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'dd-btn'; btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    btn.innerHTML = '<span class="dd-val"></span>' + CHEV;
    var list = document.createElement('ul'); list.className = 'dd-list'; list.id = id; list.setAttribute('role', 'listbox'); list.tabIndex = -1;
    var opts = [];
    Array.prototype.forEach.call(sel.options, function (o) {
      if (o.value === '' && o.disabled !== false) return;
      if (o.value === '') return; // the placeholder only shows on the button
      var li = document.createElement('li'); li.className = 'dd-opt'; li.setAttribute('role', 'option');
      li.dataset.v = o.value; li.textContent = o.textContent; li.id = id + '-' + opts.length;
      list.appendChild(li); opts.push(li);
    });
    var err = null;
    if (required) { err = document.createElement('span'); err.className = 'dd-err'; err.setAttribute('role', 'alert'); err.hidden = true; err.textContent = sel.dataset.err || 'Please choose an option.'; }
    wrap.appendChild(btn); wrap.appendChild(list); if (err) wrap.appendChild(err);
    var label = wrap.closest('label');
    if (label) { // clicks on the label text should open the list, not focus the hidden select
      label.addEventListener('click', function (e) { if (e.target === label || e.target.tagName === 'SPAN' && !wrap.contains(e.target)) { e.preventDefault(); btn.focus(); } });
      var lid = id + '-l'; var span = label.querySelector(':scope > span') ; if (span) { span.id = lid; btn.setAttribute('aria-labelledby', lid + ' ' + id + '-v'); }
    }
    btn.querySelector('.dd-val').id = id + '-v';

    var active = -1;
    function sync() {
      var o = sel.options[sel.selectedIndex];
      var empty = !sel.value;
      btn.querySelector('.dd-val').textContent = empty ? placeholder : o.textContent;
      btn.classList.toggle('dd-empty', empty);
      opts.forEach(function (li) { li.setAttribute('aria-selected', li.dataset.v === sel.value ? 'true' : 'false'); });
      if (!empty && err) { err.hidden = true; wrap.classList.remove('dd-invalid'); }
    }
    function setActive(i) {
      opts.forEach(function (li) { li.classList.remove('dd-active'); });
      active = Math.max(0, Math.min(opts.length - 1, i));
      if (opts[active]) { opts[active].classList.add('dd-active'); opts[active].scrollIntoView({ block: 'nearest' }); btn.setAttribute('aria-activedescendant', opts[active].id); }
    }
    function open() {
      document.querySelectorAll('.dd.open').forEach(function (d) { if (d !== wrap) d.querySelector('.dd-btn').click(); });
      wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      var cur = opts.findIndex(function (li) { return li.dataset.v === sel.value; });
      setActive(cur < 0 ? 0 : cur);
    }
    function close() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-activedescendant'); }
    function pick(i) {
      if (!opts[i]) return;
      sel.value = opts[i].dataset.v;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      close(); btn.focus();
    }
    btn.addEventListener('click', function () { wrap.classList.contains('open') ? close() : open(); });
    list.addEventListener('click', function (e) { var li = e.target.closest('.dd-opt'); if (li) pick(opts.indexOf(li)); });
    list.addEventListener('mousemove', function (e) { var li = e.target.closest('.dd-opt'); if (li) setActive(opts.indexOf(li)); });
    btn.addEventListener('keydown', function (e) {
      var isOpen = wrap.classList.contains('open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!isOpen) open(); else setActive(active + (e.key === 'ArrowDown' ? 1 : -1)); }
      else if ((e.key === 'Enter' || e.key === ' ') && isOpen) { e.preventDefault(); pick(active); }
      else if (e.key === 'Escape' && isOpen) { e.preventDefault(); close(); }
      else if (e.key === 'Tab' && isOpen) close();
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
    sel.addEventListener('change', sync);
    sync();

    if (required && sel.form) {
      sel.form.addEventListener('submit', function (e) {
        if (sel.value) return;
        e.preventDefault(); e.stopImmediatePropagation();
        err.hidden = false; wrap.classList.add('dd-invalid');
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function () { btn.focus({ preventScroll: true }); }, 300);
      }, true);
    }
  });
})();
