/**
 * PROPHUNT LLP — Projects Page JS
 * Loads properties dynamically from /properties/posts.json
 */
(function () {
    'use strict';

    const grid        = document.getElementById('projectsGrid');
    const countEl     = document.getElementById('projectCount');
    const filterBtns  = document.querySelectorAll('.proj-filter-btn');
    const devSelect   = document.getElementById('filterDeveloper');
    const budgetSelect= document.getElementById('filterBudget');
    const sortSelect  = document.getElementById('projSort');
    const searchInput = document.getElementById('projSearch');
    const clearBtn    = document.getElementById('clearFilters');
    const emptyState  = document.getElementById('projEmpty');

    let ALL_PROJECTS  = [];
    let activeType    = 'all';
    let activeDev     = '';
    let activeBudget  = '';
    let activeSearch  = '';
    let activeSort    = 'default';

    function matchBudget(price, budget) {
        if (!budget) return true;
        if (!price || price === 0) return true;
        const map = {
            'under50':  p => p < 50,
            '50-100':   p => p >= 50 && p <= 100,
            '100-200':  p => p > 100 && p <= 200,
            '200-500':  p => p > 200 && p <= 500,
            'above500': p => p > 500
        };
        return map[budget] ? map[budget](price) : true;
    }

    function renderCard(p) {
        const isExternal = /^https?:\/\//.test(p.url);
        const linkAttrs  = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
        const linkLabel  = isExternal ? 'View Project' : 'View Details';
        const icon       = p.category === 'plot' ? 'map' : p.category === 'villa' ? 'home' : p.category === 'commercial' ? 'briefcase' : 'building';
        const statusBadge = p.status === 'coming-soon'
            ? '<span class="badge badge-gray" style="font-size:.68rem;padding:.2rem .55rem;">Coming Soon</span>'
            : p.status === 'sold-out'
            ? '<span class="badge badge-gray" style="font-size:.68rem;padding:.2rem .55rem;background:#6b7280">Sold Out</span>'
            : '';
        const priceLabel = p.price_label || (p.price > 0 ? 'Rs ' + p.price + ' L*' : 'Price on Request');
        return `
        <a href="${p.url}" ${linkAttrs} class="prop-card" data-category="${p.category}" aria-label="${linkLabel}: ${p.title}">
          <div class="prop-card-img">
            <div style="background-image:url('${p.cover || ''}');"></div>
            <div class="prop-card-badge"><span class="badge badge-red">${p.developer}</span>${statusBadge}</div>
            <div class="prop-card-price">${priceLabel}</div>
          </div>
          <div class="prop-card-body">
            <div class="prop-card-dev">${p.developer}</div>
            <h3 class="prop-card-title">${p.title}</h3>
            <p class="prop-card-loc"><i class="fas fa-map-marker-alt"></i>${p.location}</p>
            <div class="prop-card-specs">
              <span><i class="fas fa-${icon}"></i>${p.config}</span>
              <span><i class="fas fa-ruler-combined"></i>${p.area}</span>
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

    function sortList(arr) {
        const list = [...arr];
        if (activeSort === 'price-low')  list.sort((a, b) => (a.price || 0) - (b.price || 0));
        if (activeSort === 'price-high') list.sort((a, b) => (b.price || 0) - (a.price || 0));
        if (activeSort === 'az')         list.sort((a, b) => a.title.localeCompare(b.title));
        return list;
    }

    function applyFilters() {
        const search   = activeSearch.toLowerCase();
        const filtered = ALL_PROJECTS.filter(p => {
            const typeMatch   = activeType === 'all' || p.category === activeType;
            const devMatch    = !activeDev   || p.developer === activeDev;
            const budgetMatch = matchBudget(p.price, activeBudget);
            const searchMatch = !search || `${p.title} ${p.developer} ${p.location} ${p.config}`.toLowerCase().includes(search);
            return typeMatch && devMatch && budgetMatch && searchMatch;
        });
        const sorted = sortList(filtered);

        if (grid) grid.innerHTML = sorted.length ? sorted.map(renderCard).join('') : '';
        if (countEl) countEl.textContent = sorted.length;
        if (emptyState) emptyState.hidden = sorted.length > 0;
        if (clearBtn)   clearBtn.hidden   = !activeDev && !activeBudget && !activeSearch && activeType === 'all' && activeSort === 'default';
    }

    function init() {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeType = btn.dataset.type || 'all';
                applyFilters();
            });
        });

        devSelect?.addEventListener('change',    () => { activeDev    = devSelect.value;    applyFilters(); });
        budgetSelect?.addEventListener('change', () => { activeBudget = budgetSelect.value; applyFilters(); });
        sortSelect?.addEventListener('change',   () => { activeSort   = sortSelect.value;   applyFilters(); });

        let searchTimer;
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => { activeSearch = searchInput.value; applyFilters(); }, 280);
        });

        clearBtn?.addEventListener('click', () => {
            activeType = 'all'; activeDev = ''; activeBudget = ''; activeSearch = ''; activeSort = 'default';
            filterBtns.forEach(b => b.classList.toggle('active', b.dataset.type === 'all'));
            if (devSelect)    devSelect.value    = '';
            if (budgetSelect) budgetSelect.value = '';
            if (sortSelect)   sortSelect.value   = 'default';
            if (searchInput)  searchInput.value  = '';
            applyFilters();
        });

        const params    = new URLSearchParams(window.location.search);
        const typeParam = params.get('type');
        if (typeParam) {
            const matchBtn = document.querySelector(`.proj-filter-btn[data-type="${typeParam}"]`);
            if (matchBtn) { matchBtn.click(); return; }
        }

        applyFilters();
    }

    fetch('/properties/posts.json')
        .then(r => r.json())
        .then(data => {
            ALL_PROJECTS = data.filter(p => p.status !== 'sold-out' || activeType === 'all');
            populateDeveloperDropdown();
            init();
        })
        .catch(() => {
            if (grid) grid.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:3rem">Unable to load projects. Please try again later.</p>';
        });
})();
