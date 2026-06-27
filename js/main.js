/**
 * PROPHUNT LLP - 3D Real Estate Website
 * Brand: भूमिं मृगयध्वम् | Hunt the Land
 * Interactive JavaScript with 3D Scroll Effects, Animations & Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    const storage = {
        get(key, fallback = null) {
            try {
                const value = localStorage.getItem(key);
                return value === null ? fallback : JSON.parse(value);
            } catch (_) {
                return fallback;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (_) {
                // The site remains usable when storage is unavailable.
            }
        }
    };

    // ==========================================
    // THEME FORCED TO LIGHT MODE
    // ==========================================
    document.documentElement.dataset.theme = 'light';

    // ==========================================
    // INITIAL ANIMATIONS
    // ==========================================
    animateHeroElements();

    // ==========================================
    // NAVBAR SCROLL EFFECT
    // ==========================================
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });

    // ==========================================
    // MOBILE MENU
    // ==========================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
    
    function openMobileMenu() {
        mobileMenuBtn.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMobileMenu() {
        mobileMenuBtn.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    mobileMenuBtn.addEventListener('click', openMobileMenu);
    mobileMenuClose.addEventListener('click', closeMobileMenu);
    
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === mobileMenuOverlay) {
            closeMobileMenu();
        }
    });

    // ==========================================
    // SMOOTH SCROLL & ACTIVE NAV LINK
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav-links a');
    const sectionIds = [...new Set([...navLinks]
        .map(link => link.getAttribute('href'))
        .filter(href => href && href.startsWith('#'))
        .map(href => href.slice(1)))];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // ==========================================
    // HERO ANIMATIONS
    // ==========================================
    function animateHeroElements() {
        const heroElements = document.querySelectorAll('.hero-content > *');
        heroElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            setTimeout(() => {
                el.style.transition = 'all 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // ==========================================
    // COUNTER ANIMATION
    // ==========================================
    const counters = document.querySelectorAll('.stat-number');
    let countersAnimated = false;
    
    function animateCounters() {
        if (countersAnimated) return;
        
        const statsSection = document.querySelector('.hero-stats');
        const statsTop = statsSection.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (statsTop < windowHeight - 100) {
            countersAnimated = true;
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-count'));
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;
                
                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = Math.floor(current).toLocaleString();
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target.toLocaleString() + '+';
                    }
                };
                
                updateCounter();
            });
        }
    }
    
    window.addEventListener('scroll', animateCounters);

    // ==========================================
    // PARTICLES SYSTEM
    // ==========================================
    const particlesContainer = document.getElementById('heroParticles');
    
    function createParticles() {
        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (10 + Math.random() * 10) + 's';
            particle.style.width = (2 + Math.random() * 4) + 'px';
            particle.style.height = particle.style.width;
            particle.style.opacity = 0.2 + Math.random() * 0.5;
            particlesContainer.appendChild(particle);
        }
    }
    
    createParticles();

    // ==========================================
    // PARALLAX 3D EFFECT ON HERO
    // ==========================================
    const heroImageLayer = document.getElementById('heroImageLayer');
    const heroFrameSequence = document.getElementById('heroFrameSequence');
    const heroSection = document.getElementById('hero');
    const heroFrameTotal = 300;
    const heroFramePath = (index) => `images/hero-frames/ezgif-frame-${String(index).padStart(3, '0')}.png`;
    let currentHeroFrame = 1;

    function setHeroFrame(index) {
        if (!heroFrameSequence) return;
        const nextFrame = Math.min(heroFrameTotal, Math.max(1, index));
        if (nextFrame === currentHeroFrame) return;
        currentHeroFrame = nextFrame;
        heroFrameSequence.src = heroFramePath(nextFrame);
    }

    // Smart progressive preloader: loads nearby frames first, then batches the rest
    const heroFrameCache = {};
    let heroPreloadQueue = [];
    let heroPreloading = false;

    function preloadFrame(index) {
        return new Promise((resolve) => {
            if (heroFrameCache[index]) { resolve(); return; }
            const img = new Image();
            img.onload = img.onerror = () => {
                heroFrameCache[index] = true;
                resolve();
            };
            img.src = heroFramePath(index);
        });
    }

    async function processPreloadQueue() {
        if (heroPreloading) return;
        heroPreloading = true;
        const BATCH_SIZE = 6;
        while (heroPreloadQueue.length > 0) {
            const batch = heroPreloadQueue.splice(0, BATCH_SIZE);
            await Promise.all(batch.map(preloadFrame));
            // Small pause between batches to avoid network congestion
            await new Promise(r => setTimeout(r, 50));
        }
        heroPreloading = false;
    }

    function preloadHeroFrames() {
        if (!heroFrameSequence) return;
        // Phase 1: Load key frames immediately (every 10th frame for fast scrubbing)
        const keyFrames = [];
        for (let i = 1; i <= heroFrameTotal; i += 10) {
            keyFrames.push(i);
        }
        keyFrames.push(heroFrameTotal);
        heroPreloadQueue = keyFrames;
        processPreloadQueue().then(() => {
            // Phase 2: Fill in all remaining frames
            const remaining = [];
            for (let i = 1; i <= heroFrameTotal; i++) {
                if (!heroFrameCache[i]) remaining.push(i);
            }
            heroPreloadQueue = remaining;
            processPreloadQueue();
        });
    }

    let heroRAF = null;
    function updateHeroParallax() {
        if (!heroSection) return;
        const heroTop = heroSection.offsetTop;
        const heroScrollable = Math.max(heroSection.offsetHeight - window.innerHeight, 1);
        const progress = Math.min(Math.max((window.pageYOffset - heroTop) / heroScrollable, 0), 1);
        const frame = Math.round(1 + progress * (heroFrameTotal - 1));

        if (heroImageLayer) {
            heroImageLayer.style.transform = 'translateZ(0)';
        }

        if (heroFrameSequence) {
            setHeroFrame(frame);
            heroFrameSequence.style.transform = 'translateZ(0)';
        }
    }
    
    window.addEventListener('scroll', () => {
        if (heroRAF) cancelAnimationFrame(heroRAF);
        heroRAF = requestAnimationFrame(updateHeroParallax);
    });

    // ==========================================
    // PROPERTY FILTERING
    // ==========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const propertyCards = document.querySelectorAll('.property-card');
    const propertyEmpty = document.getElementById('propertyEmpty');
    let activeCategory = 'all';
    let activePurpose = 'buy';
    let activeSearch = '';
    let activeType = '';
    let activeBudget = '';

    function matchesBudget(price, budget) {
        if (!budget) return true;
        if (price === 0) return true; // Show "Price on request" properties for all budgets
        if (budget === '50l') return price < 50;
        if (budget === '50-1cr') return price >= 50 && price <= 100;
        if (budget === '1-2cr') return price > 100 && price <= 200;
        if (budget === '2-5cr') return price > 200 && price <= 500;
        return price > 500;
    }

    let skeletonTimeout = null;
    function triggerSkeletonLoading(onComplete) {
        const grid = document.getElementById('propertiesGrid');
        if (!grid) {
            onComplete();
            return;
        }

        const cards = [...grid.querySelectorAll('.property-card')];
        cards.forEach(card => card.style.display = 'none');
        
        const loadMoreWrapper = document.querySelector('.load-more-projects');
        if (loadMoreWrapper) loadMoreWrapper.style.display = 'none';
        if (propertyEmpty) propertyEmpty.hidden = true;

        const skeletonCount = window.innerWidth > 992 ? 3 : (window.innerWidth > 768 ? 2 : 1);
        let skeletonHtml = '';
        for (let i = 0; i < skeletonCount; i++) {
            skeletonHtml += `
                <div class="skeleton-card" aria-hidden="true">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line title"></div>
                        <div class="skeleton-line text"></div>
                        <div class="skeleton-line features"></div>
                        <div class="skeleton-line text" style="width: 40%"></div>
                    </div>
                </div>
            `;
        }
        
        const skeletonContainer = document.createElement('div');
        skeletonContainer.className = 'skeleton-container-wrapper';
        skeletonContainer.style.cssText = 'display: contents;';
        skeletonContainer.innerHTML = skeletonHtml;
        grid.appendChild(skeletonContainer);

        if (skeletonTimeout) clearTimeout(skeletonTimeout);

        skeletonTimeout = setTimeout(() => {
            skeletonContainer.remove();
            cards.forEach(card => card.style.display = '');
            if (loadMoreWrapper) loadMoreWrapper.style.display = '';
            onComplete();
        }, 450);
    }

    function applyPropertyFilters() {
        let visibleCount = 0;
        const hasActiveFilters = activeCategory !== 'all' || activePurpose !== 'buy' || activeSearch || activeType || activeBudget;
        const loadMoreProjects = document.querySelector('.load-more-projects');
        if (loadMoreProjects) loadMoreProjects.hidden = Boolean(hasActiveFilters);

        // Show a nudge banner when Rent/Commercial tab is active (all properties are for sale)
        let nudgeBanner = document.getElementById('purposeNudgeBanner');
        if (activePurpose !== 'buy') {
            if (!nudgeBanner) {
                nudgeBanner = document.createElement('p');
                nudgeBanner.id = 'purposeNudgeBanner';
                nudgeBanner.className = 'search-feedback';
                nudgeBanner.style.cssText = 'text-align:center;padding:0.75rem 1rem;';
                const grid = document.getElementById('propertiesGrid');
                grid.parentElement.insertBefore(nudgeBanner, grid);
            }
            const label = activePurpose === 'rent' ? 'rental' : 'commercial';
            nudgeBanner.innerHTML = `Showing all active projects &mdash; for ${label} enquiries please <a href="#contact" style="color:var(--primary);font-weight:600;">contact us</a>.`;
        } else if (nudgeBanner) {
            nudgeBanner.remove();
        }

        propertyCards.forEach(card => {
            const category = card.dataset.category;
            const searchText = card.dataset.search.toLowerCase();
            const price = Number(card.dataset.price);
            const categoryMatch = activeCategory === 'all' || category === activeCategory;
            const typeMatch = !activeType || category === activeType || (activeType === 'office' && category === 'commercial');
            const searchMatch = !activeSearch || searchText.includes(activeSearch);
            const visible = categoryMatch && typeMatch && searchMatch && matchesBudget(price, activeBudget);

            card.classList.toggle('hidden', !visible);
            if (hasActiveFilters && visible) card.classList.remove('portfolio-deferred');
            if (visible) visibleCount += 1;
        });
        propertyEmpty.hidden = visibleCount !== 0;
        return visibleCount;
    }
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (activeCategory === btn.getAttribute('data-filter')) return;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            activeCategory = btn.getAttribute('data-filter');
            triggerSkeletonLoading(() => {
                applyPropertyFilters();
            });
        });
    });

    // ==========================================
    // FAVORITE BUTTON TOGGLE
    // ==========================================
    const actionBtns = document.querySelectorAll('.action-btn');
    const compareTray = document.getElementById('compareTray');
    const compareItems = document.getElementById('compareItems');
    const compareNow = document.getElementById('compareNow');
    const clearCompare = document.getElementById('clearCompare');
    const comparisonSection = document.getElementById('comparisonSection');
    const comparisonTable = document.getElementById('comparisonTable');
    let favorites = storage.get('prophunt-favorites', []);
    let compared = [];

    function getPropertyData(btn) {
        const card = btn.closest('.property-card');
        return {
            card,
            title: card.querySelector('.property-title').textContent.trim(),
            url: card.querySelector('.btn-view').href,
            developer: card.dataset.developer,
            location: card.dataset.location,
            configuration: card.dataset.configuration,
            area: card.dataset.area,
            price: Number(card.dataset.price),
            priceLabel: card.dataset.priceLabel,
            category: card.dataset.category,
            image: card.dataset.image
        };
    }

    function renderCompare() {
        compareItems.textContent = compared.length ? `${compared.length} of 2 selected: ${compared.map(item => item.title).join(' vs ')}` : 'Select 2 projects';
        compareTray.classList.toggle('active', compared.length > 0);
        compareNow.disabled = compared.length !== 2;
    }

    function formatCategory(category) {
        return category === 'plot' ? 'Residential plot' : 'Residential apartment';
    }

    function renderComparisonTable() {
        if (compared.length !== 2) return;
        const [first, second] = compared;
        const linkAttrs = url => /^https?:\/\//.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
        const lowerPrice = first.price > 0 && second.price > 0
            ? (first.price < second.price ? 0 : first.price > second.price ? 1 : -1)
            : -1;
        const rows = [
            ['Developer', first.developer, second.developer],
            ['Location', first.location, second.location],
            ['Configuration', first.configuration, second.configuration],
            ['Area / Highlight', first.area, second.area],
            ['Starting Price', first.priceLabel, second.priceLabel, 'price'],
            ['Property Type', formatCategory(first.category), formatCategory(second.category)]
        ];

        comparisonTable.innerHTML = `
            <table class="project-comparison-table">
                <thead>
                    <tr>
                        <th scope="col">Project detail</th>
                        ${[first, second].map(item => `
                            <th scope="col">
                                <img src="${item.image}" alt="${item.title}">
                                <span>${item.developer}</span>
                                <h3>${item.title}</h3>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map((row, rowIndex) => `
                        <tr>
                            <th scope="row">${row[0]}</th>
                            <td class="${row[3] === 'price' && lowerPrice === 0 ? 'comparison-best' : ''}">${row[1]}</td>
                            <td class="${row[3] === 'price' && lowerPrice === 1 ? 'comparison-best' : ''}">${row[2]}</td>
                        </tr>
                    `).join('')}
                    <tr class="comparison-actions-row">
                        <th scope="row">Official details</th>
                        <td><a class="btn btn-primary" href="${first.url}"${linkAttrs(first.url)}>View ${first.title}</a></td>
                        <td><a class="btn btn-primary" href="${second.url}"${linkAttrs(second.url)}>View ${second.title}</a></td>
                    </tr>
                </tbody>
            </table>
            <p class="comparison-disclaimer">Prices and specifications are taken from the linked project websites and may change. Confirm current availability with the project team.</p>
            <div class="comparison-footer-actions">
                <a class="btn btn-outline btn-dark" id="changeComparison" href="#properties">Change projects</a>
                <button class="btn btn-primary" id="clearComparisonFromTable" type="button">Clear comparison</button>
            </div>
        `;
        comparisonSection.hidden = false;
        comparisonTable.querySelector('#changeComparison').addEventListener('click', () => {
            closeComparison();
            compareTray.classList.add('active');
        });
        comparisonTable.querySelector('#clearComparisonFromTable').addEventListener('click', () => clearCompare.click());
    }

    const closeComparisonModalBtn = document.getElementById('closeComparisonModal');

    function openComparisonModal() {
        comparisonSection.hidden = false;
        void comparisonSection.offsetWidth;
        comparisonSection.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeComparison() {
        comparisonSection.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (!comparisonSection.classList.contains('active')) {
                comparisonSection.hidden = true;
            }
        }, 400);
    }

    if (closeComparisonModalBtn) {
        closeComparisonModalBtn.addEventListener('click', closeComparison);
    }

    comparisonSection.addEventListener('click', (e) => {
        if (e.target === comparisonSection) {
            closeComparison();
        }
    });

    actionBtns.forEach(btn => {
        const property = getPropertyData(btn);
        if (btn.title === 'Add to favorites' && favorites.includes(property.url)) {
            btn.classList.add('active');
            btn.querySelector('i').className = 'fas fa-heart';
            btn.title = 'Remove from favorites';
        }

        btn.addEventListener('click', () => {
            const item = getPropertyData(btn);
            if (btn.title.includes('favorites')) {
                const isFavorite = favorites.includes(item.url);
                favorites = isFavorite ? favorites.filter(url => url !== item.url) : [...favorites, item.url];
                storage.set('prophunt-favorites', favorites);
                btn.classList.toggle('active', !isFavorite);
                btn.querySelector('i').className = isFavorite ? 'far fa-heart' : 'fas fa-heart';
                btn.title = isFavorite ? 'Add to favorites' : 'Remove from favorites';
            } else {
                const existingIndex = compared.findIndex(entry => entry.url === item.url);
                if (existingIndex >= 0) {
                    compared.splice(existingIndex, 1);
                    btn.classList.remove('active');
                } else if (compared.length < 2) {
                    compared.push(item);
                    btn.classList.add('active');
                } else {
                    compared.shift();
                    document.querySelectorAll('.action-btn[title="Compare"]').forEach(compareBtn => compareBtn.classList.remove('active'));
                    compared.push(item);
                    compared.forEach(entry => {
                        const selected = [...document.querySelectorAll('.property-card')].find(card => card.querySelector('.btn-view').href === entry.url);
                        selected?.querySelector('.action-btn[title="Compare"]')?.classList.add('active');
                    });
                }
                renderCompare();
                if (!comparisonSection.hidden) {
                    if (compared.length === 2) renderComparisonTable();
                    else closeComparison();
                }
            }
        });
    });

    compareNow.addEventListener('click', () => {
        if (compared.length !== 2) return;
        renderComparisonTable();
        compareTray.classList.remove('active');
        openComparisonModal();
    });

    clearCompare.addEventListener('click', () => {
        compared = [];
        document.querySelectorAll('.action-btn[title="Compare"]').forEach(btn => btn.classList.remove('active'));
        closeComparison();
        setTimeout(() => {
            comparisonTable.innerHTML = '';
        }, 400);
        renderCompare();
    });

    // ==========================================
    // SEARCH TABS
    // ==========================================
    const searchTabs = document.querySelectorAll('.search-tab');
    
    searchTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (activePurpose === tab.dataset.tab) return;
            searchTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activePurpose = tab.dataset.tab;
            triggerSkeletonLoading(() => {
                applyPropertyFilters();
            });
        });
    });

    const propertySearchForm = document.getElementById('propertySearchForm');
    const searchFeedback = document.getElementById('searchFeedback');
    propertySearchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        activeSearch = document.getElementById('propertyLocation').value.trim().toLowerCase();
        activeType = document.getElementById('propertyType').value;
        activeBudget = document.getElementById('propertyBudget').value;
        
        triggerSkeletonLoading(() => {
            const count = applyPropertyFilters();
            searchFeedback.textContent = `${count} matching ${count === 1 ? 'property' : 'properties'} found.`;
        });
        document.getElementById('properties').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ==========================================
    // TESTIMONIALS SLIDER
    // ==========================================
    const testimonialsTrack = document.getElementById('testimonialsTrack');
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    const dotsContainer = document.getElementById('testimonialsDots');
    
    let currentSlide = 0;
    let autoSlideInterval;
    
    // Create dots
    testimonialCards.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'testimonial-dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    const dots = document.querySelectorAll('.testimonial-dot');
    
    function getSlidesPerView() {
        return window.innerWidth > 992 ? 2 : 1;
    }
    
    function goToSlide(index) {
        const slidesPerView = getSlidesPerView();
        const maxSlide = testimonialCards.length - slidesPerView;
        
        currentSlide = Math.max(0, Math.min(index, maxSlide));
        
        const slideWidth = testimonialCards[0].offsetWidth + 32; // gap
        testimonialsTrack.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }
    
    prevBtn.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
        resetAutoSlide();
    });
    
    nextBtn.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
        resetAutoSlide();
    });
    
    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            const slidesPerView = getSlidesPerView();
            const maxSlide = testimonialCards.length - slidesPerView;
            
            if (currentSlide >= maxSlide) {
                goToSlide(0);
            } else {
                goToSlide(currentSlide + 1);
            }
        }, 5000);
    }
    
    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }
    
    startAutoSlide();
    
    // Handle resize
    window.addEventListener('resize', () => {
        goToSlide(currentSlide);
    });

    // ==========================================
    // CONTACT FORM
    // ==========================================
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const copyFallbackText = document.getElementById('copyFallbackText');
    const btnCopyFallback = document.getElementById('btnCopyFallback');
    const btnResetForm = document.getElementById('btnResetForm');
    
    let generatedEnquiryText = '';

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('.btn-submit');
        const fields = Object.fromEntries(new FormData(contactForm).entries());
        const subjectStr = `Property enquiry from ${fields.firstName} ${fields.lastName}`;
        const bodyLines = [
            `Name: ${fields.firstName} ${fields.lastName}`,
            `Email: ${fields.email}`,
            `Phone: ${fields.phone || 'Not provided'}`,
            `Interest: ${fields.interest || 'Not specified'}`,
            '',
            fields.message || 'Please contact me about available properties.'
        ];
        const bodyStr = bodyLines.join('\n');
        
        generatedEnquiryText = `To: info@prophuntllp.com\nSubject: ${subjectStr}\n\n${bodyStr}`;
        if (copyFallbackText) {
            copyFallbackText.value = generatedEnquiryText;
        }

        submitBtn.disabled = true;
        window.location.href = `mailto:info@prophuntllp.com?subject=${encodeURIComponent(subjectStr)}&body=${encodeURIComponent(bodyStr)}`;
        contactForm.style.display = 'none';
        formSuccess.classList.add('active');
    });

    if (btnCopyFallback) {
        btnCopyFallback.addEventListener('click', () => {
            if (copyFallbackText) {
                copyFallbackText.select();
                navigator.clipboard.writeText(copyFallbackText.value).then(() => {
                    const originalText = btnCopyFallback.innerHTML;
                    btnCopyFallback.innerHTML = '<i class="fas fa-check"></i> <span>Copied!</span>';
                    btnCopyFallback.style.borderColor = '#12833c';
                    btnCopyFallback.style.color = '#12833c';
                    setTimeout(() => {
                        btnCopyFallback.innerHTML = originalText;
                        btnCopyFallback.style.borderColor = '';
                        btnCopyFallback.style.color = '';
                    }, 2000);
                }).catch(() => {
                    alert('Please copy the text manually from the textbox.');
                });
            }
        });
    }

    if (btnResetForm) {
        btnResetForm.addEventListener('click', () => {
            formSuccess.classList.remove('active');
            contactForm.style.display = 'block';
            contactForm.reset();
            const submitBtn = contactForm.querySelector('.btn-submit');
            if (submitBtn) submitBtn.disabled = false;
        });
    }

    // ==========================================
    // NEWSLETTER FORM
    // ==========================================
    const newsletterForm = document.getElementById('newsletterForm');
    
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = newsletterForm.querySelector('button');
        const originalIcon = btn.innerHTML;
        const email = newsletterForm.elements.newsletterEmail.value;
        
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.background = 'var(--accent)';
        window.location.href = `mailto:info@prophuntllp.com?subject=${encodeURIComponent('Newsletter subscription')}&body=${encodeURIComponent(`Please subscribe ${email} to PROPHUNT property updates.`)}`;
        
        setTimeout(() => {
            btn.innerHTML = originalIcon;
            btn.style.background = '';
            newsletterForm.reset();
        }, 2000);
    });

    // ==========================================
    // BACK TO TOP BUTTON
    // ==========================================
    const backToTop = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ==========================================
    // SCROLL ANIMATIONS (AOS-like)
    // ==========================================
    const animatedElements = document.querySelectorAll('[data-aos]');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-aos-delay');
                if (delay) {
                    setTimeout(() => {
                        entry.target.classList.add('aos-animate');
                    }, parseInt(delay));
                } else {
                    entry.target.classList.add('aos-animate');
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // ==========================================
    // 3D TILT EFFECT ON PROPERTY CARDS
    // ==========================================
    function initTiltEffect() {
        if (window.innerWidth <= 768) return; // Disable on mobile
        
        const cards = document.querySelectorAll('.property-card');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }
    
    // Initialize tilt after page load
    setTimeout(initTiltEffect, 2000);

    // ==========================================
    // SCROLL REVEAL FOR SECTIONS
    // ==========================================
    function revealOnScroll() {
        const reveals = document.querySelectorAll('.section-header');
        
        reveals.forEach(el => {
            const windowHeight = window.innerHeight;
            const elementTop = el.getBoundingClientRect().top;
            
            if (elementTop < windowHeight - 100) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    }
    
    window.addEventListener('scroll', revealOnScroll);

    // ==========================================
    // HERO IMAGE PARALLAX WITH MOUSE MOVE
    // ==========================================
    const hero = document.querySelector('.hero');
    
    hero.addEventListener('mouseleave', () => {
        updateHeroParallax();
    });

    updateHeroParallax();
    preloadHeroFrames();

    // ==========================================
    // FLOATING ELEMENTS PARALLAX
    // ==========================================
    const floatingElements = document.querySelectorAll('[data-parallax="float"]');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        floatingElements.forEach(el => {
            const speed = 0.3;
            const yPos = scrollY * speed;
            el.style.transform = `translateY(${yPos}px)`;
        });
    });

    // ==========================================
    // FEATURE CARD ICON SPIN ON HOVER
    // ==========================================
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const icon = card.querySelector('.feature-card-icon');
            icon.style.transform = 'rotateY(360deg)';
        });
        
        card.addEventListener('mouseleave', () => {
            const icon = card.querySelector('.feature-card-icon');
            icon.style.transform = '';
        });
    });

    // ==========================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================
    // MAGNETIC BUTTON EFFECT
    // ==========================================
    const magneticBtns = document.querySelectorAll('.btn-primary, .btn-outline');
    
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            if (window.innerWidth <= 768) return;
            
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    // ==========================================
    // TEXT SCRAMBLE EFFECT ON HERO LOAD
    // ==========================================
    function scrambleText(element, finalText, duration = 1000) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let iteration = 0;
        const interval = setInterval(() => {
            element.textContent = finalText
                .split('')
                .map((char, index) => {
                    if (index < iteration) {
                        return finalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');
            
            if (iteration >= finalText.length) {
                clearInterval(interval);
            }
            iteration += 1 / 3;
        }, duration / finalText.length / 3);
    }

    // ==========================================
    // SCROLL PROGRESS INDICATOR
    // ==========================================
    function createScrollProgress() {
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: var(--gradient-1);
            z-index: 10000;
            transition: width 0.1s ease;
        `;
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = progress + '%';
        });
    }
    
    createScrollProgress();

    // ==========================================
    // CUSTOM CURSOR (Desktop only)
    // ==========================================
    if (window.innerWidth > 1024) {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            border: 2px solid var(--primary);
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999;
            transition: transform 0.1s ease, opacity 0.3s ease;
            transform: translate(-50%, -50%);
            opacity: 0;
        `;
        document.body.appendChild(cursor);
        
        const cursorDot = document.createElement('div');
        cursorDot.className = 'custom-cursor-dot';
        cursorDot.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: var(--primary);
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999;
            transform: translate(-50%, -50%);
            opacity: 0;
        `;
        document.body.appendChild(cursorDot);
        
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            cursor.style.opacity = '1';
            
            cursorDot.style.left = e.clientX + 'px';
            cursorDot.style.top = e.clientY + 'px';
            cursorDot.style.opacity = '1';
        });
        
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
            cursorDot.style.opacity = '0';
        });
        
        // Scale cursor on hoverable elements
        const hoverables = document.querySelectorAll('a, button, .property-card, .feature-card');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
                cursor.style.borderColor = 'var(--secondary)';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursor.style.borderColor = 'var(--primary)';
            });
        });
    }

    // ==========================================
    // LAZY LOAD IMAGES
    // ==========================================
    const lazyImages = document.querySelectorAll('.property-image, .city-image, .about-img');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.5s ease';
                
                setTimeout(() => {
                    img.style.opacity = '1';
                }, 100);
                
                imageObserver.unobserve(img);
            }
        });
    }, { threshold: 0.1 });
    
    lazyImages.forEach(img => imageObserver.observe(img));

    // ==========================================
    // KEYBOARD NAVIGATION
    // ==========================================
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });

    // ==========================================
    // PERFORMANCE: Pause animations when tab hidden
    // ==========================================
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(autoSlideInterval);
        } else {
            startAutoSlide();
        }
    });

    // ==========================================
    // INTERACTIVE VIRTUAL TOUR MOCKUP
    // ==========================================
    const phoneTourView = document.getElementById('phoneTourView');
    if (phoneTourView) {
        const hotspots = phoneTourView.querySelectorAll('.tour-hotspot');
        const roomImages = {
            'Living Room': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=800&fit=crop',
            'Kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=800&fit=crop',
            'Bedroom': 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=800&fit=crop'
        };

        // Mark the first one as active initially
        const firstHotspot = hotspots[0];
        if (firstHotspot) firstHotspot.classList.add('active');

        hotspots.forEach(hotspot => {
            hotspot.addEventListener('click', (e) => {
                e.stopPropagation();
                hotspots.forEach(h => h.classList.remove('active'));
                hotspot.classList.add('active');
                const room = hotspot.getAttribute('data-room');
                if (roomImages[room]) {
                    phoneTourView.style.backgroundImage = `url('${roomImages[room]}')`;
                }
            });
        });

        // Panoramic panning
        let isDragging = false;
        let startX, startY;
        let currentPercentX = 50;
        let currentPercentY = 50;

        phoneTourView.addEventListener('pointerdown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            phoneTourView.setPointerCapture(e.pointerId);
        });

        phoneTourView.addEventListener('pointermove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                startX = e.clientX;
                startY = e.clientY;

                currentPercentX = Math.max(0, Math.min(100, currentPercentX - (deltaX / phoneTourView.offsetWidth) * 100));
                currentPercentY = Math.max(0, Math.min(100, currentPercentY - (deltaY / phoneTourView.offsetHeight) * 100));
                phoneTourView.style.backgroundPosition = `${currentPercentX}% ${currentPercentY}%`;
            } else if (window.innerWidth > 768) {
                // Hover panning on desktop
                const rect = phoneTourView.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                phoneTourView.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
            }
        });

        phoneTourView.addEventListener('pointerup', (e) => {
            isDragging = false;
            phoneTourView.releasePointerCapture(e.pointerId);
        });

        phoneTourView.addEventListener('pointercancel', () => {
            isDragging = false;
        });

        phoneTourView.addEventListener('pointerleave', () => {
            if (!isDragging) {
                phoneTourView.style.backgroundPosition = '50% 50%';
            }
        });
    }

    // ==========================================
    // CONSOLE BRANDING
    // ==========================================
    console.log('%c PROPHUNT LLP ', 'background: linear-gradient(135deg, #e14747, #c0392b); color: white; font-size: 24px; padding: 10px 20px; border-radius: 10px; font-family: Montserrat, sans-serif; font-weight: 800;');
    console.log('%c भूमिं मृगयध्वम् | Hunt the Land ', 'color: #e14747; font-size: 14px; font-family: Montserrat, sans-serif;');
    console.log('%c Premium Real Estate Solutions ', 'color: #1a1a1a; font-size: 14px; font-family: Inter, sans-serif;');
});

// ==========================================
// RESIZE HANDLER (Debounced)
// ==========================================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Recalculate any dimension-dependent values
        const event = new Event('scroll');
        window.dispatchEvent(event);
    }, 250);
});
