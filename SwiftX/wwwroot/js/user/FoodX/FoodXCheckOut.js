// ==========================================================================
// 🛒 FOODX CHECKOUT ENGINE — PRODUCTION CONTROL SCRIPT
// ==========================================================================

// STORAGE KEYS & SYSTEM PARAMETERS
const CART_STORAGE_KEY = 'swiftx_cart_data';
const ADDRESS_STORAGE_KEY = 'foodx_selected_address';
const DELIVERY_FEE = 39.00;

// Dynamic url distance setup mapping
const urlParams = new URLSearchParams(window.location.search);
const RESTAURANT_DISTANCE_KM = parseFloat(urlParams.get('distance')) || 20.4;

// Dynamic cross-sell menu bank loaded from store API
let crossSellMenuData = [];
let activeRecommendations = [];

/**
 * Load cart objects from native browser local storage cache
 */
function loadCart() {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || {};
}

/**
 * Fetch cross-sell menu items for the current store
 */
async function fetchCrossSellData() {
    const cart = loadCart();
    const items = Object.values(cart);
    if (items.length === 0) return;

    const storeId = items[0].storeId;
    if (!storeId) return;

    try {
        const res = await fetch(`/Customer/GetStoreMenu?storeId=${storeId}`);
        if (!res.ok) return;

        const data = await res.json();
        crossSellMenuData = (data.products || []).map(p => ({
            id: p.id,
            name: p.name,
            price: parseFloat(p.price),
            cat: p.category || 'Other',
            img: p.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200',
            storeId: storeId
        }));

        setupInitialRecommendations();
        renderItems();
    } catch (err) {
        console.error('Cross-sell fetch error:', err);
    }
}

/**
 * Selects random items not currently present on user invoice rows
 */
function setupInitialRecommendations() {
    const cart = loadCart();
    const candidateItems = crossSellMenuData.filter(item => !cart[item.id]);

    if (candidateItems.length === 0) {
        activeRecommendations = crossSellMenuData.slice(0, 2);
        return;
    }

    // Pick 2 random items safely
    const shuffled = [...candidateItems].sort(() => 0.5 - Math.random());
    activeRecommendations = shuffled.slice(0, 2);
}

/**
 * 🎯 SYNC SELECTED ADDRESS INFRASTRUCTURE 
 */
function updateCheckoutAddressDisplay() {
    const savedAddressData = localStorage.getItem(ADDRESS_STORAGE_KEY);

    const labelNode = document.getElementById('checkout-address-label');
    const textNode = document.getElementById('checkout-address-text');
    const subNode = document.getElementById('checkout-address-sub');
    const unitNode = document.getElementById('checkout-address-unit');
    const contactNode = document.getElementById('checkout-address-contact');
    const iconNode = document.getElementById('address-icon');

    if (savedAddressData) {
        try {
            const address = JSON.parse(savedAddressData);

            if (labelNode) labelNode.innerText = address.label || 'Saved Location';

            if (iconNode) {
                const labelLower = (address.label || "").toLowerCase();
                iconNode.className = "ph ph-map-pin-area";
                if (labelLower.includes("home")) iconNode.className = "ph ph-house";
                else if (labelLower.includes("work") || labelLower.includes("office")) iconNode.className = "ph ph-briefcase";
            }

            if (textNode) textNode.innerText = address.fullAddress || '';

            if (subNode && unitNode && contactNode) {
                const hasUnit = !!address.unit;
                const hasContact = !!address.name || !!address.phone;

                if (hasUnit || hasContact) {
                    unitNode.innerText = address.unit ? `Floor/Unit: ${address.unit}` : '';
                    contactNode.innerText = address.name ? `${address.name} (${address.phone || ''})` : (address.phone || '');

                    if (!hasUnit) unitNode.innerText = '';
                    if (!hasContact) contactNode.innerText = '';

                    subNode.style.display = 'block';
                } else {
                    subNode.style.display = 'none';
                }
            }
        } catch (e) {
            console.error("Failed to parse cached address state parameters:", e);
        }
    } else {
        if (labelNode) labelNode.innerText = 'No Address Selected';
        if (textNode) textNode.innerText = 'Tap to select or add your delivery location context';
        if (subNode) subNode.style.display = 'none';
        if (iconNode) iconNode.className = "ph ph-map-pin-area";
    }
}

/**
 * 🛠️ DYNAMIC ITEMS RENDERING PIPELINE (MAIN FLOW & CROSS-SELL FLOW)
 */
