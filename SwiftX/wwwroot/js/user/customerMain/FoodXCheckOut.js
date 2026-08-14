// ==========================================================================
// 🛒 FOODX CHECKOUT ENGINE — PRODUCTION CONTROL SCRIPT
// ==========================================================================

// STORAGE KEYS & SYSTEM PARAMETERS
const CART_STORAGE_KEY = 'swiftx_cart_data'; // 🎯 Matched perfectly with Restaurant Storage key!
const DELIVERY_FEE = 39.00;

// Dynamic url distance setup mapping
const urlParams = new URLSearchParams(window.location.search);
const RESTAURANT_DISTANCE_KM = parseFloat(urlParams.get('distance')) || 20.4;

// Master cross-sell menu bank synced directly from restaurant catalog properties
const menuData = [
    { id: 1, name: "2-pc. Chicken McDo", price: 191, cat: "Chicken", img: "https://mcdonalds.com.ph/cms-images/Chicken%20Do_Hero.jpg" },
    { id: 2, name: "1-pc. Chicken w/ Rice", price: 99, cat: "Chicken", img: "https://mcdonalds.com.ph/cms-images/Chicken%20Do_Hero.jpg" },
    { id: 3, name: "Big Mac Meal", price: 210, cat: "Burgers", img: "https://mcdonalds.com.ph/cms-images/Big%20Mac_Hero.jpg" },
    { id: 4, name: "Cheeseburger Deluxe", price: 110, cat: "Burgers", img: "https://mcdonalds.com.ph/cms-images/Cheeseburger_Hero.jpg" },
    { id: 5, name: "Hot Fudge Sundae", price: 55, cat: "Desserts", img: "https://mcdonalds.com.ph/cms-images/Sundae_Hero.jpg" },
    { id: 6, name: "McFlurry Oreo", price: 65, cat: "Desserts", img: "https://mcdonalds.com.ph/cms-images/McFlurry_Hero.jpg" }
];

// Persistent state cache container for current checkout window
let activeRecommendations = [];

/**
 * Load cart objects from native browser local storage cache
 */
function loadCart() {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || {};
}

/**
 * Selects random items not currently present on user invoice rows
 */
function setupInitialRecommendations() {
    const cart = loadCart();
    const candidateItems = menuData.filter(item => !cart[item.id]);

    if (candidateItems.length === 0) {
        activeRecommendations = menuData.slice(0, 2);
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
    const labelNode = document.getElementById('checkout-address-label');
    const textNode = document.getElementById('checkout-address-text');
    const subNode = document.getElementById('checkout-address-sub');
    const unitNode = document.getElementById('checkout-address-unit');
    const contactNode = document.getElementById('checkout-address-contact');
    const iconNode = document.getElementById('address-icon');

    fetch('/Customer/GetDefaultAddress')
        .then(res => {
            if (res.status === 401) return null;
            return res.json();
        })
        .then(address => {
            if (address && address.id) {
                window.currentCheckoutAddress = address;

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
            } else {
                window.currentCheckoutAddress = null;
                if (labelNode) labelNode.innerText = 'No Address Selected';
                if (textNode) textNode.innerText = 'Tap to select or add your delivery location context';
                if (subNode) subNode.style.display = 'none';
                if (iconNode) iconNode.className = "ph ph-map-pin-area";
            }
        })
        .catch(e => {
            console.error("Failed to fetch default address:", e);
        });
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
                    <a href="CustomerFoodXHome" class="fxco-empty-link">Browse Menu Catalog</a>
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
        const itemMaster = menuData.find(i => i.id === id);
        cart[id] = {
            ...itemMaster,
            qty: 0,
            distance: parseFloat(RESTAURANT_DISTANCE_KM) // Propagates numeric map tracing cleanly
        };
    }

    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    renderItems(); // Refreshes both UI modules smoothly
}

/**
 * GLOBAL SYSTEM ENGINE INITIALIZATION BOOTLOADER
 */
document.addEventListener('DOMContentLoaded', () => {
    setupInitialRecommendations();   // Generate recommendation options once
    renderItems();                 // Parse and map active food elements
    updateCheckoutAddressDisplay(); // Evaluate location cache tracking states

    const reviewBtn = document.getElementById('review-btn');
    const changeDelivery = document.getElementById('change-delivery');

    if (reviewBtn) {
        reviewBtn.onclick = () => {
            const cart = loadCart();
            const hasAddress = window.currentCheckoutAddress != null;

            if (Object.keys(cart).length === 0) {
                alert("Your checkout cart is completely empty!");
                return;
            }

            if (!hasAddress) {
                alert("Please select or configure your active delivery address coordinates before proceeding.");
                return;
            }

            window.location.href = 'foodXPayment';
        };
    }

    if (changeDelivery) {
        changeDelivery.onclick = () => {
            alert("Delivery methods modal sheet triggered.");
        };
    }
});
