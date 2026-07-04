// CustomerOrderHistory.js — v2.0.0

// ══════════════════════════════════════════════════════════
// STATIC DATA  (replace with fetch from backend when ready)
// ══════════════════════════════════════════════════════════
const orderHistoryData = [
    {
        id            : '123',
        date          : '4/9/2026',
        restaurant    : "McDonald's Valencia",
        items         : [
            { qty: 1, name: '2-pc. Chicken McDo Meal' },
            { qty: 1, name: 'BFF Fries' },
            { qty: 1, name: 'McSpaghetti w/ Burger McDo Small Meal' }
        ],
        subtotal      : 511.00,
        deliveryFee   : 50.00,
        serviceFee    : 21.00,
        paymentMethod : 'Cash',
        total         : 582.00
    },
    {
        id            : '456',
        date          : '4/10/2026',
        restaurant    : "McDonald's Valencia",
        items         : [
            { qty: 1, name: '2-pc. Chicken McDo Meal' },
            { qty: 1, name: 'BFF Fries' },
            { qty: 1, name: 'McSpaghetti w/ Burger McDo Small Meal' }
        ],
        subtotal      : 511.00,
        deliveryFee   : 50.00,
        serviceFee    : 21.00,
        paymentMethod : 'Cash',
        total         : 582.00
    }
];


// ══════════════════════════════════════════════════════════
// RENDER — builds cards into the feed via DocumentFragment
// XSS-safe: user-sourced strings injected via textContent only
// ══════════════════════════════════════════════════════════
function renderOrderHistory(orders) {
    const feed = document.getElementById('order-history-feed');
    if (!feed) return;

    feed.innerHTML = '';

    if (!orders?.length) {
        const empty = document.createElement('p');
        empty.className   = 'oh-empty';
        empty.textContent = 'No past orders found.';
        feed.appendChild(empty);
        return;
    }

    const fragment = document.createDocumentFragment();

    orders.forEach(order => {
        const itemsHTML = order.items
            .map(item => `<li class="item-row"><strong>${item.qty}&times;</strong>&nbsp;${item.name}</li>`)
            .join('');

        const article       = document.createElement('article');
        article.className   = 'order-card';
        article.innerHTML   = `
            <div class="card-toggle-header">
                <div class="header-left">
                    <span class="order-id">Order ID: #${order.id}</span>
                    <h2 class="restaurant-title"></h2>
                </div>
                <div class="header-right">
                    <span class="order-date">${order.date}</span>
                    <i class="ph ph-caret-down expansion-arrow" aria-hidden="true"></i>
                </div>
            </div>
            <div class="card-collapsible-drawer">
                <div class="drawer-inner-padding">
                    <ul class="items-list">${itemsHTML}</ul>
                    <div class="pricing-summary">
                        <div class="price-line subtotal">
                            <span>Subtotal</span>
                            <span>&#8369; ${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="price-line">
                            <span>Standard Delivery</span>
                            <span>&#8369; ${order.deliveryFee.toFixed(2)}</span>
                        </div>
                        <div class="price-line">
                            <span>Service Fee</span>
                            <span>&#8369; ${order.serviceFee.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <span class="payment-method">Payment Method &mdash; ${order.paymentMethod}</span>
                        <span class="total-amount">&#8369; ${order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        // XSS safe — restaurant name via textContent
        article.querySelector('.restaurant-title').textContent = order.restaurant;

        fragment.appendChild(article);
    });

    feed.appendChild(fragment);
}


// ══════════════════════════════════════════════════════════
// ACCORDION — event delegation on the feed container
// ══════════════════════════════════════════════════════════
function initAccordion() {
    const feed = document.getElementById('order-history-feed');
    if (!feed) return;

    feed.addEventListener('click', (e) => {
        const header = e.target.closest('.card-toggle-header');
        if (!header) return;

        const card   = header.closest('.order-card');
        const drawer = card.querySelector('.card-collapsible-drawer');
        if (!card || !drawer) return;

        const isExpanding = !card.classList.contains('expanded');

        card.classList.toggle('expanded', isExpanding);
        drawer.style.maxHeight = isExpanding
            ? `${drawer.scrollHeight}px`
            : '0px';
    });
}


// ══════════════════════════════════════════════════════════
// BACK BUTTON
// ══════════════════════════════════════════════════════════
function initBackBtn() {
    document.getElementById('btnCloseHistory')?.addEventListener('click', () => {
        window.location.href = '/Customer/CustomerHome';
    });
}


// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    renderOrderHistory(orderHistoryData);
    initAccordion();
    initBackBtn();
});
