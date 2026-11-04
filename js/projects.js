/**
 * PROPHUNT LLP — Projects Page JS
 * Loads properties dynamically from /properties/posts.json
 */
(function () {
    'use strict';

    // Prices are stored in lakh; show ₹1 crore and above in crore, as everywhere else on the site.
    function priceText(p) {
        if (p.price_label) return p.price_label;
        if (!(p.price > 0)) return 'Price on Request';
        return p.price >= 100 ? '₹' + (p.price / 100).toFixed(2).replace(/.?0+$/, '') + ' Cr*' : '₹' + p.price + ' L*';
    }

    const grid        = document.getElementById('projectsGrid');
    const countEl     = document.getElementById('projectCount');
    const typeSelect  = document.getElementById('filterType');
    const locSelect   = document.getElementById('filterLocation');
    const devSelect   = document.getElementById('filterDeveloper');
    const budgetSelect= document.getElementById('filterBudget');
    const sortSelect  = document.getElementById('projSort');
    const searchInput = document.getElementById('projSearch');
    const clearBtn    = document.getElementById('clearFilters');
    const searchBtn   = document.getElementById('projFinderBtn');
    const emptyState  = document.getElementById('projEmpty');
    const pager       = document.getElementById('projPager');

    // 12 cards a page: four full rows of three on desktop, six of two on tablets.
    // Every card stays in the page (the rest are hidden), so all project links
    // remain crawlable; the page number lives in ?page= so Back and shared links work.
    const PER_PAGE = 12;
    let page = 1;
    let shown = [];

    let ALL_PROJECTS  = [];
    let activeType    = 'all';
    let activeLocation= '';
    let activeDev     = '';
    let activeBudget  = '';
    let activeSearch  = '';
    let activeSort    = 'default';

    function matchBudget(price, budget) {
        if (!budget) return true;
        if (!price || price === 0) return false;
        const map = {
            'under50':  p => p < 50,
            '50-100':   p => p >= 50 && p <= 100,
            '100-200':  p => p > 100 && p <= 200,
            '200-500':  p => p > 200 && p <= 500,
            'above500': p => p > 500
        };
        return map[budget] ? map[budget](price) : true;
    }

    // Maps a project's free-text location string to one of the curated
    // micro-market buckets used in the Location filter. Order matters —
    // more specific areas are checked before broader ones (e.g. Mahalunge
    // before Baner, since "Mahalunge, Baner Annex" contains both words).
    const MICRO_MARKETS = [
        ['mahalunge',       'mahalunge'],
        ['karjat',          'karjat'],
        ['khopoli',         'khopoli'],
        ['wakad',           'wakad'],
        ['tathawade',       'wakad'],
        ['pimpri',          'pimpri-chinchwad'],
        ['ravet',           'ravet-gahunje'],
        ['gahunje',         'ravet-gahunje'],
        ['sinhagad',        'sinhagad-road'],
        ['hadapsar',        'hadapsar'],
        ['baner',           'baner'],
    ];
    function getMicroMarket(location) {
        const loc = (location || '').toLowerCase();
        for (const [needle, bucket] of MICRO_MARKETS) {
            if (loc.includes(needle)) return bucket;
        }
        return '';
    }

    function renderCard(p) {
        const isExternal = /^https?:\/\//.test(p.url);
        const linkAttrs  = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
        const linkLabel  = isExternal ? 'View Project' : 'View Details';
        const icon       = p.category === 'plot' ? 'map' : p.category === 'villa' ? 'home' : p.category === 'commercial' ? 'briefcase' : 'building';
        const statusBadge = p.status === 'sold-out'
            ? '<span class="badge badge-gray" style="font-size:.68rem;padding:.2rem .55rem;background:#6b7280">Sold Out</span>'
            : '';
        const priceLabel = priceText(p);
        const areaSpec = p.area ? `<span><i class="fas fa-ruler-combined"></i>${p.area}</span>` : '';
        return `
        <a href="${p.url}" ${linkAttrs} class="prop-card" data-category="${p.category}" aria-label="${linkLabel}: ${p.title}">
          <div class="prop-card-img">
            <div>${p.cover ? `<img src="${p.thumb || p.cover}" alt="${(p.title || '').replace(/"/g, '&quot;')}" width="600" height="372" loading="lazy" decoding="async">` : `<span class="prop-card-img-empty"><i class="fas fa-${icon}"></i></span>`}</div>
            <div class="prop-card-badge"><span class="badge badge-red">${p.developer}</span>${statusBadge}</div>
            <div class="prop-card-price">${priceLabel}</div>
          </div>
          <div class="prop-card-body">
            <div class="prop-card-dev">${p.developer}</div>
            <h3 class="prop-card-title">${p.title}</h3>
            <p class="prop-card-loc"><i class="fas fa-map-marker-alt"></i>${p.location}</p>
            <div class="prop-card-specs">
              <span><i class="fas fa-${icon}"></i>${p.config}</span>
              ${areaSpec}
            </div>
            <div class="prop-card-footer">
              <span class="prop-card-status">${isExternal ? 'Official project page' : 'View on PROPHUNT'}</span>
              <span class="prop-card-link">${linkLabel} <i class="fas fa-arrow-right"></i></span>
            </div>
          </div>
        </a>`;
    }

    function populateDeveloperDropdown() {
        if (!devSelect) return;
        const devs = [...new Set(ALL_PROJECTS.map(p => p.developer))].sort();
        devs.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d; opt.textContent = d;
            devSelect.appendChild(opt);
        });
    }

    // New launches and under-construction projects rank above "ready to move" /
    // established ones, so the listing leads with what's actively being sold.
    function statusWeight(p) {
        if (p.status === 'coming-soon') return 0;
        const tl = (p.tagline || '').toLowerCase();
        if (tl.includes('ready') || tl.includes('oc received')) return 2;
        return 1;
    }

    function sortList(arr) {
        const list = [...arr];
        if (activeSort === 'price-low')       list.sort((a, b) => (a.price || Number.POSITIVE_INFINITY) - (b.price || Number.POSITIVE_INFINITY));
        else if (activeSort === 'price-high') list.sort((a, b) => (b.price || 0) - (a.price || 0));
        else if (activeSort === 'az')         list.sort((a, b) => a.title.localeCompare(b.title));
        else if (activeSort === 'newest')     list.sort((a, b) => (b.date_added || '').localeCompare(a.date_added || ''));
        else if (activeSort === 'oldest')     list.sort((a, b) => (a.date_added || '').localeCompare(b.date_added || ''));
        else                                  list.sort((a, b) => statusWeight(a) - statusWeight(b));
        return list;
    }

    const pageCount = () => Math.max(1, Math.ceil(shown.length / PER_PAGE));

    // Page numbers to offer: always the first and last, and the current one with its neighbours.
    function pageList(total) {
        const want = new Set([1, total, page - 1, page, page + 1].filter(n => n >= 1 && n <= total));
        const out = [];
        [...want].sort((a, b) => a - b).forEach((n, i, arr) => {
            if (i && n - arr[i - 1] > 1) out.push(n - arr[i - 1] === 2 ? n - 1 : '…');
            out.push(n);
        });
        return out;
    }

    function renderPager() {
        if (!pager) return;
        const total = pageCount();
        pager.hidden = total < 2;
        if (total < 2) { pager.innerHTML = ''; return; }
        const arrowL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3m4-4L3 8l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        const arrowR = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        pager.innerHTML =
            (page > 1 ? `<button type="button" class="pg-step" data-page="${page - 1}" aria-label="Previous page">${arrowL}<span>Previous</span></button>` : '') +
            pageList(total).map(n => n === '…'
                ? '<span class="pg-gap" aria-hidden="true">…</span>'
                : `<button type="button" class="pg-num${n === page ? ' is-current' : ''}" data-page="${n}"${n === page ? ' aria-current="page"' : ''} aria-label="Page ${n}">${n}</button>`).join('') +
            (page < total ? `<button type="button" class="pg-step" data-page="${page + 1}" aria-label="Next page"><span>Next</span>${arrowR}</button>` : '');
    }

    function showPage(scroll) {
        page = Math.min(Math.max(1, page), pageCount());
        const from = (page - 1) * PER_PAGE;
        shown.forEach((card, i) => { card.hidden = i < from || i >= from + PER_PAGE; });
        grid?.classList.add('is-paged');
        renderPager();
        const url = new URL(window.location.href);
        if (page > 1) url.searchParams.set('page', page); else url.searchParams.delete('page');
        if (url.href !== window.location.href) history.replaceState(history.state, '', url);
        if (scroll && grid) {
            const nav = document.getElementById('navbar');
            const top = grid.getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight : 0) - 24;
            window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        }
    }

    function goTo(n) {
        if (n === page) return;
        page = n;
        const url = new URL(window.location.href);
        if (page > 1) url.searchParams.set('page', page); else url.searchParams.delete('page');
        history.pushState({ page }, '', url);
        showPage(true);
    }

    pager?.addEventListener('click', e => {
        const b = e.target.closest('button[data-page]');
        if (b) goTo(+b.dataset.page);
    });
    window.addEventListener('popstate', () => {
        page = +new URLSearchParams(window.location.search).get('page') || 1;
        showPage(true);
    });

    function applyFilters(keepPage) {
        const search   = activeSearch.toLowerCase();
        const filtered = ALL_PROJECTS.filter(p => {
            const typeMatch     = activeType === 'all' || p.category === activeType;
            const locationMatch = !activeLocation || getMicroMarket(p.location) === activeLocation;
            const devMatch      = !activeDev   || p.developer === activeDev;
            const budgetMatch   = matchBudget(p.price, activeBudget);
            const searchMatch   = !search || `${p.title} ${p.developer} ${p.location} ${p.config}`.toLowerCase().includes(search);
            return typeMatch && locationMatch && devMatch && budgetMatch && searchMatch;
        });
        const sorted = sortList(filtered);

        if (grid) grid.innerHTML = sorted.length ? sorted.map(renderCard).join('') : '';
        shown = grid ? [...grid.children] : [];
        if (keepPage !== true) page = 1;
        showPage(false);
        if (countEl) countEl.textContent = sorted.length;
        if (emptyState) emptyState.hidden = sorted.length > 0;
        if (clearBtn) clearBtn.hidden = !activeLocation && !activeDev && !activeBudget && !activeSearch
            && activeType === 'all' && activeSort === 'default';
    }

    function init() {
        typeSelect?.addEventListener('change', () => { activeType = typeSelect.value || 'all'; applyFilters(); });
        locSelect?.addEventListener('change',    () => { activeLocation = locSelect.value;    applyFilters(); });
        devSelect?.addEventListener('change',    () => { activeDev    = devSelect.value;    applyFilters(); });
        budgetSelect?.addEventListener('change', () => { activeBudget = budgetSelect.value; applyFilters(); });
        sortSelect?.addEventListener('change',   () => { activeSort   = sortSelect.value;   applyFilters(); });

        let searchTimer;
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => { activeSearch = searchInput.value; applyFilters(); }, 280);
        });

        searchBtn?.addEventListener('click', () => {
            applyFilters();
            grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        clearBtn?.addEventListener('click', () => {
            activeType = 'all'; activeLocation = ''; activeDev = ''; activeBudget = ''; activeSearch = ''; activeSort = 'default';
            if (typeSelect)   typeSelect.value   = 'all';
            if (locSelect)    locSelect.value    = '';
            if (devSelect)    devSelect.value    = '';
            if (budgetSelect) budgetSelect.value = '';
            if (sortSelect)   sortSelect.value   = 'default';
            if (searchInput)  searchInput.value  = '';
            applyFilters();
        });

        // Support links into this page like /projects?type=apartment&location=wakad&budget=100-200
        const params = new URLSearchParams(window.location.search);
        const typeParam     = params.get('type');
        const locationParam = params.get('location');
        const budgetParam   = params.get('budget');
        const searchParam   = params.get('search');
        if (typeParam && typeSelect)     { typeSelect.value = typeParam;     activeType = typeParam; }
        if (locationParam && locSelect)  { locSelect.value = locationParam;  activeLocation = locationParam; }
        if (budgetParam && budgetSelect) { budgetSelect.value = budgetParam; activeBudget = budgetParam; }
        if (searchParam && searchInput)   { searchInput.value = searchParam;   activeSearch = searchParam; }
        page = +params.get('page') || 1;

        applyFilters(true);
    }

    fetch('/properties/posts.json')
        .then(r => r.json())
        .then(data => {
            ALL_PROJECTS = data.filter(p => p.status !== 'sold-out');
            populateDeveloperDropdown();
            init();
        })
        .catch(() => {
            if (grid) grid.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:3rem">Unable to load projects. Please try again later.</p>';
        });
})();
