/**
 * PROPHUNT LLP — Projects Page JS
 */
(function () {
    'use strict';

    const ALL_PROJECTS = [
        { developer:'Godrej Properties',   title:'Godrej River Royale',      location:'Baner–Hinjewadi Rd, Pune', config:'3 & 4.5 BHK',        area:'From 1,688 sqft',    price:265,  priceLabel:'Rs 2.65 Cr*',       category:'apartment', img:'images/projects/godrej-river-royale.png',     url:'https://godrejpropertie.com/river-royale/' },
        { developer:'Godrej Properties',   title:'Godrej Aqua Vista',        location:'Keshav Nagar, Pune',      config:'2 & 3 BHK',           area:'From 727 sqft',      price:96.99,priceLabel:'Rs 96.99 L*',        category:'apartment', img:'images/projects/godrej-aqua-vista.jpg',       url:'https://godrejpropertie.com/aqua-vista/' },
        { developer:'Godrej Properties',   title:'Godrej Emerald Waters',    location:'Pimpri, Pune',            config:'2, 3 & 4 BHK',        area:'Premium apartments', price:79,   priceLabel:'Rs 79 L*',           category:'apartment', img:'images/projects/godrej-emerald-waters.png',   url:'https://godrejpropertie.com/emerald-waters/' },
        { developer:'Godrej Properties',   title:'Godrej Evergreen Square',  location:'Hinjewadi, Pune',         config:'2 & 3 BHK',           area:'From 700 sqft',      price:89.99,priceLabel:'Rs 89.99 L*',        category:'apartment', img:'images/projects/godrej-evergreen-square.png', url:'https://godrejpropertie.com/evergreen-square/' },
        { developer:'Godrej Properties',   title:'Godrej Aqua Retreat',      location:'Hinjewadi Phase 1, Pune', config:'1, 2 & 3 BHK',        area:'Water-inspired living',price:73,  priceLabel:'Rs 73 L*',           category:'apartment', img:'images/projects/godrej-aqua-retreat.png',     url:'https://godrejpropertie.com/godrej-aqua-retreat/' },
        { developer:'Godrej Properties',   title:'Godrej Hillside',          location:'Baner-Mahalunge Rd, Pune',config:'1, 2 & 3 BHK',        area:'Hill-view homes',    price:41.6, priceLabel:'Rs 41.60 L*',        category:'apartment', img:'images/projects/godrej-hillside.png',         url:'https://godrejpropertie.com/godrej-hillside/' },
        { developer:'Godrej Properties',   title:'Godrej Serene',            location:'Mamurdi, Pune',           config:'2 & 3 BHK',           area:'Premium apartments', price:96.99,priceLabel:'Rs 96.99 L*',        category:'apartment', img:'images/projects/godrej-serene.png',           url:'https://godrejpropertie.com/godrej-park-green/' },
        { developer:'Godrej Properties',   title:'Godrej Park Springs',      location:'Kharadi–Manjari Rd, Pune',config:'2 & 3 BHK',           area:'From 597 sqft',      price:78,   priceLabel:'Rs 78 L*',           category:'apartment', img:'images/projects/godrej-park-springs.png',     url:'https://godrejpropertie.com/park-springs/' },
        { developer:'Rohan Builders',      title:'Rohan Ekam',               location:'Balewadi, Pune',          config:'2, 3 & 4 BHK',        area:'Sky-level living',   price:0,    priceLabel:'Price on Request',   category:'apartment', img:'images/projects/rohan-ekam-building.jpg',     url:'https://rohanbuilder-pune.com/rohan-ekam/' },
        { developer:'Rohan Builders',      title:'Rohan Harita',             location:'Tathawade, Pune',         config:'1, 2 & 3 BHK',        area:'Nature-led homes',   price:0,    priceLabel:'Price on Request',   category:'apartment', img:'images/projects/rohan-harita.png',            url:'https://rohanbuilder-pune.com/rohan-harita/' },
        { developer:'Rohan Builders',      title:'Rohan Nidita',             location:'Hinjewadi, Pune',         config:'2 & 3 BHK',           area:'Nature-inspired',    price:0,    priceLabel:'Price on Request',   category:'apartment', img:'images/projects/rohan-nidita.jpg',            url:'https://rohanbuilder-pune.com/nidita/' },
        { developer:'Rohan Builders',      title:'Rohan Saroha',             location:'Bhugaon, Pune',           config:'2, 3 & 4 BHK',        area:'Hillside township',  price:0,    priceLabel:'Price on Request',   category:'apartment', img:'images/projects/rohan-saroha.jpg',            url:'https://rohanbuilder-pune.com/rohan-saroha/' },
        { developer:'VTP Realty',          title:'VTP Earth One',            location:'Mahalunge, Pune',         config:'Premium residences',  area:'Baner Next',         price:0,    priceLabel:'Price on Request',   category:'apartment', img:'images/projects/vtp-earth-one.webp',          url:'https://vtpnewprojects.com/vtp-earth-one/' },
        { developer:'Mahindra Lifespaces', title:'Mahindra Citadel',         location:'Pimpri-Chinchwad, Pune',  config:'2 & 3 BHK',           area:'7 acres open spaces',price:0,    priceLabel:'Price on Request',   category:'apartment', img:'images/projects/mahindra-citadel.webp',       url:'mahindra-citadel/' },
        { developer:'Kohinoor Group',      title:'Satori by Kohinoor',       location:'New Baner, Pune',         config:'3, 4 & 4.5 BHK',      area:'~3 acres amenities', price:0,    priceLabel:'Price on Request',   category:'apartment', img:'images/projects/satori.jpg',                  url:'https://satorinewbaner.com/' },
        { developer:'Shapoorji Pallonji',  title:'SP Treetopia',             location:'Jadhavwadi, East Pune',   config:'NA Villa Plots',      area:'1,817–6,000 sqft',   price:84,   priceLabel:'Rs 84 L*',           category:'plot',      img:'images/projects/treetopia.webp',              url:'treetopia/' },
        { developer:'Tejraj Group',        title:'Tej Elevia',               location:'Baner, Pune',             config:'3 BHK',               area:'125m Sky Deck',      price:0,    priceLabel:'Price on Request',   category:'apartment', img:'images/projects/tej-elevia.webp',             url:'https://tejeleviabaner.com/' },
        { developer:'Tribeca',             title:'Tribeca Lulla Nagar',      location:'Lulla Nagar, Pune',       config:'3, 4 & 5 BHK',        area:'40+ amenities',      price:0,    priceLabel:'Price on Request',   category:'apartment', img:'images/projects/tribeca-lulla-nagar.jpg',     url:'https://tribecalullanagar.co.in/' },
    ];

    const grid          = document.getElementById('projectsGrid');
    const countEl       = document.getElementById('projectCount');
    const filterBtns    = document.querySelectorAll('.proj-filter-btn');
    const devSelect     = document.getElementById('filterDeveloper');
    const budgetSelect  = document.getElementById('filterBudget');
    const searchInput   = document.getElementById('projSearch');
    const clearBtn      = document.getElementById('clearFilters');
    const emptyState    = document.getElementById('projEmpty');

    let activeType  = 'all';
    let activeDev   = '';
    let activeBudget = '';
    let activeSearch = '';

    // Populate developer dropdown
    if (devSelect) {
        const devs = [...new Set(ALL_PROJECTS.map(p => p.developer))].sort();
        devs.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d; opt.textContent = d;
            devSelect.appendChild(opt);
        });
    }

    function matchBudget(price, budget) {
        if (!budget) return true;
        if (price === 0) return true;
        const map = { 'under50': p => p < 50, '50-100': p => p >= 50 && p <= 100, '100-200': p => p > 100 && p <= 200, '200-500': p => p > 200 && p <= 500, 'above500': p => p > 500 };
        return map[budget] ? map[budget](price) : true;
    }

    function renderCard(p) {
        const external = /^https?:\/\//.test(p.url);
        const linkAttrs = external ? 'target="_blank" rel="noopener noreferrer"' : '';
        return `
        <article class="prop-card" data-category="${p.category}">
          <div class="prop-card-img">
            <div style="background-image:url('${p.img}');"></div>
            <div class="prop-card-badge"><span class="badge badge-red">${p.developer}</span></div>
            <div class="prop-card-price">${p.priceLabel}</div>
          </div>
          <div class="prop-card-body">
            <div class="prop-card-dev">${p.developer}</div>
            <h3 class="prop-card-title">${p.title}</h3>
            <p class="prop-card-loc"><i class="fas fa-map-marker-alt"></i>${p.location}</p>
            <div class="prop-card-specs">
              <span><i class="fas fa-${p.category === 'plot' ? 'map' : 'building'}"></i>${p.config}</span>
              <span><i class="fas fa-ruler-combined"></i>${p.area}</span>
            </div>
            <div class="prop-card-footer">
              <span class="prop-card-status">Official project page</span>
              <a href="${p.url}" ${linkAttrs} class="prop-card-link">View Project <i class="fas fa-arrow-right"></i></a>
            </div>
          </div>
        </article>`;
    }

    function applyFilters() {
        const search = activeSearch.toLowerCase();
        const filtered = ALL_PROJECTS.filter(p => {
            const typeMatch   = activeType === 'all' || p.category === activeType;
            const devMatch    = !activeDev  || p.developer === activeDev;
            const budgetMatch = matchBudget(p.price, activeBudget);
            const searchMatch = !search || `${p.title} ${p.developer} ${p.location} ${p.config}`.toLowerCase().includes(search);
            return typeMatch && devMatch && budgetMatch && searchMatch;
        });

        if (grid) {
            grid.innerHTML = filtered.length ? filtered.map(renderCard).join('') : '';
        }
        if (countEl) countEl.textContent = filtered.length;
        if (emptyState) emptyState.hidden = filtered.length > 0;
        if (clearBtn) clearBtn.hidden = !activeDev && !activeBudget && !activeSearch && activeType === 'all';
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeType = btn.dataset.type || 'all';
            applyFilters();
        });
    });

    devSelect?.addEventListener('change', () => { activeDev = devSelect.value; applyFilters(); });
    budgetSelect?.addEventListener('change', () => { activeBudget = budgetSelect.value; applyFilters(); });

    let searchTimer;
    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { activeSearch = searchInput.value; applyFilters(); }, 280);
    });

    clearBtn?.addEventListener('click', () => {
        activeType = 'all'; activeDev = ''; activeBudget = ''; activeSearch = '';
        filterBtns.forEach(b => b.classList.toggle('active', b.dataset.type === 'all'));
        if (devSelect) devSelect.value = '';
        if (budgetSelect) budgetSelect.value = '';
        if (searchInput) searchInput.value = '';
        applyFilters();
    });

    // Handle ?type= URL param
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    if (typeParam) {
        const matchBtn = document.querySelector(`.proj-filter-btn[data-type="${typeParam}"]`);
        if (matchBtn) { matchBtn.click(); return; }
    }

    applyFilters();
})();