function renderItems() {
    const cartObj = loadCart();
    const items = Object.values(cartObj);

    const list = document.getElementById('items-list');
    const crossSellContainer = document.getElementById('cross-sell-list');
    const subtotalVal = document.getElementById('subtotal-val');
    const grandTotalVal = document.getElementById('grand-total-val');

    let subtotal = 0;

    // Render Empty States immediately if fields disappear
    if (items.length === 0) {
        if (list) {
            list.innerHTML = `
                <div class="fxco-empty-state">
                    <p>Your checkout cart has no items remaining</p>
                    <a href="/Customer/FoodXBrowse" class="fxco-empty-link">Browse Menu Catalog</a>
                </div>
            `;
        }
        if (crossSellContainer) crossSellContainer.innerHTML = "";
        if (subtotalVal) subtotalVal.innerText = `₱ 0.00`;
        if (grandTotalVal) grandTotalVal.innerText = `₱ 0.00`;
        return;
    }

    // --- Part A: Populate Main Cart Container ---
    if (list) {
        list.innerHTML = '';
        items.forEach(item => {
            const itemSubtotal = item.price * item.qty;
            subtotal += itemSubtotal;

            const div = document.createElement('div');
            div.className = 'fxco-item';
            div.innerHTML = `
                <img src="${item.img || 'https://via.placeholder.com/105'}" class="fxco-item-img" alt="${item.name || 'food item'}" onerror="this.src='https://via.placeholder.com/105'">
                <div class="fxco-item-details">
                    <div class="fxco-item-header">
                        <p class="fxco-item-name">${item.name}</p>
                        <span class="fxco-item-price">₱ ${itemSubtotal.toFixed(2)}</span>
                    </div>
                    <div class="fxco-item-controls">
                        <div class="fxco-qty-pill">
                            <button class="fxco-qty-btn fxco-minus-btn">-</button>
                            <span class="fxco-qty-num">${item.qty}</span>
                            <button class="fxco-qty-btn fxco-plus-btn">+</button>
                        </div>
                        ${item.hasSize ? `<button class="fxco-change-size-btn">Change Size</button>` : ''}
                        <button class="fxco-trash-btn" aria-label="Remove item"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
            `;
            list.appendChild(div);

            // Item actions logic mapping
            div.querySelector('.fxco-minus-btn').onclick = () => {
                if (cartObj[item.id].qty > 1) {
                    cartObj[item.id].qty--;
                } else {
                    delete cartObj[item.id];
                }
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartObj));
                renderItems();
            };

            div.querySelector('.fxco-plus-btn').onclick = () => {
                cartObj[item.id].qty++;
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartObj));
                renderItems();
            };

            div.querySelector('.fxco-trash-btn').onclick = () => {
                delete cartObj[item.id];
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartObj));
                renderItems();
            };
        });
    }

    // --- Part B: Financial Numeric Updates ---
    if (subtotalVal) subtotalVal.innerText = `₱ ${subtotal.toFixed(2)}`;
    if (grandTotalVal) grandTotalVal.innerText = `₱ ${(subtotal + DELIVERY_FEE).toFixed(2)}`;

    // --- Part C: Populate Cross-Sell Section ---
    if (crossSellContainer) {
        crossSellContainer.innerHTML = "";

        activeRecommendations.forEach(item => {
            const currentQty = cartObj[item.id] ? cartObj[item.id].qty : 0;

            const actionButtonNode = currentQty > 0 ?
                `<div class="fxco-cross-qty-pill">
                    <button class="fxco-cross-qty-btn" onclick="updateCrossSellQty(${item.id}, -1)">-</button>
                    <span>${currentQty}</span>
                    <button class="fxco-cross-qty-btn" onclick="updateCrossSellQty(${item.id}, 1)">+</button>
                </div>` :
                `<button class="fxco-cross-add-btn" onclick="updateCrossSellQty(${item.id}, 1)">+ Add</button>`;

            const crossSellItemRow = document.createElement('div');
            crossSellItemRow.className = 'fxco-cross-item-card';
            crossSellItemRow.innerHTML = `
                <div class="fxco-cross-item-left">
                    <img class="fxco-cross-item-img" src="${item.img}" onerror="this.src='https://via.placeholder.com/52'">
                    <div class="fxco-cross-item-info">
                        <h5>${item.name}</h5>
                        <div class="fxco-cross-item-price">₱ ${item.price.toFixed(2)}</div>
                    </div>
                </div>
                <div>${actionButtonNode}</div>
            `;
            crossSellContainer.appendChild(crossSellItemRow);
        });
    }
}

/**
 * Updates item quantity states coming directly out of cross-sell interactions
 */
function updateCrossSellQty(id, delta) {
    let cart = loadCart();

    if (!cart[id]) {
        const itemMaster = crossSellMenuData.find(i => i.id === id);
        if (!itemMaster) return;
        cart[id] = {
            ...itemMaster,
            qty: 0,
            distance: parseFloat(RESTAURANT_DISTANCE_KM)
        };
    }

    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    renderItems();
}

/**
 * GLOBAL SYSTEM ENGINE INITIALIZATION BOOTLOADER
 */
document.addEventListener('DOMContentLoaded', async () => {
    renderItems();
    updateCheckoutAddressDisplay();
    await fetchCrossSellData();

    const reviewBtn = document.getElementById('review-btn');
    const changeDelivery = document.getElementById('change-delivery');

    if (reviewBtn) {
        reviewBtn.onclick = () => {
            const cart = loadCart();
            const hasAddress = localStorage.getItem(ADDRESS_STORAGE_KEY);

            if (Object.keys(cart).length === 0) {
                alert("Your checkout cart is completely empty!");
                return;
            }

            if (!hasAddress) {
                alert("Please select or configure your active delivery address coordinates before proceeding.");
                return;
            }

            window.location.href = 'FoodXPayment';
        };
    }

    if (changeDelivery) {
        changeDelivery.onclick = () => {
            alert("Delivery methods modal sheet triggered.");
        };
    }
});
