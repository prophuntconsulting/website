/**
 * PROPHUNT LLP — the "Talk to us" voice assistant (ArthaLeads widget).
 *
 * The real widget is ~530 KB of script plus a 2.7 MB orb video that its server
 * marks no-store, so it is still loaded late: after the visitor's first scroll
 * or tap (or 20 s idle), and never during page load, where it used to be the
 * biggest item on the critical path. So the button doesn't look missing until
 * then, a small stand-in drawn like the widget's "Talk to us" pill (orb, green
 * dot, label) shows straight away; a tap on it loads the widget at once and
 * opens it. The widget draws its own label, so we add none.
 *
 * Placement: bottom-right, level with the WhatsApp button bottom-left; the
 * back-to-top arrow sits above it.
 */
(function () {
    'use strict';

    const API = 'https://voice-production-2950.up.railway.app';
    const SIZE = 56;                       // the widget's pill button (height)
    const PHONE = '(max-width: 768px)';    // where the widget is scaled to .78
    const phone = () => window.matchMedia(PHONE).matches;

    /* ── Where things go ── */
    function spot() {
        const wa = document.querySelector('.wa-float');
        const cs = wa && getComputedStyle(wa);
        const size = phone() ? Math.round(SIZE * 0.78) : SIZE;
        // Project pages on phones: stay clear of the sticky Enquire bar.
        const cta = document.querySelector('.ph-mobile-cta');
        const ctaTop = cta && getComputedStyle(cta).display !== 'none' ? cta.offsetHeight + 12 : 0;
        return {
            bottom: Math.max(cs ? parseFloat(cs.bottom) : 20, ctaTop),
            side: cs ? parseFloat(cs.left) : (phone() ? 16 : 32),
            size
        };
    }

    // Width of the pill on screen: the real widget's once loaded, else the stand-in's.
    function pillWidth() {
        const host = document.getElementById('vistrow-voice-widget-host');
        const real = host && host.shadowRoot && host.shadowRoot.querySelector('.av-button');
        const el = real && real.offsetWidth ? real : document.querySelector('.ph-voice:not(.is-gone)');
        return el ? el.getBoundingClientRect().width : (phone() ? 112 : 143);
    }

    function place() {
        const s = spot();
        const root = document.documentElement.style;
        root.setProperty('--ph-voice-bottom', s.bottom + 'px');
        root.setProperty('--ph-voice-side', s.side + 'px');
        root.setProperty('--ph-voice-size', s.size + 'px');
        // Back-to-top: above the pill, centred on it.
        const btt = document.getElementById('backToTop');
        if (btt) {
            btt.style.setProperty('bottom', (s.bottom + s.size + 14) + 'px', 'important');
            btt.style.setProperty('right', (s.side + (pillWidth() - btt.offsetWidth) / 2) + 'px', 'important');
        }
        const host = document.getElementById('vistrow-voice-widget-host');
        if (host) {
            host.style.setProperty('--ph-av-bottom', s.bottom + 'px');
            host.style.setProperty('--ph-av-side', s.side + 'px');
        }
    }

    /* ── Stand-in button ── */
    const css = document.createElement('style');
    css.textContent =
        '.ph-voice{position:fixed;z-index:2147483001;bottom:var(--ph-voice-bottom,20px);right:var(--ph-voice-side,16px);' +
        'display:inline-flex;align-items:center;gap:10px;height:56px;padding:0 20px 0 8px;border:0;border-radius:9999px;' +
        'background:linear-gradient(135deg,var(--phv-a,#7c3aed),var(--phv-b,#6d28d9));color:var(--phv-on,#fff);font:700 14.5px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
        'box-shadow:0 10px 28px rgba(76,29,149,.4),0 2px 6px rgba(0,0,0,.25);cursor:pointer;transform-origin:bottom right;transition:opacity .3s,transform .15s}' +
        '.ph-voice:hover{transform:scale(1.04)}' +
        '.ph-voice-orb{position:relative;flex:0 0 40px;width:40px;height:40px;border-radius:50%;background:#000 var(--phv-avatar,url(/images/voice-orb.webp)) center/cover;box-shadow:0 0 0 2px rgba(255,255,255,.9)}' +
        '.ph-voice-orb::after{content:"";position:absolute;left:28px;top:28px;width:11px;height:11px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 2px var(--phv-b,#6d28d9)}' +
        // Hidden until it has the dashboard's colours (or the 1.5 s fallback), so the default never flashes.
        '.ph-voice.is-pending{visibility:hidden}' +
        '.ph-voice.is-loading{animation:ph-voice-wait 1s ease-in-out infinite}' +
        '.ph-voice.is-gone{opacity:0;pointer-events:none}' +
        // Phones: same .78 scale the real widget gets below.
        '@media ' + PHONE + '{.ph-voice{transform:scale(.78)}.ph-voice:hover{transform:scale(.8)}}' +
        '@keyframes ph-voice-wait{50%{opacity:.6}}';
    document.head.appendChild(css);

    const standIn = document.createElement('button');
    standIn.type = 'button';
    standIn.className = 'ph-voice is-pending';
    standIn.setAttribute('aria-label', 'Talk to us');
    standIn.innerHTML = '<span class="ph-voice-orb" aria-hidden="true"></span><span>Talk to us</span>';
    document.body.appendChild(standIn);

    /* ── Paint the stand-in with the widget's live dashboard settings ──
       Same endpoint and colour maths the widget itself uses (its bundle: bf/vf/yf/gf),
       so the stand-in matches the real button before it loads. */
    const SITE_KEY = 'av_live_cDDuYuSqRmgrarST8_gjwM3G860CAuyY';
    const CFG_KEY = 'ph-voice-cfg';
    const hexRgb = h => {
        const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h || '').trim());
        if (!m) return null;
        const x = m[1].length === 3 ? m[1].replace(/./g, c => c + c) : m[1];
        return [0, 2, 4].map(i => parseInt(x.slice(i, i + 2), 16));
    };
    const rgbHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    const mix = (a, b, t) => rgbHex(a.map((v, i) => v + (b[i] - v) * t));
    const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
    const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const safeUrl = u => /^https:\/\/[^\s"'<>`\\()]{1,490}$/.test(u || '') ? u : '';

    let themed = false;   // painted with a dashboard colour: wait for the real widget to apply it too
    function paint(cfg) {
        const t = (cfg && cfg.theme) || {};
        const a = hexRgb(t.color);
        if (a) {
            themed = true;
            const on = contrast(a, [255, 255, 255]) >= 3.5 || contrast(a, [255, 255, 255]) >= contrast(a, [17, 17, 17]) ? '#ffffff' : '#111111';
            standIn.style.setProperty('--phv-a', rgbHex(a));
            standIn.style.setProperty('--phv-b', mix(a, [0, 0, 0], lum(a) > .8 ? .06 : .25));
            standIn.style.setProperty('--phv-on', on);
        }
        const colors = Array.isArray(t.avatarColors) ? t.avatarColors.filter(hexRgb) : [];
        const logo = safeUrl(t.logoUrl);
        let avatar = '';
        if (t.avatarType === 'solid' && colors.length) avatar = 'linear-gradient(' + colors[0] + ',' + colors[0] + ')';
        else if (t.avatarType === 'gradient' && colors.length >= 2) avatar = 'linear-gradient(' + (Number(t.avatarAngle) || 135) + 'deg,' + colors.join(',') + ')';
        else if (logo) avatar = 'url("' + logo + '")';
        if (avatar) standIn.style.setProperty('--phv-avatar', avatar);
        const label = typeof cfg.label === 'string' && cfg.label.trim() ? cfg.label.trim().slice(0, 40) : '';
        if (label) { standIn.lastChild.textContent = label; standIn.setAttribute('aria-label', label); }
    }
    function reveal() { if (standIn.classList.contains('is-pending')) { standIn.classList.remove('is-pending'); place(); } }

    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch (e) { /* storage blocked */ }
    if (cached) { paint(cached); reveal(); }
    const fallback = setTimeout(reveal, 1500);     // slow or blocked: show the default look
    const ctrl = window.AbortController ? new AbortController() : null;
    setTimeout(() => ctrl && ctrl.abort(), 5000);
    fetch(API + '/widget/site-config?siteKey=' + encodeURIComponent(SITE_KEY) + '&path=' + encodeURIComponent(location.pathname), { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
        .then(r => (r.ok ? r.json() : null))
        .then(cfg => {
            if (!cfg || typeof cfg !== 'object') return;
            const logo = safeUrl(cfg.theme && cfg.theme.logoUrl);
            const show = () => { paint(cfg); clearTimeout(fallback); reveal(); };
            // Let the photo load first (briefly) so the avatar doesn't pop in after the button.
            if (logo && !(cached && cached.theme && cached.theme.logoUrl === logo)) {
                const img = new Image(); let done = false;
                const go = () => { if (!done) { done = true; show(); } };
                img.onload = img.onerror = go; img.src = logo; setTimeout(go, 600);
            } else show();
            try { localStorage.setItem(CFG_KEY, JSON.stringify({ theme: cfg.theme, label: cfg.label })); } catch (e) { /* storage blocked */ }
        })
        .catch(() => { clearTimeout(fallback); reveal(); });

    // Tell the homepage hero (js/hero-fibers.js) to pause its WebGL loop while the widget is
    // opening or open: on integrated GPUs the two fight for the GPU and the panel stutters.
    const busy = on => window.dispatchEvent(new CustomEvent('ph-voice-busy', { detail: { busy: on } }));

    let wantOpen = false;
    standIn.addEventListener('click', () => {
        wantOpen = true;
        busy(true);
        // If the widget never arrives (network), don't leave the hero frozen.
        setTimeout(() => { if (document.querySelector('.ph-voice')) busy(false); }, 15000);
        standIn.classList.add('is-loading');
        load(0);
    });

    /* ── Load the real widget ── */
    let started = false;
    // Fetch the widget script early (no execution) as soon as there's intent; load() then reuses it.
    let preloaded = false;
    function preload() {
        if (preloaded) return;
        preloaded = true;
        const l = document.createElement('link');
        l.rel = 'preload'; l.as = 'script'; l.href = API + '/widget.js';
        document.head.appendChild(l);
    }
    ['pointerenter', 'touchstart', 'focus'].forEach(e => standIn.addEventListener(e, preload, { passive: true, once: true }));
    // Also fetch it (download only, nothing runs) once the page has fully loaded and gone quiet, so
    // a tap opens the widget straight away. The server sends widget.js as no-store, so this only
    // helps the current page view. Skipped for visitors on Data Saver or 2G.
    window.addEventListener('load', () => {
        const c = navigator.connection;
        if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;
        setTimeout(() => (window.requestIdleCallback || (f => f()))(preload, { timeout: 3000 }), 4000);
    });

    function load(delay) {
        if (started) return;
        started = true;
        preload();
        ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(e => window.removeEventListener(e, onFirstTouch));
        setTimeout(() => {
            const s = document.createElement('script');
            s.src = API + '/widget.js';
            s.setAttribute('data-site-key', SITE_KEY);
            s.setAttribute('data-api-base', API);
            s.setAttribute('data-position', 'bottom-right');
            s.setAttribute('data-label', 'Talk to us');
            document.body.appendChild(s);
        }, delay);
    }
    // A moment after the first touch, so it never stalls the menu or scroll that touch started.
    function onFirstTouch(e) { if (e.target !== standIn) load(1500); }
    ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(e => window.addEventListener(e, onFirstTouch, { passive: true }));
    window.addEventListener('load', () => setTimeout(() => load(0), 20000));

    /* ── Once it's on the page: restyle, then swap the stand-in out ── */
    function tune(host) {
        const root = host.shadowRoot;
        if (!root || root.getElementById('prophunt-widget-tuning')) return;
        const style = document.createElement('style');
        style.id = 'prophunt-widget-tuning';
        style.textContent = '.av-greeting,.av-proof-pill{display:none!important}' +
            '.av-root{bottom:var(--ph-av-bottom,20px)!important;right:var(--ph-av-side,16px)!important;left:auto!important}' +
            // Phones: scale the whole button as one piece so the orb, glow and badge stay aligned.
            '@media ' + PHONE + '{.av-button-wrap{transform:scale(.78);transform-origin:bottom right}}';
        root.appendChild(style);
    }

    let firstSeen = 0;
    function swap(host) {
        const root = host.shadowRoot;
        const button = root && root.querySelector('.av-button');
        if (!button) return false;
        // The widget first renders its default purple and applies the dashboard theme a moment
        // later (it fetches the same site-config). Keep the stand-in on top until it has, or 3 s.
        if (!firstSeen) firstSeen = Date.now();
        const waited = Date.now() - firstSeen;
        if (themed && !host.hasAttribute('data-accent') && waited < 3000) return false;
        const photo = button.querySelector('img');
        if (photo && !(photo.complete && photo.naturalWidth) && waited < 3000) return false;
        const video = button.querySelector('video');
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            place();
            host.style.removeProperty('visibility');      // hidden since it was added (see watch)
            // Keep the hero paused while the panel is open; resume when it closes.
            new MutationObserver(() => busy(button.getAttribute('aria-expanded') === 'true'))
                .observe(button, { attributes: true, attributeFilter: ['aria-expanded'] });
            if (wantOpen) button.click();
            else busy(false);
            standIn.classList.add('is-gone');
            setTimeout(() => standIn.remove(), 400);
        };
        // Keep the stand-in over it until the orb video is actually playing.
        if (video && video.readyState < 3) {
            video.addEventListener('playing', finish, { once: true });
            setTimeout(finish, 4000);
        } else finish();
        return true;
    }

    // The widget renders inside its own shadow root, which the observer can't see
    // into, so once the host is here, check for its button a few times a second.
    const watch = new MutationObserver(() => {
        const host = document.getElementById('vistrow-voice-widget-host');
        if (!host) return;
        watch.disconnect();
        // The widget first paints its default purple at its own default position, which showed
        // beside the stand-in. Keep it invisible until it's positioned, themed and has its photo.
        host.style.setProperty('visibility', 'hidden', 'important');
        if (host.shadowRoot) tune(host);
        // Slow connections can take well over 15 s to deliver the widget, so keep checking
        // (cheap) until it's ready; giving up used to leave the stand-in stuck over the widget.
        const started = Date.now();
        const poll = setInterval(() => {
            if (host.shadowRoot) { tune(host); place(); }
            if (swap(host)) clearInterval(poll);
            else if (Date.now() - started > 120000) { clearInterval(poll); host.style.removeProperty('visibility'); standIn.remove(); busy(false); }
        }, 150);
    });
    watch.observe(document.body, { childList: true, subtree: true });

    place();
    // The project pages' Enquire bar can appear after this runs.
    const cta = document.querySelector('.ph-mobile-cta');
    if (cta && window.ResizeObserver) new ResizeObserver(place).observe(cta);
    window.addEventListener('resize', place, { passive: true });
    window.addEventListener('load', place);
})();
