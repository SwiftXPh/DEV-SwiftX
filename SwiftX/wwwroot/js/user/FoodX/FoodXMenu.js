// FoodXMenu.js — v2.0.0
// Store menu page (backed by database API)

const STORAGE_KEY = 'swiftx_cart_data';

// Distance from URL param
const urlParams = new URLSearchParams(window.location.search);
const RESTAURANT_DISTANCE = parseFloat(urlParams.get('distance')) || 20.4;
const storeId = urlParams.get('storeId') || urlParams.get('merchantId');

let menuData = [];
let storeInfo = null;
let categories = [];
let currentCat = '';

// ══════════════════════════════════════════════════════════
// FETCH MENU FROM API
// ══════════════════════════════════════════════════════════
async function fetchMenu() {
    if (!storeId) {
        window.location.href = '/Customer/FoodXBrowse';
        return;
    }

    try {
        const res = await fetch(`/Customer/GetStoreMenu?storeId=${storeId}`);
        if (!res.ok) {
            throw new Error('Failed to load menu');
        }

        const data = await res.json();
        storeInfo = data.store;
        menuData = data.products || [];
        categories = data.categories || [];

        // Populate store info header
        const nameEl = document.getElementById('fxm-store-name');
        const metaEl = document.getElementById('fxm-store-meta');
        const bannerImg = document.getElementById('fxm-banner-img');
        const logoImg = document.getElementById('fxm-logo-img');

        if (nameEl) nameEl.textContent = storeInfo.name;
        if (metaEl) metaEl.textContent = storeInfo.category ? `${storeInfo.category} • ${storeInfo.address}` : storeInfo.address;
        if (bannerImg && storeInfo.coverUrl) bannerImg.src = storeInfo.coverUrl;
        if (logoImg && storeInfo.logoUrl) logoImg.src = storeInfo.logoUrl;

        // Build category tabs dynamically
        buildCategoryTabs();

        // Default to first category if available
        if (categories.length > 0) {
            currentCat = categories[0];
        }

        render();
    } catch (err) {
        console.error('Menu fetch error:', err);
        const list = document.getElementById('menu-list');
        if (list) {
            list.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;opacity:0.6;">
                    <i class="ph ph-warning-circle" style="font-size:2.5rem;"></i>
                    <p style="margin-top:0.5rem;">Unable to load store menu. Please try again later.</p>
                </div>
            `;
        }
    }
}

// ══════════════════════════════════════════════════════════
// BUILD CATEGORY TABS
// ══════════════════════════════════════════════════════════
function buildCategoryTabs() {
    const tabsContainer = document.getElementById('fxm-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';

    if (categories.length <= 1) {
        tabsContainer.style.display = 'none';
        return;
    }

    tabsContainer.style.display = 'flex';

    categories.forEach((cat, index) => {
        const tab = document.createElement('div');
        tab.className = 'fxm-tab' + (index === 0 ? ' active' : '');
        tab.textContent = cat;
        tab.addEventListener('click', () => switchTab(cat, tab));
        tabsContainer.appendChild(tab);
    });
}

// ══════════════════════════════════════════════════════════
// RENDER MENU LIST
// ══════════════════════════════════════════════════════════
function render() {
    const list = document.getElementById('menu-list');
    if (!list) return;

    const cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    list.innerHTML = '';

    const itemsToDisplay = (categories.length <= 1 || !currentCat)
        ? menuData
        : menuData.filter(item => item.category === currentCat);

    if (itemsToDisplay.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem;opacity:0.6;">
                <i class="ph ph-bowl-food" style="font-size:2.5rem;"></i>
                <p style="margin-top:0.5rem;">No items available in this category.</p>
            </div>
        `;
        updateCartBadge();
        return;
    }

    itemsToDisplay.forEach(item => {
        const qty = cart[item.id]?.qty ?? 0;

        const actionControl = qty > 0
            ? `<div class="fxm-qty-pill">
                   <button onclick="changeQty(${item.id}, -1)">-</button>
                   <span>${qty}</span>
                   <button onclick="changeQty(${item.id}, 1)">+</button>
               </div>`
            : `<button class="fxm-add-btn" onclick="changeQty(${item.id}, 1)">+</button>`;

        const row = document.createElement('div');
        row.className = 'fxm-item';
        row.innerHTML = `
            <div class="fxm-item__info">
                <img class="fxm-item__img"
                     src="${item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200'}"
                     alt="${item.name}"
                     onerror="this.src='https://via.placeholder.com/65'">
                <div>
                    <p class="fxm-item__name"></p>
                    <p class="fxm-item__price">&#8369;${parseFloat(item.price).toFixed(2)}</p>
                    ${item.description ? `<p style="font-size:11px;opacity:0.6;margin-top:2px;">${item.description}</p>` : ''}
                </div>
            </div>
            ${actionControl}
        `;

        // XSS safe
        row.querySelector('.fxm-item__name').textContent = item.name;

        list.appendChild(row);
    });

    updateCartBadge();
}

// ══════════════════════════════════════════════════════════
// CHANGE QUANTITY
// ══════════════════════════════════════════════════════════
function changeQty(id, delta) {
    const cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

    if (!cart[id]) {
        const item = menuData.find(i => i.id === id);
        if (!item) return;
        cart[id] = {
            ...item,
            qty: 0,
            storeId: parseInt(storeId),
            distance: parseFloat(RESTAURANT_DISTANCE)
        };
    }

    cart[id].qty += delta;

    if (cart[id].qty <= 0) {
        delete cart[id];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    render();
}

// ══════════════════════════════════════════════════════════
// SWITCH CATEGORY TAB
// ══════════════════════════════════════════════════════════
function switchTab(cat, el) {
    currentCat = cat;
    document.querySelectorAll('.fxm-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    render();
}

// ══════════════════════════════════════════════════════════
// UPDATE CART BADGE
// ══════════════════════════════════════════════════════════
function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const total = Object.values(cart).reduce((sum, i) => sum + i.qty, 0);

    if (total > 0) {
        badge.textContent = total;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// ══════════════════════════════════════════════════════════
// NAV BUTTONS & INITIALIZATION
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fxmBackBtn')?.addEventListener('click', () => {
        window.location.href = '/Customer/FoodXBrowse';
    });

    document.getElementById('fxmCartBtn')?.addEventListener('click', () => {
        window.location.href = '/Customer/FoodXCart';
    });

    fetchMenu();
});

// Expose tab/qty functions for inline onclick in JS-generated HTML
window.switchTab = switchTab;
window.changeQty = changeQty;
