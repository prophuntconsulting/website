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
        'background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font:700 14.5px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
        'box-shadow:0 10px 28px rgba(76,29,149,.4),0 2px 6px rgba(0,0,0,.25);cursor:pointer;transform-origin:bottom right;transition:opacity .3s,transform .15s}' +
        '.ph-voice:hover{transform:scale(1.04)}' +
        '.ph-voice-orb{position:relative;width:40px;height:40px;border-radius:50%;background:#000 url(/images/voice-orb.webp) center/cover;box-shadow:0 0 0 2px rgba(255,255,255,.9)}' +
        '.ph-voice-orb::after{content:"";position:absolute;left:28px;top:28px;width:11px;height:11px;border-radius:50%;background:#22c55e}' +
        '.ph-voice.is-loading{animation:ph-voice-wait 1s ease-in-out infinite}' +
        '.ph-voice.is-gone{opacity:0;pointer-events:none}' +
        // Phones: same .78 scale the real widget gets below.
        '@media ' + PHONE + '{.ph-voice{transform:scale(.78)}.ph-voice:hover{transform:scale(.8)}}' +
        '@keyframes ph-voice-wait{50%{opacity:.6}}';
    document.head.appendChild(css);

    const standIn = document.createElement('button');
    standIn.type = 'button';
    standIn.className = 'ph-voice';
    standIn.setAttribute('aria-label', 'Talk to us');
    standIn.innerHTML = '<span class="ph-voice-orb" aria-hidden="true"></span><span>Talk to us</span>';
    document.body.appendChild(standIn);

    let wantOpen = false;
    standIn.addEventListener('click', () => {
        wantOpen = true;
        standIn.classList.add('is-loading');
        load(0);
    });

    /* ── Load the real widget ── */
    let started = false;
    function load(delay) {
        if (started) return;
        started = true;
        ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(e => window.removeEventListener(e, onFirstTouch));
        setTimeout(() => {
            const s = document.createElement('script');
            s.src = API + '/widget.js';
            s.setAttribute('data-site-key', 'av_live_cDDuYuSqRmgrarST8_gjwM3G860CAuyY');
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

    function swap(host) {
        const root = host.shadowRoot;
        const button = root && root.querySelector('.av-button');
        if (!button) return false;
        const video = button.querySelector('video');
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            if (wantOpen) button.click();
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
        let tries = 0;
        const poll = setInterval(() => {
            if (host.shadowRoot) { tune(host); place(); }
            if (swap(host) || ++tries > 75) clearInterval(poll);
        }, 200);
    });
    watch.observe(document.body, { childList: true, subtree: true });

    place();
    // The project pages' Enquire bar can appear after this runs.
    const cta = document.querySelector('.ph-mobile-cta');
    if (cta && window.ResizeObserver) new ResizeObserver(place).observe(cta);
    window.addEventListener('resize', place, { passive: true });
    window.addEventListener('load', place);
})();
