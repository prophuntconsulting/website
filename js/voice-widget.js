/**
 * PROPHUNT LLP — the "Talk to us" voice assistant (ArthaLeads widget).
 *
 * The real widget is ~530 KB of script plus a 2.7 MB orb video that its server
 * marks no-store, so it is still loaded late: after the visitor's first scroll
 * or tap (or 20 s idle), and never during page load, where it used to be the
 * biggest item on the critical path. So the button doesn't look missing until
 * then, a 4 KB stand-in with the same orb and label shows straight away; a tap
 * on it loads the widget at once and opens it.
 *
 * Placement: bottom-right, level with the WhatsApp button bottom-left; the
 * back-to-top arrow sits above it.
 */
(function () {
    'use strict';

    const API = 'https://voice-production-2950.up.railway.app';
    const SIZE = 68;                       // the widget's button
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
            size,
            label: phone() ? 31 : 27       // the "Talk to us" pill above the button
        };
    }

    function place() {
        const s = spot();
        const root = document.documentElement.style;
        root.setProperty('--ph-voice-bottom', s.bottom + 'px');
        root.setProperty('--ph-voice-side', s.side + 'px');
        root.setProperty('--ph-voice-size', s.size + 'px');
        // Back-to-top: above the button and its label, centred on the button.
        const btt = document.getElementById('backToTop');
        if (btt) {
            btt.style.setProperty('bottom', (s.bottom + s.size + 10 + s.label + 12) + 'px', 'important');
            btt.style.setProperty('right', (s.side + (s.size - btt.offsetWidth) / 2) + 'px', 'important');
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
        'width:var(--ph-voice-size,68px);height:var(--ph-voice-size,68px);padding:0;border:0;border-radius:50%;' +
        'background:#000 url(/images/voice-orb.webp) center/cover;cursor:pointer;' +
        'box-shadow:0 0 0 0 rgba(168,85,247,.45);animation:ph-voice-ring 2.6s ease-out infinite;transition:opacity .3s,transform .15s}' +
        '.ph-voice:hover{transform:scale(1.06)}' +
        '.ph-voice::before{content:"Talk to us";position:absolute;bottom:100%;right:0;margin-bottom:10px;' +
        'background:#fff;color:#111;font:600 13px/1 Rubik,system-ui,sans-serif;padding:7px 12px;border-radius:999px;' +
        'box-shadow:0 4px 14px rgba(0,0,0,.18);white-space:nowrap;pointer-events:none}' +
        '.ph-voice.is-loading{animation:ph-voice-wait 1s ease-in-out infinite}' +
        '.ph-voice.is-gone{opacity:0;pointer-events:none}' +
        '@media ' + PHONE + '{.ph-voice::before{font-size:15px;padding:8px 13px}}' +
        '@keyframes ph-voice-ring{0%{box-shadow:0 0 0 0 rgba(168,85,247,.45)}70%,100%{box-shadow:0 0 0 14px rgba(168,85,247,0)}}' +
        '@keyframes ph-voice-wait{50%{opacity:.6}}';
    document.head.appendChild(css);

    const standIn = document.createElement('button');
    standIn.type = 'button';
    standIn.className = 'ph-voice';
    standIn.setAttribute('aria-label', 'Talk to us');
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
            // "Talk to us" label above the button; hidden while the panel is open.
            '.av-button-wrap::before{content:"Talk to us";position:absolute;bottom:100%;right:0;margin-bottom:10px;' +
            'background:#fff;color:#111;font:600 13px/1 Rubik,system-ui,sans-serif;padding:7px 12px;border-radius:999px;' +
            'box-shadow:0 4px 14px rgba(0,0,0,.18);white-space:nowrap;pointer-events:none}' +
            '.av-button-wrap:has(.av-button[aria-expanded="true"])::before{display:none}' +
            // Phones: scale the whole button as one piece so the orb, glow and badge stay aligned.
            '@media ' + PHONE + '{.av-button-wrap{transform:scale(.78);transform-origin:bottom right}' +
            '.av-button-wrap::before{font-size:15px;padding:8px 13px}}';
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
