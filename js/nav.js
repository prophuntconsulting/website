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
            const email = nlForm.elements.newsletterEmail?.value || '';
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
