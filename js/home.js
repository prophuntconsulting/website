/**
 * PROPHUNT LLP — Home Page JS
 */
(function () {
    'use strict';

    /* ══════════════════════════════════════════
       SCROLL REVEAL
    ══════════════════════════════════════════ */
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

    /* ══════════════════════════════════════════
       STAT COUNTER ANIMATION
    ══════════════════════════════════════════ */
    const statNums = document.querySelectorAll('.stat-number[data-count]');

    function animateCount(el) {
        const target = parseInt(el.dataset.count);
        const duration = 1800;
        const step = 16;
        const steps = duration / step;
        const increment = target / steps;
        let current = 0;

        const suffix = target >= 1000 ? '+' : '+';
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = Math.round(current).toLocaleString('en-IN') + suffix;
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

    /* ══════════════════════════════════════════
       HERO SCROLL FRAME SEQUENCE
    ══════════════════════════════════════════ */
    const heroFrame   = document.getElementById('heroFrame');
    const heroWrapper = document.getElementById('heroWrapper');
    const heroScroll  = document.getElementById('heroScroll');
    const TOTAL       = 300;
    const framePath   = n => `images/hero-frames/ezgif-frame-${String(n).padStart(3,'0')}.png`;

    let currentFrame = 1;
    let raf = null;

    function setFrame(n) {
        const f = Math.min(TOTAL, Math.max(1, n));
        if (f === currentFrame) return;
        currentFrame = f;
        heroFrame.src = framePath(f);
    }

    function onScroll() {
        if (!heroWrapper) return;
        const scrolled   = window.scrollY;
        const wrapperTop = heroWrapper.offsetTop;
        const scrollable = heroWrapper.offsetHeight - window.innerHeight;
        const into       = scrolled - wrapperTop;
        const progress   = Math.min(Math.max(into / scrollable, 0), 1);
        const frame      = Math.round(1 + progress * (TOTAL - 1));

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => setFrame(frame));

        if (heroScroll) heroScroll.style.opacity = into > 60 ? '0' : '1';
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    if (heroFrame) {
        const cache = new Set([1]);
        const queue = [];
        let busy = false;

        function preload(n) {
            return new Promise(res => {
                if (cache.has(n)) { res(); return; }
                const img = new Image();
                img.onload = img.onerror = () => { cache.add(n); res(); };
                img.src = framePath(n);
            });
        }

        async function drain() {
            if (busy) return;
            busy = true;
            while (queue.length) {
                const batch = queue.splice(0, 8);
                await Promise.all(batch.map(preload));
                await new Promise(r => setTimeout(r, 40));
            }
            busy = false;
        }

        for (let i = 1; i <= TOTAL; i += 10) queue.push(i);
        queue.push(TOTAL);
        drain().then(() => {
            for (let i = 1; i <= TOTAL; i++) {
                if (!cache.has(i)) queue.push(i);
            }
            drain();
        });
    }

    /* ══════════════════════════════════════════
       FEATURED PROJECTS GRID
    ══════════════════════════════════════════ */
    const FEATURED = [
        { developer:'Godrej Properties',  title:'Godrej River Royale',   location:'Baner–Hinjewadi Rd, Pune', config:'3 & 4.5 BHK', area:'From 1,688 sqft', price:'₹2.65 Cr*',       category:'apartment', img:'images/projects/godrej-river-royale.png',  url:'https://godrejpropertie.com/river-royale/', badge:'Premium' },
        { developer:'Shapoorji Pallonji', title:'SP Treetopia',           location:'Jadhavwadi, East Pune',   config:'NA Villa Plots', area:'1,817–6,000 sqft', price:'₹84 Lakh*',    category:'plot',      img:'images/projects/treetopia.webp',            url:'projects/treetopia/', badge:'New Launch' },
        { developer:'Mahindra Lifespaces',title:'Mahindra Citadel',       location:'Pimpri-Chinchwad, Pune',  config:'2 & 3 BHK', area:'7 acres open spaces', price:'Price on Request', category:'apartment', img:'images/projects/mahindra-citadel.webp', url:'projects/mahindra-citadel/', badge:'RERA Verified' },
        { developer:'Godrej Properties',  title:'Godrej Aqua Vista',      location:'Keshav Nagar, Pune',      config:'2 & 3 BHK', area:'From 727 sqft', price:'₹96.99 L*',              category:'apartment', img:'images/projects/godrej-aqua-vista.jpg',    url:'https://godrejpropertie.com/aqua-vista/' },
        { developer:'Kohinoor Group',     title:'Satori by Kohinoor',     location:'New Baner, Pune',         config:'3, 4 & 4.5 BHK', area:'~3 acres amenities', price:'Price on Request', category:'apartment', img:'images/projects/satori.jpg',       url:'https://satorinewbaner.com/' },
        { developer:'Tejraj Group',       title:'Tej Elevia',             location:'Baner, Pune',             config:'3 BHK', area:'125m Sky Deck', price:'Price on Request',             category:'apartment', img:'images/projects/tej-elevia.webp',          url:'https://tejeleviabaner.com/' },
    ];

    const grid = document.getElementById('featuredGrid');
    const filtBtns = document.querySelectorAll('.filt-btn');
    let activeFilter = 'all';
    let animating = false;

    function renderCard(p) {
        const external = /^https?:\/\//.test(p.url);
        const linkAttrs = external ? 'target="_blank" rel="noopener noreferrer"' : '';
        const badge = p.badge ? `<div class="prop-card-tag">${p.badge}</div>` : '';
        return `
        <article class="prop-card" data-category="${p.category}">
          <div class="prop-card-img">
            <div style="background-image:url('${p.img}');"></div>
            ${badge}
            <div class="prop-card-price">${p.price}</div>
            <div class="prop-card-overlay">
              <a href="${p.url}" ${linkAttrs} class="btn btn-primary btn-sm">View Project <i class="fas fa-arrow-right"></i></a>
              <a href="contact.html?project=${encodeURIComponent(p.title)}" class="btn btn-ghost btn-sm">Quick Enquire</a>
            </div>
          </div>
          <div class="prop-card-body">
            <div class="prop-card-dev">${p.developer}</div>
            <h3 class="prop-card-title">${p.title}</h3>
            <p class="prop-card-loc"><i class="fas fa-map-marker-alt"></i> ${p.location}</p>
            <div class="prop-card-specs">
              <span><i class="fas fa-building"></i> ${p.config}</span>
              <span><i class="fas fa-ruler-combined"></i> ${p.area}</span>
            </div>
            <div class="prop-card-footer">
              <a href="contact.html?project=${encodeURIComponent(p.title)}" class="prop-card-enquire"><i class="fas fa-phone"></i> Enquire</a>
              <a href="${p.url}" ${linkAttrs} class="prop-card-link">View Project <i class="fas fa-arrow-right"></i></a>
            </div>
          </div>
        </article>`;
    }

    function renderGrid(filter) {
        if (!grid || animating) return;
        animating = true;
        grid.style.opacity = '0';
        grid.style.transform = 'translateY(12px)';

        setTimeout(() => {
            const filtered = filter === 'all' ? FEATURED : FEATURED.filter(p => p.category === filter);
            grid.innerHTML = filtered.map(renderCard).join('');
            grid.style.transition = 'opacity .35s ease, transform .35s ease';
            grid.style.opacity = '1';
            grid.style.transform = 'translateY(0)';
            animating = false;
        }, 200);
    }

    renderGrid('all');

    filtBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.filter === activeFilter) return;
            filtBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderGrid(activeFilter);
        });
    });

    /* ══════════════════════════════════════════
       TESTIMONIAL CAROUSEL
    ══════════════════════════════════════════ */
    const track  = document.getElementById('testiTrack');
    const dots   = document.getElementById('testiDots');
    const prev   = document.getElementById('testiPrev');
    const next   = document.getElementById('testiNext');

    if (track) {
        const cards = track.querySelectorAll('.testi-card');
        const total = cards.length;
        let current = 0;
        let autoTimer;

        function getVisible() {
            return window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
        }

        function buildDots() {
            if (!dots) return;
            dots.innerHTML = '';
            const pages = Math.ceil(total / getVisible());
            for (let i = 0; i < pages; i++) {
                const d = document.createElement('button');
                d.className = 'testi-dot' + (i === 0 ? ' active' : '');
                d.setAttribute('aria-label', `Go to slide ${i + 1}`);
                d.addEventListener('click', () => goTo(i));
                dots.appendChild(d);
            }
        }

        function goTo(idx) {
            const pages = Math.ceil(total / getVisible());
            current = Math.max(0, Math.min(idx, pages - 1));
            const offset = current * (100 / getVisible()) * getVisible();
            track.style.transform = `translateX(-${(current * 100)}%)`;
            document.querySelectorAll('.testi-dot').forEach((d, i) => {
                d.classList.toggle('active', i === current);
            });
        }

        function startAuto() {
            autoTimer = setInterval(() => {
                const pages = Math.ceil(total / getVisible());
                goTo((current + 1) % pages);
            }, 4500);
        }

        function resetAuto() {
            clearInterval(autoTimer);
            startAuto();
        }

        // Set card widths
        function layout() {
            const vis = getVisible();
            cards.forEach(c => c.style.minWidth = `${100 / vis}%`);
            track.style.display = 'flex';
            buildDots();
            goTo(0);
        }

        layout();
        startAuto();
        window.addEventListener('resize', () => { layout(); resetAuto(); });

        if (prev) prev.addEventListener('click', () => { const pages = Math.ceil(total / getVisible()); goTo((current - 1 + pages) % pages); resetAuto(); });
        if (next) next.addEventListener('click', () => { const pages = Math.ceil(total / getVisible()); goTo((current + 1) % pages); resetAuto(); });

        // Touch swipe
        let startX = 0;
        track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                const pages = Math.ceil(total / getVisible());
                diff > 0 ? goTo((current + 1) % pages) : goTo((current - 1 + pages) % pages);
                resetAuto();
            }
        }, { passive: true });
    }

    /* ══════════════════════════════════════════
       PROPERTY SEARCH BAR
    ══════════════════════════════════════════ */
    window.doSearch = function () {
        const type     = document.getElementById('searchType')?.value || '';
        const location = document.getElementById('searchLocation')?.value || '';
        const budget   = document.getElementById('searchBudget')?.value || '';

        const params = new URLSearchParams();
        if (type)     params.set('type', type);
        if (location) params.set('location', location);
        if (budget)   params.set('budget', budget);

        window.location.href = 'projects.html' + (params.toString() ? '?' + params.toString() : '');
    };

    // Also allow Enter key in search fields
    document.querySelectorAll('.search-field select').forEach(sel => {
        sel.addEventListener('change', () => {
            document.getElementById('searchBtn')?.classList.add('pulse');
            setTimeout(() => document.getElementById('searchBtn')?.classList.remove('pulse'), 600);
        });
    });

    /* ══════════════════════════════════════════
       SERVICE CARD PULSE ON HOVER
    ══════════════════════════════════════════ */
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.querySelector('.service-icon')?.classList.add('bounce');
        });
        card.addEventListener('mouseleave', () => {
            card.querySelector('.service-icon')?.classList.remove('bounce');
        });
    });

})();
