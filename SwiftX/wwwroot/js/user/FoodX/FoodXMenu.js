// FoodXMenu.js — v2.0.0
// Individual restaurant menu page

// ══════════════════════════════════════════════════════════
// CART STORAGE KEY — shared with checkout engine
// TODO: replace localStorage with backend API when ready
// ══════════════════════════════════════════════════════════
const STORAGE_KEY = 'swiftx_cart_data';

// Distance from URL param (used for delivery fee calc at checkout)
const urlParams            = new URLSearchParams(window.location.search);
const RESTAURANT_DISTANCE  = parseFloat(urlParams.get('distance')) || 20.4;


// ══════════════════════════════════════════════════════════
// MOCK MENU DATA
// TODO: fetch from /Customer/GetMenu?merchantId=X
// ══════════════════════════════════════════════════════════
const menuData = [
    { id: 1, name: '2-pc. Chicken McDo',    price: 191, cat: 'Chicken',  img: 'https://mcdonalds.com.ph/cms-images/Chicken%20McDo_Hero.jpg' },
    { id: 2, name: '1-pc. Chicken w/ Rice', price: 99,  cat: 'Chicken',  img: 'https://mcdonalds.com.ph/cms-images/Chicken%20McDo_Hero.jpg' },
    { id: 3, name: 'Big Mac Meal',           price: 210, cat: 'Burgers',  img: 'https://mcdonalds.com.ph/cms-images/Big%20Mac_Hero.jpg'      },
    { id: 4, name: 'Cheeseburger Deluxe',   price: 110, cat: 'Burgers',  img: 'https://mcdonalds.com.ph/cms-images/Cheeseburger_Hero.jpg'   },
    { id: 5, name: 'Hot Fudge Sundae',      price: 55,  cat: 'Desserts', img: 'https://mcdonalds.com.ph/cms-images/Sundae_Hero.jpg'         },
    { id: 6, name: 'McFlurry Oreo',         price: 65,  cat: 'Desserts', img: 'https://mcdonalds.com.ph/cms-images/McFlurry_Hero.jpg'       }
];

let currentCat = 'Chicken';


// ══════════════════════════════════════════════════════════
// RENDER MENU LIST
// ══════════════════════════════════════════════════════════
function render() {
    const list = document.getElementById('menu-list');
    if (!list) return;

    const cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    list.innerHTML = '';

    menuData.filter(item => item.cat === currentCat).forEach(item => {
        const qty = cart[item.id]?.qty ?? 0;

        const actionControl = qty > 0
            ? `<div class="fxm-qty-pill">
                   <button onclick="changeQty(${item.id}, -1)">-</button>
                   <span>${qty}</span>
                   <button onclick="changeQty(${item.id}, 1)">+</button>
               </div>`
            : `<button class="fxm-add-btn" onclick="changeQty(${item.id}, 1)">+</button>`;

        const row = document.createElement('div');
        row.className   = 'fxm-item';
        row.innerHTML   = `
            <div class="fxm-item__info">
                <img class="fxm-item__img"
                     src="${item.img}"
                     alt="${item.name}"
                     onerror="this.src='https://via.placeholder.com/65'">
                <div>
                    <p class="fxm-item__name"></p>
                    <p class="fxm-item__price">&#8369;${item.price}</p>
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
        cart[id] = { ...item, qty: 0, distance: parseFloat(RESTAURANT_DISTANCE) };
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
    el.classList.add('active');
    render();
}


// ══════════════════════════════════════════════════════════
// UPDATE CART BADGE
// ══════════════════════════════════════════════════════════
function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    const cart  = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const total = Object.values(cart).reduce((sum, i) => sum + i.qty, 0);

    if (total > 0) {
        badge.textContent    = total;
        badge.style.display  = 'block';
    } else {
        badge.style.display  = 'none';
    }
}


// ══════════════════════════════════════════════════════════
// NAV BUTTONS
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fxmBackBtn')?.addEventListener('click', () => {
        window.location.href = '/Customer/FoodXBrowse';
    });

    document.getElementById('fxmCartBtn')?.addEventListener('click', () => {
        window.location.href = '/Customer/FoodXCart';
    });

    render();
});

// Expose tab/qty functions for inline onclick in JS-generated HTML
window.switchTab = switchTab;
window.changeQty = changeQty;
