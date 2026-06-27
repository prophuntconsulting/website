const projectProperties = [
    {
        developer: 'Godrej Properties',
        title: 'Godrej Aqua Vista',
        location: 'Keshav Nagar, Pune',
        configuration: '2 & 3 BHK',
        area: 'From 727 sqft',
        price: 96.99,
        priceLabel: 'Rs 96.99 Lakh*',
        category: 'apartment',
        image: 'images/projects/godrej-aqua-vista.jpg',
        url: 'https://godrejpropertie.com/aqua-vista/'
    },
    {
        developer: 'Godrej Properties',
        title: 'Godrej Emerald Waters',
        location: 'Pimpri, Pune',
        configuration: '2, 3 & 4 BHK',
        area: 'Premium apartments',
        price: 79,
        priceLabel: 'Rs 79 Lakh*',
        category: 'apartment',
        image: 'images/projects/godrej-emerald-waters.png',
        url: 'https://godrejpropertie.com/emerald-waters/'
    },
    {
        developer: 'Godrej Properties',
        title: 'Godrej Evergreen Square',
        location: 'Hinjewadi, Pune',
        configuration: '2 & 3 BHK',
        area: 'From 700 sqft',
        price: 89.99,
        priceLabel: 'Rs 89.99 Lakh*',
        category: 'apartment',
        image: 'images/projects/godrej-evergreen-square.png',
        url: 'https://godrejpropertie.com/evergreen-square/'
    },
    {
        developer: 'Godrej Properties',
        title: 'Godrej Aqua Retreat',
        location: 'Hinjewadi Phase 1, Pune',
        configuration: '1, 2 & 3 BHK',
        area: 'Water-inspired living',
        price: 73,
        priceLabel: 'Rs 73 Lakh*',
        category: 'apartment',
        image: 'images/projects/godrej-aqua-retreat.png',
        url: 'https://godrejpropertie.com/godrej-aqua-retreat/'
    },
    {
        developer: 'Godrej Properties',
        title: 'Godrej Hillside',
        location: 'Baner-Mahalunge Road, Pune',
        configuration: '1, 2 & 3 BHK',
        area: 'Hill-view homes',
        price: 41.6,
        priceLabel: 'Rs 41.60 Lakh*',
        category: 'apartment',
        image: 'images/projects/godrej-hillside.png',
        url: 'https://godrejpropertie.com/godrej-hillside/'
    },
    {
        developer: 'Godrej Properties',
        title: 'Godrej Serene',
        location: 'Mamurdi, Pune',
        configuration: '2 & 3 BHK',
        area: 'Premium apartments',
        price: 96.99,
        priceLabel: 'Rs 96.99 Lakh*',
        category: 'apartment',
        image: 'images/projects/godrej-serene.png',
        url: 'https://godrejpropertie.com/godrej-park-green/'
    },
    {
        developer: 'Godrej Properties',
        title: 'Godrej Park Springs',
        location: 'Kharadi-Manjari Road, Pune',
        configuration: '2 & 3 BHK',
        area: 'From 597 sqft',
        price: 78,
        priceLabel: 'Rs 78 Lakh*',
        category: 'apartment',
        image: 'images/projects/godrej-park-springs.png',
        url: 'https://godrejpropertie.com/park-springs/'
    },
    {
        developer: 'Godrej Properties',
        title: 'Godrej River Royale',
        location: 'Baner-Hinjewadi Road, Pune',
        configuration: '3 & 4.5 BHK',
        area: 'From 1,688 sqft',
        price: 265,
        priceLabel: 'Rs 2.65 Cr*',
        category: 'apartment',
        image: 'images/projects/godrej-river-royale.png',
        url: 'https://godrejpropertie.com/river-royale/'
    },
    {
        developer: 'Rohan Builders',
        title: 'Rohan Ekam',
        location: 'Balewadi, Pune',
        configuration: '2, 3 & 4 BHK',
        area: 'Sky-level living',
        price: 0,
        priceLabel: 'Price on request',
        category: 'apartment',
        image: 'images/projects/rohan-ekam-building.jpg',
        url: 'https://rohanbuilder-pune.com/rohan-ekam/'
    },
    {
        developer: 'Rohan Builders',
        title: 'Rohan Harita',
        location: 'Tathawade, Pune',
        configuration: '1, 2 & 3 BHK',
        area: 'Nature-led homes',
        price: 0,
        priceLabel: 'Price on request',
        category: 'apartment',
        image: 'images/projects/rohan-harita.png',
        url: 'https://rohanbuilder-pune.com/rohan-harita/'
    },
    {
        developer: 'Rohan Builders',
        title: 'Rohan Nidita',
        location: 'Hinjewadi, Pune',
        configuration: '2 & 3 BHK',
        area: 'Nature-inspired homes',
        price: 0,
        priceLabel: 'Price on request',
        category: 'apartment',
        image: 'images/projects/rohan-nidita.jpg',
        url: 'https://rohanbuilder-pune.com/nidita/'
    },
    {
        developer: 'Rohan Builders',
        title: 'Rohan Saroha',
        location: 'Bhugaon, Pune',
        configuration: '2, 3 & 4 BHK',
        area: 'Hillside township',
        price: 0,
        priceLabel: 'Price on request',
        category: 'apartment',
        image: 'images/projects/rohan-saroha.jpg',
        url: 'https://rohanbuilder-pune.com/rohan-saroha/'
    },
    {
        developer: 'VTP Realty',
        title: 'VTP Earth One',
        location: 'Mahalunge, Pune',
        configuration: 'Premium residences',
        area: 'Baner Next',
        price: 0,
        priceLabel: 'Price on request',
        category: 'apartment',
        image: 'images/projects/vtp-earth-one.webp',
        url: 'https://vtpnewprojects.com/vtp-earth-one/'
    },
    {
        developer: 'Mahindra Lifespaces',
        title: 'Mahindra Citadel',
        location: 'Pimpri-Chinchwad, Pune',
        configuration: '2 & 3 BHK',
        area: '7 acres open spaces',
        price: 0,
        priceLabel: 'Price on request',
        category: 'apartment',
        image: 'images/projects/mahindra-citadel.webp',
        url: 'mahindra-citadel/'
    },
    {
        developer: 'Kohinoor Group',
        title: 'Satori by Kohinoor',
        location: 'New Baner, Pune',
        configuration: '3, 4 & 4.5 BHK',
        area: 'Approx. 3 acres amenities',
        price: 0,
        priceLabel: 'Price on request',
        category: 'apartment',
        image: 'images/projects/satori.jpg',
        url: 'https://satorinewbaner.com/'
    },
    {
        developer: 'Shapoorji Pallonji',
        title: 'Shapoorji Pallonji Treetopia',
        location: 'Near Jadhavgadh Fort, Pune',
        configuration: 'NA residential plots',
        area: '1,817-6,000 sqft',
        price: 0,
        priceLabel: 'Price on request',
        category: 'plot',
        image: 'images/projects/treetopia.webp',
        url: 'treetopia/'
    },
    {
        developer: 'Tejraj Group',
        title: 'Tej Elevia',
        location: 'Baner, Pune',
        configuration: '3 BHK',
        area: '125m sky deck',
        price: 0,
        priceLabel: 'Price on request',
        category: 'apartment',
        image: 'images/projects/tej-elevia.webp',
        url: 'https://tejeleviabaner.com/'
    },
    {
        developer: 'Tribeca',
        title: 'Tribeca Lulla Nagar',
        location: 'Lulla Nagar, Pune',
        configuration: '3, 4 & 5 BHK',
        area: '40+ amenities',
        price: 0,
        priceLabel: 'Price on request',
        category: 'apartment',
        image: 'images/projects/tribeca-lulla-nagar.jpg',
        url: 'https://tribecalullanagar.co.in/'
    }
];

