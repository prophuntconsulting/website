/**
 * PROPHUNT LLP — Custom Select
 * Progressive enhancement over native <select> elements so every
 * dropdown's open list is styled consistently instead of showing the
 * browser/OS default. The original <select> stays in the DOM (hidden),
 * so any existing code that reads its .value or listens for "change"
 * keeps working — no other file needs to change.
 *
 * Keyboard: the trigger is a select-only combobox. Down/Up/Enter/Space open
 * the list, arrows/Home/End move, Enter/Space pick, Escape/Tab close, and a
 * letter jumps to the next option starting with it.
 */
(function () {
    'use strict';

    const CHEVRON = '<svg class="cs-chev" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    let uid = 0;

    function closeAll(except) {
        document.querySelectorAll('.cs-select.open').forEach(s => { if (s !== except && s._csClose) s._csClose(); });
    }

    function enhance(select) {
        if (select.dataset.csEnhanced || select.multiple) return;
        select.dataset.csEnhanced = '1';
        const id = 'cs' + (++uid);

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
        trigger.setAttribute('role', 'combobox');
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', id + '-list');
        if (select.required) trigger.setAttribute('aria-required', 'true');

        // Name the trigger after the field's own <label>, else its aria-label/name.
        const fieldLabel = select.id && document.querySelector('label[for="' + select.id + '"]');
        if (fieldLabel) {
            if (!fieldLabel.id) fieldLabel.id = id + '-label';
            fieldLabel.setAttribute('for', id + '-btn');
            trigger.id = id + '-btn';
        }

        const label = document.createElement('span');
        label.className = 'cs-trigger-label';
        label.id = id + '-value';
        trigger.appendChild(label);
        trigger.insertAdjacentHTML('beforeend', CHEVRON);
        wrap.appendChild(trigger);
        if (fieldLabel) trigger.setAttribute('aria-labelledby', fieldLabel.id + ' ' + label.id);
        else trigger.setAttribute('aria-label', select.getAttribute('aria-label') || select.name || select.id || 'Options');

        const panel = document.createElement('div');
        panel.className = 'cs-panel';
        panel.id = id + '-list';
        panel.setAttribute('role', 'listbox');
        if (fieldLabel) panel.setAttribute('aria-labelledby', fieldLabel.id);
        else panel.setAttribute('aria-label', select.getAttribute('aria-label') || select.name || select.id || 'Options');
        wrap.appendChild(panel);

        let options = [], active = -1;

        function syncLabel() {
            const opt = select.options[select.selectedIndex];
            label.textContent = opt ? opt.textContent : '';
            trigger.classList.toggle('cs-placeholder', !!(opt && opt.disabled));
            options.forEach(o => {
                const on = o.dataset.value === select.value;
                o.classList.toggle('cs-selected', on);
                o.setAttribute('aria-selected', String(on));
            });
        }

        function setActive(i) {
            if (!options.length) return;
            active = Math.max(0, Math.min(options.length - 1, i));
            options.forEach((o, n) => o.classList.toggle('cs-active', n === active));
            trigger.setAttribute('aria-activedescendant', options[active].id);
            const o = options[active];
            if (o.offsetTop < panel.scrollTop) panel.scrollTop = o.offsetTop;
            else if (o.offsetTop + o.offsetHeight > panel.scrollTop + panel.clientHeight) panel.scrollTop = o.offsetTop + o.offsetHeight - panel.clientHeight;
        }

        function open() {
            closeAll(wrap);
            wrap.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
            const cur = options.findIndex(o => o.dataset.value === select.value);
            setActive(cur >= 0 ? cur : 0);
        }

        function close() {
            wrap.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.removeAttribute('aria-activedescendant');
            options.forEach(o => o.classList.remove('cs-active'));
        }
        wrap._csClose = close;

        function choose(i) {
            const o = options[i];
            if (!o) return;
            if (select.value !== o.dataset.value) {
                select.value = o.dataset.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            close();
            syncLabel();
        }

        function renderOptions() {
            panel.innerHTML = '';
            options = [];
            Array.prototype.forEach.call(select.options, opt => {
                if (opt.disabled) return;
                const o = document.createElement('div');
                o.className = 'cs-option';
                o.id = id + '-opt' + options.length;
                o.setAttribute('role', 'option');
                o.textContent = opt.textContent;
                o.dataset.value = opt.value;
                const n = options.length;
                o.addEventListener('click', e => { e.stopPropagation(); choose(n); trigger.focus(); });
                o.addEventListener('mousemove', () => { if (active !== n) setActive(n); });
                panel.appendChild(o);
                options.push(o);
            });
            syncLabel();
        }

        renderOptions();

        trigger.addEventListener('click', e => {
            e.stopPropagation();
            wrap.classList.contains('open') ? close() : open();
        });
        trigger.addEventListener('keydown', e => {
            const isOpen = wrap.classList.contains('open');
            switch (e.key) {
                case 'ArrowDown': e.preventDefault(); isOpen ? setActive(active + 1) : open(); break;
                case 'ArrowUp': e.preventDefault(); isOpen ? setActive(active - 1) : open(); break;
                case 'Home': if (isOpen) { e.preventDefault(); setActive(0); } break;
                case 'End': if (isOpen) { e.preventDefault(); setActive(options.length - 1); } break;
                case 'Enter': case ' ': e.preventDefault(); isOpen ? choose(active) : open(); break;
                case 'Escape': if (isOpen) { e.preventDefault(); e.stopPropagation(); close(); } break;
                case 'Tab': if (isOpen) close(); break;
                default:
                    if (e.key.length === 1 && /\S/.test(e.key)) {
                        const k = e.key.toLowerCase(), start = isOpen ? active + 1 : 0;
                        for (let n = 0; n < options.length; n++) {
                            const i = (start + n) % options.length;
                            if (options[i].textContent.trim().toLowerCase().replace(/^[^a-z0-9]+/, '').startsWith(k)) {
                                isOpen ? setActive(i) : choose(i);
                                break;
                            }
                        }
                    }
            }
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

    document.addEventListener('click', () => closeAll());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exposed for any page that injects new <select> elements later.
    window.reinitCustomSelects = init;
})();
