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

        host.style.display = window.matchMedia('(max-width: 768px)').matches ? 'none' : '';
        const root = host.shadowRoot;
        if (root && !root.getElementById('prophunt-widget-tuning')) {
            const style = document.createElement('style');
            style.id = 'prophunt-widget-tuning';
            style.textContent = '.av-greeting,.av-proof-pill{display:none!important}';
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

})();
