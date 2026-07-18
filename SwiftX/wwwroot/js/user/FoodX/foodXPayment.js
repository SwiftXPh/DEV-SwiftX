// 🎯 Shared cart storage configuration key matching your Checkout file
const STORAGE_KEY = 'swiftx_cart_data';
const DELIVERY_FEE = 39.00;
let selectedPaymentMethod = "Cash"; // Matches the default active markup element
let selectedDeliveryMethod = "StandardX"; // Matches the default active markup element
let requiresPhysicalReceipt = true;

// DOM Element References
const itemsListContainer = document.getElementById('payment-items-list');
const subtotalDisplay = document.getElementById('subtotal-val');
const deliveryDisplay = document.getElementById('delivery-val');
const grandTotalDisplay = document.getElementById('grand-total-val');
const riderNoteInput = document.getElementById('riderNote');

/**
 * Safe utility to parse current cart items out of browser storage
 */
function getCart() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

/**
 * 🛠️ Dynamic DOM Render Engine
 * Replaces hardcoded placeholder summary markup rows with real active items
 */
function renderPaymentSummary() {
    const cart = getCart();
    const items = Object.values(cart);
    let subtotal = 0;

    if (!itemsListContainer) return;

    // Route-guard fallback protection if the layout canvas renders completely empty
    if (items.length === 0) {
        itemsListContainer.innerHTML = `<div class="fxpm-receipt-row" style="color: rgba(255,255,255,0.45);"><span>Your cart is empty</span></div>`;
        if (subtotalDisplay) subtotalDisplay.innerText = "₱ 0.00";
        if (grandTotalDisplay) grandTotalDisplay.innerText = "₱ 0.00";
        return;
    }

    // Clear previous hardcoded/old layout data nodes
    itemsListContainer.innerHTML = "";

    // Generate structural breakdown rows dynamically
    items.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        const row = document.createElement('div');
        row.className = 'fxpm-receipt-row';
        row.innerHTML = `
            <span>${item.qty}x ${item.name}</span>
            <span>₱ ${itemTotal.toFixed(2)}</span>
        `;
        itemsListContainer.appendChild(row);
    });

    const grandTotal = subtotal + DELIVERY_FEE;

    // Apply calculated metrics to textual nodes
    if (subtotalDisplay) subtotalDisplay.innerText = `₱ ${subtotal.toFixed(2)}`;
    if (deliveryDisplay) deliveryDisplay.innerText = `₱ ${DELIVERY_FEE.toFixed(2)}`;
    if (grandTotalDisplay) grandTotalDisplay.innerText = `₱ ${grandTotal.toFixed(2)}`;
}

/**
 * Interactive Selection Utilities
 */
function selectPayment(element) {
    document.querySelectorAll('.fxpm-payment-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');

    // Extract textual data parameter values directly via dataset attribute rules
    selectedPaymentMethod = element.getAttribute('data-method') || "Cash";
    console.log("Selected Payment Method Changed:", selectedPaymentMethod);
}

/**
 * NOTE: previously referenced by the "Delivery Method" card's onclick handler
 * in foodXPayment.cshtml but was never defined here — added to match the
 * same active-state pattern used by selectPayment(). Only one delivery
 * option exists today (StandardX), so this simply keeps the state variable
 * in sync for when more tiers (PriorityX / SaveX) are added.
 */
function selectDelivery(element) {
    document.querySelectorAll('.fxpm-delivery-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');

    selectedDeliveryMethod = element.querySelector('strong')?.innerText || "StandardX";
    console.log("Selected Delivery Method Changed:", selectedDeliveryMethod);
}

function toggleSwitch() {
    const sw = document.getElementById('receiptToggle');
    if (sw) {
        sw.classList.toggle('on');
        requiresPhysicalReceipt = sw.classList.contains('on');
    }
}

/**
 * 🛠️ Order Processing Async Controller Loop
 * Validates active items cache and manages active gateway APIs or fallback flows
 */
async function handleOrder() {
    const btn = document.getElementById('placeOrderBtn');
    if (!btn || btn.disabled) return;

    const cart = getCart();
    const items = Object.values(cart);

    // 🚨 Critical Validation Guard: Stop execution blocks if items don't exist
    if (items.length === 0) {
        alert("Cannot process checkout layout context. Your shopping cart data cache is empty!");
        return;
    }

    // Lock interaction layers immediately to stop duplicate double-clicks
    btn.disabled = true;
    btn.innerHTML = '<span>PROCESSING...</span>';

    const calculatedSubtotal = items.reduce((acc, current) => acc + (current.price * current.qty), 0);
    const calculatedGrandTotal = calculatedSubtotal + DELIVERY_FEE;

    // Collect systemic metadata variables into a clear transport structure payload
    const finalOrderPayload = {
        cartItems: items,
        paymentMethod: selectedPaymentMethod,
        deliveryMethod: selectedDeliveryMethod,
        requiresReceipt: requiresPhysicalReceipt,
        noteToRider: riderNoteInput ? riderNoteInput.value.trim() : "",
        summaryFinancials: {
            deliveryCharge: DELIVERY_FEE,
            subtotalAmount: calculatedSubtotal,
            calculatedGrandTotal: calculatedGrandTotal
        }
    };

    console.log("Order payload finalized and validated:", finalOrderPayload);

    // 💳 INTERACTIVE GCASH GATEWAY HANDLER BLOCK
    if (selectedPaymentMethod === "GCash") {
        btn.innerHTML = '<span>INITIATING GCASH...</span>';

        try {
            // Replace endpoint address string with your direct active MVC backend router path
            const response = await fetch('/api/Payment/InitiateGCashTransaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(finalOrderPayload)
            });

            if (!response.ok) {
                throw new Error("E-Wallet gateway infrastructure returned an unexpected server response flag.");
            }

            const data = await response.json();
            console.log("GCash API Gateway Handshake Successful:", data);

            btn.innerHTML = '<span>✓ GCASH VERIFIED</span>';
            btn.classList.add('fxpm-btn-success');

        } catch (error) {
            console.error("GCash transaction routing broken:", error);
            alert("Payment Gateway Notice: Failed to initialize GCash connection pattern safely. Please retry or fallback to Cash payment.");

            // Re-enable interactive elements if transaction drops completely
            btn.disabled = false;
            btn.innerHTML = 'PLACE ORDER NOW';
            return;
        }
    } else {
        // Standard Cash processing sequence animation simulation block
        await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Common workflow termination block (fires cleanly for both verified flows)
    btn.innerHTML = '✓ ORDER PLACED';
    btn.classList.add('fxpm-btn-success');
    if (!btn.style.boxShadow) {
        btn.style.boxShadow = "0 5px 15px rgba(34, 197, 94, 0.4)";
    }

    setTimeout(() => {
        // Optional Cleanup step: Clear cart parameters here if preferred over server success rules
        // localStorage.removeItem(STORAGE_KEY);
        window.location.href = 'FoodXTracking';
    }, 1800);
}

// Attach local rendering systems to structural engine boot loaders
document.addEventListener('DOMContentLoaded', renderPaymentSummary);
