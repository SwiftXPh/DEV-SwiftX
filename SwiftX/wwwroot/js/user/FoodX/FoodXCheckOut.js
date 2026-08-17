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
async function updateCheckoutAddressDisplay() {
    let savedAddressData = localStorage.getItem(ADDRESS_STORAGE_KEY);

    // If no address is cached in localStorage, automatically attempt to fetch the default address
    if (!savedAddressData) {
        try {
            const res = await fetch('/Customer/GetDefaultAddress');
            if (res.ok) {
                const defaultAddress = await res.json();
                if (defaultAddress && defaultAddress.id) {
                    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(defaultAddress));
                    savedAddressData = JSON.stringify(defaultAddress);
                }
            }
        } catch (err) {
            console.error("Failed to auto-fetch default address:", err);
        }
    }

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
 * 🏠 ADDRESS MODAL ENGINE & SELECTION HANDLER
 */
let isAddressModalOpen = false;

function openAddressModal() {
    const overlay = document.getElementById('address-modal-overlay');
    if (!overlay) return;

    isAddressModalOpen = true;
    overlay.style.display = 'flex';
    // Trigger CSS animation on next tick
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);

    loadSavedAddresses();
}

function closeAddressModal() {
    const overlay = document.getElementById('address-modal-overlay');
    if (!overlay) return;

    isAddressModalOpen = false;
    overlay.classList.remove('active');
    setTimeout(() => {
        if (!isAddressModalOpen) {
            overlay.style.display = 'none';
        }
    }, 300);
}

async function loadSavedAddresses() {
    const listContainer = document.getElementById('address-list-container');
    const emptyState = document.getElementById('address-empty-state');
    if (!listContainer) return;

    // Show skeletons while loading
    listContainer.innerHTML = `
        <div class="fxco-sheet-skeleton"></div>
        <div class="fxco-sheet-skeleton"></div>
    `;
    if (emptyState) emptyState.style.display = 'none';

    try {
        const res = await fetch('/Customer/GetAddresses');
        if (!res.ok) throw new Error("Failed to load addresses");
        const addresses = await res.json();

        renderAddressModalList(addresses);
    } catch (err) {
        console.error("Error loading addresses for modal:", err);
        listContainer.innerHTML = `<div style="text-align: center; color: #ff6b6b; padding: 20px;">Failed to load addresses. Please try again.</div>`;
    }
}

function renderAddressModalList(addresses) {
    const listContainer = document.getElementById('address-list-container');
    const emptyState = document.getElementById('address-empty-state');
    if (!listContainer) return;

    if (!addresses || addresses.length === 0) {
        listContainer.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Get current selected address ID
    let currentSelectedId = null;
    try {
        const saved = localStorage.getItem(ADDRESS_STORAGE_KEY);
        if (saved) {
            currentSelectedId = JSON.parse(saved).id;
        }
    } catch (e) {}

    listContainer.innerHTML = '';

    addresses.forEach(addr => {
        const isSelected = currentSelectedId ? addr.id === currentSelectedId : !!addr.isDefault;

        // Pick icon
        const labelLower = (addr.label || "").toLowerCase();
        let iconClass = "ph ph-map-pin-area";
        if (labelLower.includes("home")) iconClass = "ph ph-house";
        else if (labelLower.includes("work") || labelLower.includes("office")) iconClass = "ph ph-briefcase";

        const card = document.createElement('div');
        card.className = `fxco-sheet-address-card ${isSelected ? 'selected' : ''}`;
        card.setAttribute('data-id', addr.id);

        const metaDetails = [
            addr.unit ? `Unit/Floor: ${addr.unit}` : '',
            addr.name ? `${addr.name} (${addr.phone || ''})` : (addr.phone || '')
        ].filter(Boolean).join(' • ');

        card.innerHTML = `
            <div class="fxco-sheet-card-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="fxco-sheet-card-info">
                <div class="fxco-sheet-card-header">
                    <span class="fxco-sheet-card-label">${addr.label || 'Saved Location'}</span>
                    ${addr.isDefault ? `<span class="fxco-sheet-default-badge">Default</span>` : ''}
                </div>
                <div class="fxco-sheet-card-address">${addr.fullAddress || ''}</div>
                ${metaDetails ? `<div class="fxco-sheet-card-meta">${metaDetails}</div>` : ''}
            </div>
            <div class="fxco-sheet-check-indicator">
                <i class="ph-bold ph-check"></i>
            </div>
        `;

        card.onclick = () => {
            selectDeliveryAddress(addr);
        };

        listContainer.appendChild(card);
    });
}

function selectDeliveryAddress(address) {
    // Save to local storage for checkout session
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(address));

    // Update UI highlight inside modal
    const cards = document.querySelectorAll('.fxco-sheet-address-card');
    cards.forEach(c => {
        if (parseInt(c.getAttribute('data-id')) === address.id) {
            c.classList.add('selected');
        } else {
            c.classList.remove('selected');
        }
    });

    // Update main checkout screen display
    updateCheckoutAddressDisplay();

    // Close modal after brief visual confirmation
    setTimeout(() => {
        closeAddressModal();
    }, 180);
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

    // Setup Address Selection Modal Triggers
    const addressBox = document.getElementById('address-box');
    const closeAddressModalBtn = document.getElementById('close-address-modal');
    const addressModalOverlay = document.getElementById('address-modal-overlay');

    if (addressBox) {
        addressBox.onclick = () => {
            openAddressModal();
        };
        addressBox.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openAddressModal();
            }
        };
    }

    if (closeAddressModalBtn) {
        closeAddressModalBtn.onclick = () => {
            closeAddressModal();
        };
    }

    if (addressModalOverlay) {
        addressModalOverlay.onclick = (e) => {
            if (e.target === addressModalOverlay) {
                closeAddressModal();
            }
        };
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isAddressModalOpen) {
            closeAddressModal();
        }
    });

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