const propertiesGrid = document.getElementById('propertiesGrid');
const initialProjectCount = 6;
const projectBatchSize = 6;

function interleaveProjectsByDeveloper(properties) {
    const groups = new Map();
    properties.forEach(property => {
        if (!groups.has(property.developer)) groups.set(property.developer, []);
        groups.get(property.developer).push(property);
    });

    const mixed = [];
    let hasProjects = true;
    while (hasProjects) {
        hasProjects = false;
        groups.forEach(group => {
            if (group.length) {
                mixed.push(group.shift());
                hasProjects = true;
            }
        });
    }
    return mixed;
}

if (propertiesGrid) {
    const mixedProjects = interleaveProjectsByDeveloper(projectProperties);
    propertiesGrid.innerHTML = mixedProjects.map((property, index) => {
        const linkAttrs = /^https?:\/\//.test(property.url) ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `
        <article class="property-card${index >= initialProjectCount ? ' portfolio-deferred' : ''}" data-category="${property.category}" data-purpose="buy"
            data-price="${property.price}"
            data-price-label="${property.priceLabel}"
            data-developer="${property.developer}"
            data-location="${property.location}"
            data-configuration="${property.configuration}"
            data-area="${property.area}"
            data-image="${property.image}"
            data-search="${`${property.developer} ${property.title} ${property.location} ${property.configuration}`.toLowerCase()}"
            data-aos="fade-up" data-aos-delay="${(index % 3) * 100}">
            <div class="property-image-wrapper">
                <div class="property-image" style="background-image: url('${property.image}');"></div>
                <div class="property-badge">${property.developer}</div>
                <div class="property-actions">
                    <button class="action-btn" type="button" title="Add to favorites" aria-label="Add ${property.title} to favorites"><i class="far fa-heart"></i></button>
                    <button class="action-btn" type="button" title="Compare" aria-label="Compare ${property.title}"><i class="fas fa-exchange-alt"></i></button>
                </div>
                <div class="property-price">${property.priceLabel}</div>
            </div>
            <div class="property-content">
                <h3 class="property-title">${property.title}</h3>
                <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
                <div class="property-features">
                    <span><i class="fas fa-building"></i> ${property.configuration}</span>
                    <span><i class="fas fa-ruler-combined"></i> ${property.area}</span>
                </div>
                <div class="property-footer">
                    <span class="property-status">Official project page</span>
                    <a href="${property.url}"${linkAttrs} class="btn-view">View Project <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        </article>
    `;
    }).join('');

    const loadMoreWrapper = document.createElement('div');
    loadMoreWrapper.className = 'load-more-projects';
    loadMoreWrapper.innerHTML = `
        <button class="btn btn-primary btn-lg" id="loadMoreProjects" type="button">
            <span>Show more projects</span>
            <i class="fas fa-chevron-down"></i>
        </button>
    `;
    propertiesGrid.insertAdjacentElement('afterend', loadMoreWrapper);

    const loadMoreButton = loadMoreWrapper.querySelector('#loadMoreProjects');
    loadMoreButton.addEventListener('click', () => {
        const deferredCards = [...propertiesGrid.querySelectorAll('.portfolio-deferred')];
        deferredCards.slice(0, projectBatchSize).forEach(card => card.classList.remove('portfolio-deferred'));
        if (deferredCards.length <= projectBatchSize) loadMoreWrapper.hidden = true;
    });
}
