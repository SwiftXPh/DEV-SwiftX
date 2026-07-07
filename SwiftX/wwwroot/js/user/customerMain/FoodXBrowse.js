// FoodXBrowse.js — v2.0.0
// Restaurant browsing/listing page

document.addEventListener('DOMContentLoaded', () => {

    // ══════════════════════════════════════════════════════════
    // ELEMENTS
    // ══════════════════════════════════════════════════════════
    const root                   = document.getElementById('homepage-root');
    const searchInput            = document.getElementById('merchant-search-input');
    const defaultFeedsWrapper    = document.getElementById('default-feeds-wrapper');
    const searchResultsContainer = document.getElementById('search-results-container');
    const searchResultsFeed      = document.getElementById('search-results-feed');
    const searchQueryText        = document.getElementById('search-query-text');
    const cartBtn                = document.getElementById('fxbCartBtn');


    // ══════════════════════════════════════════════════════════
    // CART BUTTON
    // ══════════════════════════════════════════════════════════
    cartBtn?.addEventListener('click', () => {
        window.location.href = '/Customer/FoodXCart';
    });


    // ══════════════════════════════════════════════════════════
    // MOCK DATA
    // TODO: replace with fetch from backend API
    // ══════════════════════════════════════════════════════════
    const MOCK_RESTAURANTS = [
        {
            id          : '1',
            name        : 'jollibee',
            displayName : 'Jollibee - Don Carlos',
            type        : 'fast food, chicken, burgers, spaghetti',
            distance    : '1.2 km',
            url         : '/Customer/FoodXMenu?merchantId=1',
            img         : 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=600'
        },
        {
            id          : '2',
            name        : "mcdonald's mcdo",
            displayName : "McDonald's - Bukidnon Highway",
            type        : 'fast food, burgers, fries, chicken',
            distance    : '2.5 km',
            url         : '/Customer/FoodXMenu?merchantId=2',
            img         : 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600'
        },
        {
            id          : '3',
            name        : 'chowking',
            displayName : 'Chowking - Poblacion',
            type        : 'chinese, fast food, lauriat, chao fan, halo-halo',
            distance    : '0.8 km',
            url         : '/Customer/FoodXMenu?merchantId=3',
            img         : 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=600'
        }
    ];


    // ══════════════════════════════════════════════════════════
    // CARD FACTORY
    // ══════════════════════════════════════════════════════════
    function createCard(item) {
        const card = document.createElement('div');
        card.className = 'fxb-card';
        card.setAttribute('data-id', item.id);

        card.addEventListener('click', () => {
            window.location.href = item.url;
        });

        card.innerHTML = `
            <div class="fxb-card__banner">
                <img src="${item.img}"
                     alt="${item.displayName}"
                     onerror="this.src='https://via.placeholder.com/400x140'">
                ${item.distance ? `<div class="fxb-card__distance">${item.distance}</div>` : ''}
            </div>
            <div class="fxb-card__info">
                <h3></h3>
            </div>
        `;

        // XSS safe
        card.querySelector('h3').textContent = item.displayName;

        return card;
    }


    // ══════════════════════════════════════════════════════════
    // DEFAULT FEEDS (Order Again + Restaurants)
    // ══════════════════════════════════════════════════════════
    function initDefaultFeeds() {
        if (!defaultFeedsWrapper) return;
        defaultFeedsWrapper.innerHTML = '';

        // Order Again
        const orderSection  = document.createElement('div');
        orderSection.className = 'fxb-section';

        const orderTitle    = document.createElement('h2');
        orderTitle.className = 'fxb-section-title';
        orderTitle.textContent = 'Order Again';

        const orderRow      = document.createElement('div');
        orderRow.className  = 'fxb-row';

        MOCK_RESTAURANTS.slice(0, 2).forEach(item => orderRow.appendChild(createCard(item)));

        orderSection.appendChild(orderTitle);
        orderSection.appendChild(orderRow);
        defaultFeedsWrapper.appendChild(orderSection);

        // All Restaurants
        const restSection   = document.createElement('div');
        restSection.className = 'fxb-section';

        const restTitle     = document.createElement('h2');
        restTitle.className = 'fxb-section-title';
        restTitle.textContent = 'Restaurants';

        const restGrid      = document.createElement('div');
        restGrid.className  = 'fxb-grid';

        MOCK_RESTAURANTS.forEach(item => restGrid.appendChild(createCard(item)));

        restSection.appendChild(restTitle);
        restSection.appendChild(restGrid);
        defaultFeedsWrapper.appendChild(restSection);
    }


    // ══════════════════════════════════════════════════════════
    // LIVE SEARCH
    // ══════════════════════════════════════════════════════════
    searchInput?.addEventListener('input', () => {
        const raw   = searchInput.value;
        const query = raw.trim().toLowerCase();

        if (query.length > 0) {
            root?.classList.add('is-searching');
            if (defaultFeedsWrapper) defaultFeedsWrapper.style.display = 'none';
            if (searchResultsContainer) searchResultsContainer.style.display = 'block';
            if (searchQueryText) searchQueryText.textContent = raw;

            searchResultsFeed.innerHTML = '';

            const matches = MOCK_RESTAURANTS.filter(r =>
                r.name.includes(query) || r.type.includes(query)
            );

            if (matches.length > 0) {
                matches.forEach(item => searchResultsFeed.appendChild(createCard(item)));
            } else {
                const empty = document.createElement('p');
                empty.className   = 'fxb-search-empty';
                empty.textContent = `No restaurants found matching "${raw}"`;
                searchResultsFeed.appendChild(empty);
            }

        } else {
            root?.classList.remove('is-searching');
            if (defaultFeedsWrapper) defaultFeedsWrapper.style.display = 'block';
            if (searchResultsContainer) searchResultsContainer.style.display = 'none';
            searchResultsFeed.innerHTML = '';
        }
    });


    // ══════════════════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════════════════
    try {
        initDefaultFeeds();
    } catch (err) {
        console.error('FoodXBrowse init error:', err);
    }

});
