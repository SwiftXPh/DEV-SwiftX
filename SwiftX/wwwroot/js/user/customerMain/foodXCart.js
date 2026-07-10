// FoodXCart.js — v2.0.0

const STORAGE_KEY = 'swiftx_cart_data';
const MAX_DELIVERY_RADIUS_KM = 20.0;

function getCart() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
function saveCart(cart) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

// ══════════════════════════════════════════════════════════
// DISTANCE WARNING
// ══════════════════════════════════════════════════════════
function checkDistanceWarning(cart) {
    const overlay = document.getElementById('distance-warning-overlay');
    if (!overlay) return;

    const items = Object.values(cart);
    if (!items.length) { overlay.style.display = 'none'; return; }

    const maxDist = Math.max(...items.map(i => parseFloat(i.distance || i.restaurantDistance || 0)));

    overlay.style.display = maxDist > MAX_DELIVERY_RADIUS_KM ? 'flex' : 'none';
}


// ══════════════════════════════════════════════════════════
// RENDER CART
// ══════════════════════════════════════════════════════════
function renderCart() {
    const list = document.getElementById('cart-items-list');
    const totalDisplay = document.getElementById('cart-total-price');
    if (!list) return;

    const cart = getCart();
    const items = Object.values(cart);
    let grandTotal = 0;

    checkDistanceWarning(cart);
    list.innerHTML = '';

    if (!items.length) {
        list.innerHTML = `
            <div class="fxc-empty">
                <i class="ph ph-shopping-cart"></i>
                <p>Your cart is empty</p>
                <a href="/Customer/FoodXBrowse">Browse Menu</a>
            </div>`;
        if (totalDisplay) totalDisplay.textContent = '₱ 0.00';
        return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        const subtotal = item.price * item.qty;
        grandTotal += subtotal;

        const card = document.createElement('div');
        card.className = 'fxc-card';
        card.innerHTML = `
            <img class="fxc-card__img"
                 src="${item.img || ''}"
                 alt=""
                 onerror="this.src='https://via.placeholder.com/78'">
            <div class="fxc-card__body">
                <div class="fxc-card__top">
                    <p class="fxc-card__name"></p>
                    <button class="fxc-card__delete" aria-label="Remove item">
                        <i class="ph ph-x"></i>
                    </button>
                </div>
                <div class="fxc-card__bottom">
                    <div class="fxc-qty-pill">
                        <button class="fxc-qty-btn fxc-minus">-</button>
                        <span>${item.qty}</span>
                        <button class="fxc-qty-btn fxc-plus">+</button>
                    </div>
                    <span class="fxc-card__price">&#8369;${subtotal.toFixed(2)}</span>
                </div>
            </div>`;

        // XSS safe
        card.querySelector('.fxc-card__name').textContent = item.name;

        card.querySelector('.fxc-minus').addEventListener('click', () => updateQty(item.id, -1));
        card.querySelector('.fxc-plus').addEventListener('click', () => updateQty(item.id, 1));
        card.querySelector('.fxc-card__delete').addEventListener('click', () => deleteItem(item.id));

        fragment.appendChild(card);
    });

    list.appendChild(fragment);
    if (totalDisplay) totalDisplay.textContent = `₱ ${grandTotal.toFixed(2)}`;
}


// ══════════════════════════════════════════════════════════
// CART MUTATIONS
// ══════════════════════════════════════════════════════════
function updateQty(id, delta) {
    const cart = getCart();
    if (!cart[id]) return;
    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];
    saveCart(cart);
    renderCart();
}

function deleteItem(id) {
    const cart = getCart();
    delete cart[id];
    saveCart(cart);
    renderCart();
}


// ══════════════════════════════════════════════════════════
// NAVIGATION TRAIL (back button smart redirect)
// ══════════════════════════════════════════════════════════
function trackNavigationTrail() {
    const referrer = document.referrer.toLowerCase();
    if (referrer.includes('foodxbrowse') || referrer.includes('customerfoodxhome')) {
        sessionStorage.setItem('cart_origin', '/Customer/FoodXBrowse');
    } else if (referrer.includes('foodxmenu') || referrer.includes('foodxrestaurant')) {
        sessionStorage.setItem('cart_origin', document.referrer);
    }
}


// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    trackNavigationTrail();
    renderCart();

    // Back button
    document.getElementById('back-btn')?.addEventListener('click', () => {
        const referrer = document.referrer.toLowerCase();
        const savedOrigin = sessionStorage.getItem('cart_origin');

        if (referrer.includes('foodxcheckout') && savedOrigin) {
            window.location.href = savedOrigin;
        } else if (referrer.includes('foodxbrowse') || referrer.includes('foodxmenu')) {
            window.history.back();
        } else {
            window.location.href = savedOrigin || '/Customer/FoodXBrowse';
        }
    });

    // Checkout button
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
        const cart = getCart();
        if (!Object.keys(cart).length) {
            AlertModal.show({
                type: 'warning',
                title: 'Cart Empty',
                message: 'Please add items to your cart before proceeding.',
                buttons: [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }
        window.location.href = '/Customer/FoodXCheckOut';
    });
});