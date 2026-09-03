/**
 * PROPHUNT LLP — Custom Select
 * Progressive enhancement over native <select> elements so every
 * dropdown's open list is styled consistently instead of showing the
 * browser/OS default. The original <select> stays in the DOM (hidden),
 * so any existing code that reads its .value or listens for "change"
 * keeps working — no other file needs to change.
 */
(function () {
    'use strict';

    function enhance(select) {
        if (select.dataset.csEnhanced || select.multiple) return;
        select.dataset.csEnhanced = '1';

        const parent = select.parentNode;
        const parentWidth = parent.getBoundingClientRect().width;
        const selectWidth = select.getBoundingClientRect().width;
        const isBlock = parentWidth > 0 && selectWidth >= parentWidth * 0.85;

        const wrap = document.createElement('div');
        wrap.className = 'cs-select' + (isBlock ? ' cs-block' : '');
        parent.insertBefore(wrap, select);
        wrap.appendChild(select);

        select.classList.add('cs-native');
        select.setAttribute('tabindex', '-1');
        select.setAttribute('aria-hidden', 'true');

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'cs-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        if (select.id) trigger.setAttribute('aria-label', select.getAttribute('aria-label') || select.id);

        const label = document.createElement('span');
        label.className = 'cs-trigger-label';
        trigger.appendChild(label);
        trigger.insertAdjacentHTML('beforeend', '<i class="fas fa-chevron-down"></i>');
        wrap.appendChild(trigger);

        const panel = document.createElement('div');
        panel.className = 'cs-panel';
        panel.setAttribute('role', 'listbox');
        wrap.appendChild(panel);

        function syncLabel() {
            const opt = select.options[select.selectedIndex];
            label.textContent = opt ? opt.textContent : '';
            trigger.classList.toggle('cs-placeholder', !!(opt && opt.disabled));
            panel.querySelectorAll('.cs-option').forEach(o => {
                o.classList.toggle('cs-selected', o.dataset.value === select.value);
            });
        }

        function renderOptions() {
            panel.innerHTML = '';
            Array.prototype.forEach.call(select.options, opt => {
                if (opt.disabled) return;
                const o = document.createElement('div');
                o.className = 'cs-option';
                o.setAttribute('role', 'option');
                o.textContent = opt.textContent;
                o.dataset.value = opt.value;
                o.addEventListener('click', () => {
                    select.value = opt.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    wrap.classList.remove('open');
                    syncLabel();
                });
                panel.appendChild(o);
            });
            syncLabel();
        }

        renderOptions();

        trigger.addEventListener('click', e => {
            e.stopPropagation();
            document.querySelectorAll('.cs-select.open').forEach(s => { if (s !== wrap) s.classList.remove('open'); });
            wrap.classList.toggle('open');
        });
        select.addEventListener('focus', () => trigger.focus());
        select.addEventListener('change', syncLabel);

        // Some pages (e.g. the projects filter bar) append <option> elements
        // after a fetch resolves — keep the custom list in sync when that happens.
        new MutationObserver(renderOptions).observe(select, { childList: true });
    }

    function init() {
        document.querySelectorAll('select').forEach(enhance);
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.cs-select.open').forEach(s => s.classList.remove('open'));
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') document.querySelectorAll('.cs-select.open').forEach(s => s.classList.remove('open'));
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exposed for any page that injects new <select> elements later.
    window.reinitCustomSelects = init;
})();
