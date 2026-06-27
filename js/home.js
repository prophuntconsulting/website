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

    /* ── HERO SCROLL FRAME SEQUENCE — Canvas ── */
    const canvas      = document.getElementById('heroFrame');
    const heroWrapper = document.getElementById('heroWrapper');
    const heroScroll  = document.getElementById('heroScroll');
    const loaderBar   = document.getElementById('heroLoaderBar');
    const loader      = document.getElementById('heroLoader');

    if (canvas) {
        const ctx     = canvas.getContext('2d');
        const TOTAL   = 300;
        const frames  = new Array(TOTAL + 1); // 1-indexed
        const path    = n => `images/hero-frames/ezgif-frame-${String(n).padStart(3, '0')}.png`;

        let drawn      = 0;   // last drawn frame index
        let raf        = null;
        let loaded     = 0;
        let ready      = false;

        // ── Canvas sizing ──
        function resize() {
            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;
            const dpr = window.devicePixelRatio || 1;
            canvas.width  = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (drawn) draw(drawn);
        }
        resize();
        window.addEventListener('resize', resize);

        // ── Draw a frame (cover-fit) ──
        function draw(n) {
            const img = frames[n];
            if (!img) return;
            drawn = n;
            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;
            const iw = img.naturalWidth;
            const ih = img.naturalHeight;
            const scale = Math.max(W / iw, H / ih);
            const sw = iw * scale;
            const sh = ih * scale;
            ctx.clearRect(0, 0, W, H);
            ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
        }

        // ── Scroll handler ──
        function onScroll() {
            if (!heroWrapper || !ready) return;
            const into     = Math.max(0, window.scrollY - heroWrapper.offsetTop);
            const scrollable = heroWrapper.offsetHeight - window.innerHeight;
            const progress = Math.min(Math.max(into / scrollable, 0), 1);
            const target   = Math.round(1 + progress * (TOTAL - 1));

            if (target === drawn) return;
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                if (frames[target]) {
                    draw(target);
                } else {
                    // nearest loaded frame in direction of travel
                    const dir = target > drawn ? -1 : 1;
                    for (let f = target; f >= 1 && f <= TOTAL; f += dir) {
                        if (frames[f]) { draw(f); break; }
                    }
                }
            });

            if (heroScroll) heroScroll.style.opacity = into > 60 ? '0' : '1';
        }
        window.addEventListener('scroll', onScroll, { passive: true });

        // ── Frame loader ──
        function loadFrame(n) {
            return new Promise(resolve => {
                if (frames[n]) { resolve(); return; }
                const img = new Image();
                img.onload = () => {
                    frames[n] = img;
                    loaded++;
                    if (loaderBar) loaderBar.style.width = Math.round((loaded / TOTAL) * 100) + '%';
                    if (n === 1 && !drawn) draw(1);
                    // unlock after first 30 frames loaded
                    if (!ready && loaded >= 30) {
                        ready = true;
                        if (loader) {
                            loader.style.opacity = '0';
                            setTimeout(() => { loader.style.display = 'none'; }, 500);
                        }
                    }
                    resolve();
                };
                img.onerror = resolve;
                img.src = path(n);
            });
        }

        async function loadBatch(indices, batchSize, delay) {
            for (let i = 0; i < indices.length; i += batchSize) {
                await Promise.all(indices.slice(i, i + batchSize).map(loadFrame));
                if (delay) await new Promise(r => setTimeout(r, delay));
            }
        }

        (async () => {
            // Phase 1: every 5th frame — quick coverage
            const keyframes = [];
            for (let i = 1; i <= TOTAL; i += 5) keyframes.push(i);
            keyframes.push(TOTAL);
            await loadBatch(keyframes, 12, 0);

            // Phase 2: fill all remaining frames
            const remaining = [];
            for (let i = 1; i <= TOTAL; i++) {
                if (!frames[i]) remaining.push(i);
            }
            await loadBatch(remaining, 15, 8);
        })();
    }

    /* ── FEATURED PROJECTS GRID ── */
    const FEATURED = [
        { developer:'Godrej Properties',   title:'Godrej River Royale',  location:'Baner–Hinjewadi Rd, Pune', config:'3 & 4.5 BHK',    area:'From 1,688 sqft',    price:'₹2.65 Cr*',       category:'apartment', img:'images/projects/godrej-river-royale.png',  url:'https://godrejpropertie.com/river-royale/', badge:'Premium' },
        { developer:'Shapoorji Pallonji',  title:'SP Treetopia',          location:'Jadhavwadi, East Pune',   config:'NA Villa Plots',  area:'1,817–6,000 sqft',   price:'₹84 Lakh*',       category:'plot',      img:'images/projects/treetopia.webp',            url:'projects/treetopia/', badge:'New Launch' },
        { developer:'Mahindra Lifespaces', title:'Mahindra Citadel',      location:'Pimpri-Chinchwad, Pune',  config:'2 & 3 BHK',       area:'7 acres open spaces',price:'Price on Request',  category:'apartment', img:'images/projects/mahindra-citadel.webp',     url:'projects/mahindra-citadel/', badge:'RERA Verified' },
        { developer:'Godrej Properties',   title:'Godrej Aqua Vista',     location:'Keshav Nagar, Pune',      config:'2 & 3 BHK',       area:'From 727 sqft',      price:'₹96.99 L*',       category:'apartment', img:'images/projects/godrej-aqua-vista.jpg',     url:'https://godrejpropertie.com/aqua-vista/' },
        { developer:'Kohinoor Group',      title:'Satori by Kohinoor',    location:'New Baner, Pune',         config:'3, 4 & 4.5 BHK',  area:'~3 acres amenities', price:'Price on Request',  category:'apartment', img:'images/projects/satori.jpg',                url:'https://satorinewbaner.com/' },
        { developer:'Tejraj Group',        title:'Tej Elevia',            location:'Baner, Pune',             config:'3 BHK',           area:'125m Sky Deck',      price:'Price on Request',  category:'apartment', img:'images/projects/tej-elevia.webp',           url:'https://tejeleviabaner.com/' },
    ];

    const grid     = document.getElementById('featuredGrid');
    const filtBtns = document.querySelectorAll('.filt-btn');
    let activeFilter = 'all';
    let animating    = false;

    function renderCard(p) {
        const external   = /^https?:\/\//.test(p.url);
        const linkAttrs  = external ? 'target="_blank" rel="noopener noreferrer"' : '';
        const badge      = p.badge ? `<div class="prop-card-tag">${p.badge}</div>` : '';
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
            const list = filter === 'all' ? FEATURED : FEATURED.filter(p => p.category === filter);
            grid.innerHTML = list.map(renderCard).join('');
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

    /* ── TESTIMONIAL CAROUSEL ── */
    const track = document.getElementById('testiTrack');
    const dots  = document.getElementById('testiDots');
    const prev  = document.getElementById('testiPrev');
    const next  = document.getElementById('testiNext');

    if (track) {
        const cards   = track.querySelectorAll('.testi-card');
        const total   = cards.length;
        let current   = 0;
        let autoTimer;

        function getVisible() {
            return window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
        }
        function pages() { return Math.ceil(total / getVisible()); }

        function buildDots() {
            if (!dots) return;
            dots.innerHTML = '';
            for (let i = 0; i < pages(); i++) {
                const d = document.createElement('button');
                d.className = 'testi-dot' + (i === 0 ? ' active' : '');
                d.setAttribute('aria-label', `Go to slide ${i + 1}`);
                d.addEventListener('click', () => { goTo(i); resetAuto(); });
                dots.appendChild(d);
            }
        }

        function updateDots() {
            document.querySelectorAll('.testi-dot').forEach((d, i) =>
                d.classList.toggle('active', i === current)
            );
        }

        function goTo(idx) {
            current = Math.max(0, Math.min(idx, pages() - 1));
            const cardW = cards[0].offsetWidth;
            const gap   = parseFloat(getComputedStyle(track).gap) || 24;
            const vis   = getVisible();
            track.scrollLeft = current * (cardW + gap) * vis;
            updateDots();
        }

        function startAuto() {
            clearInterval(autoTimer);
            autoTimer = setInterval(() => goTo((current + 1) % pages()), 4500);
        }
        function resetAuto() { clearInterval(autoTimer); startAuto(); }

        // Sync dot when user finger-scrolls
        track.addEventListener('scroll', () => {
            const cardW = cards[0].offsetWidth;
            const gap   = parseFloat(getComputedStyle(track).gap) || 24;
            const page  = Math.round(track.scrollLeft / ((cardW + gap) * getVisible()));
            if (page !== current) { current = page; updateDots(); }
        }, { passive: true });

        buildDots();
        startAuto();
        window.addEventListener('resize', () => { current = 0; track.scrollLeft = 0; buildDots(); resetAuto(); });

        if (prev) prev.addEventListener('click', () => { goTo((current - 1 + pages()) % pages()); resetAuto(); });
        if (next) next.addEventListener('click', () => { goTo((current + 1) % pages()); resetAuto(); });
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
