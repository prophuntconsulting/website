/**
 * PROPHUNT LLP — Shared Navigation & Utility JS
 * Runs on every page
 */
(function () {
    'use strict';

    /* Keep floating conversion tools useful without covering page content. */
    function tuneVoiceWidget() {
        const host = document.getElementById('vistrow-voice-widget-host');
        if (!host) return false;

        // Phones: a small 52px button above the back-to-top button (and above the
        // project pages' sticky Enquire bar), instead of hiding the widget.
        const cta = document.querySelector('.ph-mobile-cta');
        const ctaShown = cta && getComputedStyle(cta).display !== 'none';
        host.style.display = '';
        // Clear the 72px Enquire bar on project pages, or the 48px back-to-top button elsewhere.
        host.style.setProperty('--ph-av-bottom', 'calc(' + (ctaShown ? 84 : 90) + 'px + env(safe-area-inset-bottom))');
        const root = host.shadowRoot;
        if (root && !root.getElementById('prophunt-widget-tuning')) {
            const style = document.createElement('style');
            style.id = 'prophunt-widget-tuning';
            style.textContent = '.av-greeting,.av-proof-pill{display:none!important}' +
                // "Talk to us" label above the button; hidden while the panel is open.
                '.av-button-wrap::before{content:"Talk to us";position:absolute;bottom:100%;right:0;margin-bottom:10px;' +
                'background:#fff;color:#111;font:600 13px/1 Rubik,system-ui,sans-serif;padding:7px 12px;border-radius:999px;' +
                'box-shadow:0 4px 14px rgba(0,0,0,.18);white-space:nowrap;pointer-events:none}' +
                '.av-button-wrap:has(.av-button[aria-expanded="true"])::before{display:none}' +
                // Phones: scale the whole button as one piece so the orb, glow and badge stay aligned.
                '@media (max-width:768px){' +
                '.av-root{bottom:var(--ph-av-bottom,84px)!important;right:16px!important}' +
                '.av-button-wrap{transform:scale(.78);transform-origin:bottom right}' +
                '.av-button-wrap::before{font-size:15px;padding:8px 13px}}';
            root.appendChild(style);
        }
        return true;
    }

    if (!tuneVoiceWidget()) {
        const widgetObserver = new MutationObserver(() => {
            if (tuneVoiceWidget()) widgetObserver.disconnect();
        });
        widgetObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
    window.addEventListener('resize', tuneVoiceWidget, { passive: true });

    /* Keep the visible copyright year current across all static pages. */
    document.querySelectorAll('.footer-bottom span').forEach(el => {
        el.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && /©\s*\d{4}/.test(node.textContent)) {
                node.textContent = node.textContent.replace(/©\s*\d{4}/, `© ${new Date().getFullYear()}`);
            }
        });
    });

    /* ── Helpers ── */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

    /* ── Navbar scroll behaviour ── */
    const navbar = $('#navbar');
    if (navbar) {
        const onScroll = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 48);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ── Active nav link (matches current page) ── */
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
    $$('.nav-link, .mobile-nav-link').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (!href || href === '#') return;
        const linkPath = href.replace(/\/$/, '');
        if (currentPath.endsWith(linkPath) && linkPath !== '') {
            link.classList.add('active');
        }
    });

    /* ── Mobile menu ── */
    const hamburger = $('#hamburger');
    const mobileMenu = $('#mobileMenu');

    function openMenu() {
        hamburger?.classList.add('open');
        mobileMenu?.classList.add('open');
        document.body.style.overflow = 'hidden';
        hamburger?.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
        hamburger?.classList.remove('open');
        mobileMenu?.classList.remove('open');
        document.body.style.overflow = '';
        hamburger?.setAttribute('aria-expanded', 'false');
    }

    hamburger?.addEventListener('click', () => {
        hamburger.classList.contains('open') ? closeMenu() : openMenu();
    });

    // Close when a link is clicked
    $$('.mobile-nav-link, .mobile-sub-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMenu();
    });


    /* ── Phone menu: card navigation ──────────────────────────────────────
       Design adapted from "CardNav" by David Haz (React Bits,
       https://reactbits.dev). Copyright (c) 2026 David Haz. Used under the
       MIT + Commons Clause licence as part of this website; the full notice
       is at https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md.
       Rebuilt here without React: a floating bar that opens into three
       cards. Links live in this one list, so every page gets the same
       menu. Desktop keeps the normal navbar. */
    const CARD_NAV = [
        { label: 'Find a Home', note: 'New RERA-registered projects across Pune', tone: 'brand', links: [
            ['All Projects', '/projects'], ['Apartments', '/projects/apartments'], ['Villas', '/projects/villas'],
            ['Plots', '/projects/plots'], ['Commercial', '/projects/commercial']] },
        { label: 'Explore', note: 'Areas, developers and buyer guides', tone: 'light', links: [
            ['Areas', '/location'], ['Developers', '/developers'], ['Blog', '/blog'], ['Stamp Duty Calculator', '/stamp-duty-calculator-pune']] },
        { label: 'PROPHUNT LLP', note: 'MahaRERA agent A52100037156 · Baner, Pune', tone: 'dark', links: [
            ['About', '/about'], ['Services', '/services'], ['Contact', '/contact'],
            ['Call +91 70668 80808', 'tel:+917066880808'], ['WhatsApp', 'https://wa.me/917447430431']] },
    ];
    const ARROW_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function buildCardNav() {
        if (!navbar || !mobileMenu || document.querySelector('.cnav')) return;
        const logo = navbar.querySelector('.nav-logo img');
        const root = document.createElement('div');
        root.className = 'cnav';
        root.innerHTML = `
          <nav class="cnav-panel" aria-label="Main">
            <div class="cnav-bar">
              <a href="/" class="cnav-logo" aria-label="PROPHUNT LLP Home"><img src="${logo ? logo.getAttribute('src') : '/images/logo-black.png'}" alt=""></a>
              <a href="/contact" class="cnav-cta">Book a Visit</a>
              <button type="button" class="cnav-menu" aria-expanded="false" aria-controls="cnavContent" aria-label="Open menu">
                <span class="cnav-burger" aria-hidden="true"><span></span><span></span></span>
              </button>
            </div>
            <div class="cnav-content" id="cnavContent" aria-hidden="true">
              ${CARD_NAV.map(c => `<div class="cnav-card cnav-card--${c.tone}">
                <div class="cnav-card-head"><span class="cnav-label">${c.label}</span><p class="cnav-note">${c.note}</p></div>
                <ul class="cnav-links">${c.links.map(([t, h]) => `<li><a class="cnav-link" href="${h}"${/^https?:/.test(h) ? ' target="_blank" rel="noopener"' : ''} tabindex="-1"><span class="cnav-arrow">${ARROW_SVG}</span>${t}</a></li>`).join('')}</ul>
              </div>`).join('')}
            </div>
          </nav>`;
        document.body.appendChild(root);
        document.documentElement.classList.add('has-cnav');

        const panel = root.querySelector('.cnav-panel');
        const content = root.querySelector('.cnav-content');
        const btn = root.querySelector('.cnav-menu');
        const links = [...root.querySelectorAll('.cnav-link')];
        let open = false;

        // CSS does the motion (height + card rise); JS only sets the target
        // height once per toggle so the phone never lays out mid-animation.
        const setOpen = next => {
            if (next === open) return;
            open = next;
            if (open) {
                root.classList.add('is-shown');
                panel.style.height = Math.min(60 + content.scrollHeight, window.innerHeight - 16) + 'px';
            } else panel.style.height = '';
            root.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', String(open));
            btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            content.setAttribute('aria-hidden', String(!open));
            links.forEach(a => a.tabIndex = open ? 0 : -1);
        };
        panel.addEventListener('transitionend', e => {
            if (e.target === panel && e.propertyName === 'height' && !open) root.classList.remove('is-shown');
        });
        btn.addEventListener('click', () => setOpen(!open));
        links.forEach(a => a.addEventListener('click', () => setOpen(false)));
        document.addEventListener('pointerdown', e => { if (open && !root.contains(e.target)) setOpen(false); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) { setOpen(false); btn.focus(); } });
    }
    if (window.matchMedia('(max-width: 768px)').matches) buildCardNav();
    else window.matchMedia('(max-width: 768px)').addEventListener('change', e => { if (e.matches) buildCardNav(); });

    /* ── Scroll reveal (IntersectionObserver) ── */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const delay = el.dataset.revealDelay || 0;
            setTimeout(() => el.classList.add('revealed'), Number(delay));
            revealObserver.unobserve(el);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    $$('[data-reveal]').forEach(el => revealObserver.observe(el));

    /* ── Animated counters ── */
    function animateCounter(el) {
        const target = parseInt(el.dataset.count, 10);
        if (isNaN(target)) return;
        const duration = 1800;
        const startTime = performance.now();
        const update = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target).toLocaleString('en-IN') + (progress >= 1 ? '+' : '');
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        });
    }, { threshold: 0.5 });

    $$('[data-count]').forEach(el => counterObserver.observe(el));

    /* ── Back to top ── */
    const btt = $('#backToTop');
    if (btt) {
        window.addEventListener('scroll', () => {
            btt.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
        btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    /* ── Newsletter form ── */
    const nlForm = $('#newsletterForm');
    if (nlForm) {
        nlForm.addEventListener('submit', e => {
            e.preventDefault();
            const field = nlForm.elements.newsletterEmail;
            const email = (field?.value || '').trim();
            // The form is novalidate, so check the address here: empty or malformed ones never get sent.
            if (field && (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) || !field.checkValidity())) {
                field.setCustomValidity('Please enter a valid email address.');
                field.reportValidity();
                field.addEventListener('input', () => field.setCustomValidity(''), { once: true });
                return;
            }
            const btn = nlForm.querySelector('button');
            const originalIcon = btn ? btn.innerHTML : '';
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    access_key: 'acfdfc58-e2e3-4c02-a9a0-a6e41ec51ee9',
                    subject: 'Newsletter subscription',
                    from_name: 'PROPHUNT LLP website - Newsletter',
                    email,
                    source_page: window.location.pathname
                })
            }).then(r => r.ok).catch(() => false).then(ok => {
                if (!btn) return;
                btn.disabled = false;
                btn.innerHTML = ok ? '<i class="fas fa-check"></i>' : '<i class="fas fa-exclamation-triangle"></i>';
                setTimeout(() => { btn.innerHTML = originalIcon; if (ok) nlForm.reset(); }, 2500);
            });
        });
    }

    /* Keep the footer copyright year current without a yearly edit. */
    document.querySelectorAll('.footer-bottom > span:first-child').forEach(el => {
        el.innerHTML = el.innerHTML.replace(/(&copy;|©)\s*20\d\d/, '$1 ' + new Date().getFullYear());
    });

    /* ── GA4: phone and WhatsApp taps are leads too (key events in GA4) ── */
    document.addEventListener('click', e => {
        const a = e.target.closest && e.target.closest('a[href]');
        if (!a || typeof gtag !== 'function') return;
        const href = a.getAttribute('href');
        const name = /^tel:/i.test(href) ? 'phone_call'
            : /^https?:\/\/(wa\.me|api\.whatsapp\.com|(www\.)?whatsapp\.com)\//i.test(href) ? 'whatsapp_click' : '';
        if (!name) return;
        gtag('event', name, {
            link_url: href.split('?')[0],
            link_text: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 100),
            page_path: window.location.pathname,
            transport_type: 'beacon'
        });
    }, true);

    /* ── GA4: the Vistrow voice/chat widget announces what happens inside it as a
       'vistrow-widget' window event (its dataLayer pushes are GTM-only, which gtag
       ignores). Forward the useful ones as widget_* events; a lead counts as generate_lead. ── */
    const WIDGET_ACTIONS = ['open', 'chat_opened', 'chat_message_sent', 'chat_ended', 'call_started', 'call_connected',
        'agent_joined', 'microphone_denied', 'consent_declined', 'post_call_cta_clicked', 'feedback_submitted', 'lead_submitted'];
    window.addEventListener('vistrow-widget', e => {
        const d = (e && e.detail) || {};
        if (typeof gtag !== 'function' || !WIDGET_ACTIONS.includes(d.action)) return;
        const params = { widget_mode: d.mode || '', page_path: window.location.pathname };
        if (d.rating) params.rating = d.rating;
        gtag('event', 'widget_' + d.action, params);
        if (d.action === 'lead_submitted') gtag('event', 'generate_lead', { form_name: 'Voice widget', page_path: window.location.pathname });
    });

})();
