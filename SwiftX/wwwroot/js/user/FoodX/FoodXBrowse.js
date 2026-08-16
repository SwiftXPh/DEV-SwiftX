// FoodXBrowse.js — v2.0.0
// Restaurant browsing/listing page (backed by database API)

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

    let restaurants = [];

    // ══════════════════════════════════════════════════════════
    // CART BUTTON
    // ══════════════════════════════════════════════════════════
    cartBtn?.addEventListener('click', () => {
        window.location.href = '/Customer/FoodXCart';
    });


    // ══════════════════════════════════════════════════════════
    // FETCH STORES FROM API
    // ══════════════════════════════════════════════════════════
    async function fetchStores() {
        try {
            const res = await fetch('/Customer/GetStores');
            if (!res.ok) throw new Error('Failed to fetch stores');
            const data = await res.json();

            restaurants = data.map(s => ({
                id          : String(s.id),
                name        : s.name.toLowerCase(),
                displayName : s.name,
                type        : (s.category || '').toLowerCase(),
                category    : s.category || '',
                address     : s.address || '',
                url         : `/Customer/FoodXMenu?storeId=${s.id}`,
                img         : s.coverUrl || s.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600'
            }));

            initDefaultFeeds();
        } catch (err) {
            console.error('Error fetching stores:', err);
            if (defaultFeedsWrapper) {
                defaultFeedsWrapper.innerHTML = `
                    <div style="text-align:center;padding:3rem 1rem;opacity:0.6;">
                        <i class="ph ph-warning-circle" style="font-size:2.5rem;"></i>
                        <p style="margin-top:0.5rem;">Unable to load stores at the moment. Please try again later.</p>
                    </div>
                `;
            }
        }
    }


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
                ${item.category ? `<div class="fxb-card__distance">${item.category}</div>` : ''}
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

        if (restaurants.length === 0) {
            defaultFeedsWrapper.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;opacity:0.6;">
                    <i class="ph ph-storefront" style="font-size:2.5rem;"></i>
                    <p style="margin-top:0.5rem;">No active restaurants available right now.</p>
                </div>
            `;
            return;
        }

        // Featured / Top Restaurants section if > 1
        if (restaurants.length > 2) {
            const orderSection  = document.createElement('div');
            orderSection.className = 'fxb-section';

            const orderTitle    = document.createElement('h2');
            orderTitle.className = 'fxb-section-title';
            orderTitle.textContent = 'Popular Stores';

            const orderRow      = document.createElement('div');
            orderRow.className  = 'fxb-row';

            restaurants.slice(0, 3).forEach(item => orderRow.appendChild(createCard(item)));

            orderSection.appendChild(orderTitle);
            orderSection.appendChild(orderRow);
            defaultFeedsWrapper.appendChild(orderSection);
        }

        // All Restaurants
        const restSection   = document.createElement('div');
        restSection.className = 'fxb-section';

        const restTitle     = document.createElement('h2');
        restTitle.className = 'fxb-section-title';
        restTitle.textContent = 'All Stores';

        const restGrid      = document.createElement('div');
        restGrid.className  = 'fxb-grid';

        restaurants.forEach(item => restGrid.appendChild(createCard(item)));

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

            const matches = restaurants.filter(r =>
                r.name.includes(query) || r.type.includes(query) || r.displayName.toLowerCase().includes(query)
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
    fetchStores();

});
