/**
 * PROPHUNT LLP — Projects Page JS
 * Loads properties dynamically from /properties/posts.json
 */
(function () {
    'use strict';

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
        const priceLabel = p.price_label || (p.price > 0 ? '₹' + p.price + ' L*' : 'Price on request');
        const areaSpec = p.area ? `<span><i class="fas fa-ruler-combined"></i>${p.area}</span>` : '';
        return `
        <a href="${p.url}" ${linkAttrs} class="prop-card" data-category="${p.category}" aria-label="${linkLabel}: ${p.title}">
          <div class="prop-card-img">
            <div style="background-image:url('${p.cover || ''}');">${p.cover ? '' : `<span class="prop-card-img-empty"><i class="fas fa-${icon}"></i></span>`}</div>
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

    function applyFilters() {
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

        applyFilters();
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
