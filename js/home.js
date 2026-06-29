/**
 * PROPHUNT LLP — Home Page JS
 */
(function () {
    'use strict';

    /* ── SCROLL REVEAL ── */
    const revealEls = document.querySelectorAll('[data-reveal]');
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const delay = el.dataset.revealDelay ? parseInt(el.dataset.revealDelay) : 0;
            setTimeout(() => el.classList.add('revealed'), delay);
            revealObs.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObs.observe(el));

    /* ── STAT COUNTER ANIMATION ── */
    const statNums = document.querySelectorAll('.stat-number[data-count]');
    function animateCount(el) {
        const target = parseInt(el.dataset.count);
        const duration = 1800;
        const step = 16;
        const increment = target / (duration / step);
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = Math.round(current).toLocaleString('en-IN') + '+';
        }, step);
    }
    const statObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            animateCount(entry.target);
            statObs.unobserve(entry.target);
        });
    }, { threshold: 0.5 });
    statNums.forEach(el => statObs.observe(el));

    /* ── HERO SCROLL FRAME SEQUENCE — Video scrub ── */
    const video       = document.getElementById('heroFrame');
    const heroWrapper = document.getElementById('heroWrapper');
    const heroScroll  = document.getElementById('heroScroll');
    const loader      = document.getElementById('heroLoader');

    if (video && heroWrapper) {
        let raf = null;
        let lastSeekTime = 0;
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const THROTTLE = isMobile ? 40 : 0; // ~25fps cap on mobile

        video.addEventListener('canplay', () => {
            if (loader) { loader.style.opacity = '0'; setTimeout(() => { loader.style.display = 'none'; }, 400); }
        }, { once: true });

        function onScroll() {
            const into     = Math.max(0, window.scrollY - heroWrapper.offsetTop);
            const scrollH  = heroWrapper.offsetHeight - window.innerHeight;
            const progress = scrollH > 0 ? Math.min(into / scrollH, 1) : 0;

            if (heroScroll) heroScroll.style.opacity = into > 60 ? '0' : '1';

            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                if (video.readyState < 1) return;
                const now = performance.now();
                if (now - lastSeekTime < THROTTLE) return;
                if (video.seeking) return;
                lastSeekTime = now;
                video.currentTime = Math.min(progress * video.duration, video.duration - 0.05);
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        video.addEventListener('loadedmetadata', () => { video.currentTime = 0; });
    }

    /* ── FEATURED PROJECTS GRID (loads from /properties/posts.json) ── */
    const grid      = document.getElementById('featuredGrid');
    const filtBtns  = document.querySelectorAll('.filt-btn');
    const sortSel   = document.getElementById('featuredSort');
    let ALL_PROPS   = [];
    let activeFilter = 'all';
    let activeSort   = 'default';
    let animating    = false;

    function sortedList(list) {
        const arr = [...list];
        if (activeSort === 'price-low')  arr.sort((a, b) => (a.price || 0) - (b.price || 0));
        if (activeSort === 'price-high') arr.sort((a, b) => (b.price || 0) - (a.price || 0));
        if (activeSort === 'az')         arr.sort((a, b) => a.title.localeCompare(b.title));
        return arr;
    }

    function renderCard(p) {
        const external  = /^https?:\/\//.test(p.url);
        const linkAttrs = external ? 'target="_blank" rel="noopener noreferrer"' : '';
        const linkLabel = external ? 'View Project' : 'View Details';
        const badge     = p.status === 'coming-soon' ? 'Coming Soon' : p.rera ? 'RERA Verified' : '';
        const badgeHtml = badge ? `<div class="prop-card-tag">${badge}</div>` : '';
        const priceLabel = p.price_label || (p.price > 0 ? '₹' + p.price + ' L*' : 'Price on Request');
        const icon = p.category === 'plot' ? 'map' : p.category === 'villa' ? 'home' : 'building';
        return `
        <article class="prop-card" data-category="${p.category}">
          <div class="prop-card-img">
            <div style="background-image:url('${p.cover || ''}');"></div>
            ${badgeHtml}
            <div class="prop-card-price">${priceLabel}</div>
            <div class="prop-card-overlay">
              <a href="${p.url}" ${linkAttrs} class="btn btn-primary btn-sm">${linkLabel} <i class="fas fa-arrow-right"></i></a>
              <a href="contact.html?project=${encodeURIComponent(p.title)}" class="btn btn-ghost btn-sm">Quick Enquire</a>
            </div>
          </div>
          <div class="prop-card-body">
            <div class="prop-card-dev">${p.developer}</div>
            <h3 class="prop-card-title">${p.title}</h3>
            <p class="prop-card-loc"><i class="fas fa-map-marker-alt"></i> ${p.location}</p>
            <div class="prop-card-specs">
              <span><i class="fas fa-${icon}"></i> ${p.config}</span>
              <span><i class="fas fa-ruler-combined"></i> ${p.area}</span>
            </div>
            <div class="prop-card-footer">
              <a href="contact.html?project=${encodeURIComponent(p.title)}" class="prop-card-enquire"><i class="fas fa-phone"></i> Enquire</a>
              <a href="${p.url}" ${linkAttrs} class="prop-card-link">${linkLabel} <i class="fas fa-arrow-right"></i></a>
            </div>
          </div>
        </article>`;
    }

    function renderGrid() {
        if (!grid || animating) return;
        animating = true;
        grid.style.opacity = '0';
        grid.style.transform = 'translateY(12px)';
        setTimeout(() => {
            const filtered = activeFilter === 'all' ? ALL_PROPS : ALL_PROPS.filter(p => p.category === activeFilter);
            const list = sortedList(filtered);
            grid.innerHTML = list.length ? list.map(renderCard).join('') :
                '<p style="text-align:center;color:var(--gray-400);padding:3rem;grid-column:1/-1">No properties in this category yet.</p>';
            grid.style.transition = 'opacity .35s ease, transform .35s ease';
            grid.style.opacity = '1';
            grid.style.transform = 'translateY(0)';
            animating = false;
        }, 200);
    }

    fetch('/properties/posts.json')
        .then(r => r.json())
        .then(data => {
            ALL_PROPS = data.filter(p => p.status !== 'sold-out');
            renderGrid();
        })
        .catch(() => {
            if (grid) grid.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:3rem;grid-column:1/-1">Unable to load projects.</p>';
        });

    filtBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.filter === activeFilter) return;
            filtBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderGrid();
        });
    });

    sortSel?.addEventListener('change', () => { activeSort = sortSel.value; renderGrid(); });

    /* ── TESTIMONIALS (fade slider) ── */
    const stage = document.getElementById('testiStage');
    const dots  = document.getElementById('testiDots');
    const prev  = document.getElementById('testiPrev');
    const next  = document.getElementById('testiNext');

    if (stage) {
        const slides = stage.querySelectorAll('.testi-slide');
        const total  = slides.length;
        let current  = 0;
        let autoTimer;

        /* Build dots */
        if (dots) {
            for (let i = 0; i < total; i++) {
                const d = document.createElement('button');
                d.className = 'testi-dot' + (i === 0 ? ' active' : '');
                d.setAttribute('aria-label', `Slide ${i + 1}`);
                d.addEventListener('click', () => { goTo(i); resetAuto(); });
                dots.appendChild(d);
            }
        }

        function goTo(idx) {
            slides[current].classList.remove('active');
            current = (idx + total) % total;
            slides[current].classList.add('active');
            document.querySelectorAll('.testi-dot').forEach((d, i) =>
                d.classList.toggle('active', i === current)
            );
        }

        function startAuto() {
            clearInterval(autoTimer);
            autoTimer = setInterval(() => goTo(current + 1), 4500);
        }
        function resetAuto() { clearInterval(autoTimer); startAuto(); }

        startAuto();

        if (prev) prev.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
        if (next) next.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

        /* Touch swipe */
        let startX = 0;
        stage.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
        stage.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) { diff > 0 ? goTo(current + 1) : goTo(current - 1); resetAuto(); }
        }, { passive: true });
    }

    /* ── PROPERTY SEARCH ── */
    window.doSearch = function () {
        const type     = document.getElementById('searchType')?.value || '';
        const location = document.getElementById('searchLocation')?.value || '';
        const budget   = document.getElementById('searchBudget')?.value || '';
        const params   = new URLSearchParams();
        if (type)     params.set('type', type);
        if (location) params.set('location', location);
        if (budget)   params.set('budget', budget);
        window.location.href = 'projects.html' + (params.toString() ? '?' + params.toString() : '');
    };

    document.getElementById('searchBtn')?.addEventListener('click', window.doSearch);

    document.querySelectorAll('.search-field select').forEach(sel => {
        sel.addEventListener('change', () => {
            const btn = document.getElementById('searchBtn');
            btn?.classList.add('pulse');
            setTimeout(() => btn?.classList.remove('pulse'), 600);
        });
    });

    /* ── SERVICE CARD ICON BOUNCE ── */
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', () => card.querySelector('.service-icon')?.classList.add('bounce'));
        card.addEventListener('mouseleave', () => card.querySelector('.service-icon')?.classList.remove('bounce'));
    });

})();
