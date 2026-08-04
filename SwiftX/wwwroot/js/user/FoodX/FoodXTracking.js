/* ==========================================
   1. DATA & STATE CONFIGURATIONS
   (Still mock per current scope — real order/rider data wiring to follow later)
   ========================================== */

const orderItems = [
    { name: "2-pc. Chicken McDo Meal", qty: 1, price: 191 },
    { name: "BFF Fries", qty: 1, price: 181 },
    { name: "McSpaghetti w/ Burger", qty: 1, price: 139 },
];

const orderStates = {
    1: {
        status: "Waiting for A Rider",
        subtext: "We've received your order and is currently looking for a rider",
        image: "../images/waiting.png" 
    },
    2: {
        status: "Preparing Your Food",
        subtext: "The merchant is cooking your meal now.",
        image: "../images/preparing.png"
    },
    3: {
        status: "Rider is On The Way",
        subtext: "Your rider has picked up the order.",
        image: "../images/otw.png"
    },
    4: {
        status: "Order Delivered",
        subtext: "Enjoy your meal!",
        image: "../images/delivered.png"
    }
};


/* ==========================================
   2. ITEM INJECTION & CALCULATIONS
   ========================================== */

const itemList = document.getElementById("itemList");
if (itemList) {
    itemList.innerHTML = ""; 
    orderItems.forEach(item => {
        const row = document.createElement("div");
        row.className = "fxtk-item-row";
        row.innerHTML = `<span>${item.qty}x ${item.name}</span><span>₱ ${item.price.toFixed(2)}</span>`;
        itemList.appendChild(row);
    });
}

const subtotal = orderItems.reduce((sum, i) => sum + i.price, 0);
const subtotalDisplay = document.getElementById("subtotalDisplay");
if (subtotalDisplay) {
    subtotalDisplay.textContent = `₱ ${subtotal.toFixed(2)}`;
}

const delivery = 69;
const service = 5;
const total = subtotal + delivery + service;
const totalAmount = document.getElementById("totalAmount");
if (totalAmount) {
    totalAmount.textContent = `₱ ${total.toFixed(2)}`;
}


/* ==========================================
   3. NAVIGATION
   ========================================== */
function goHome() {
    window.location.href = 'CustomerHome'; 
}
function cancelOrder() {
    let confirmCancel = confirm("Are you sure you want to cancel your order? This action cannot be undone.");
    if (confirmCancel) {
        alert("Order Cancelled Successfully.");
        window.location.href = 'CustomerHome'; 
    }
}

/* ==========================================
   4. MAIN DYNAMIC CORE FUNCTION
   ========================================== */
function updateOrderPage(step) {
    const data = orderStates[step];
    if (!data) return;

    // 1. Palitan ang Text
    const trackingStatus = document.getElementById('trackingStatus');
    const trackingSubtext = document.getElementById('trackingSubtext');
    
    if (trackingStatus) trackingStatus.innerText = data.status;
    if (trackingSubtext) trackingSubtext.innerText = data.subtext;

    // 2. Palitan ang Image na may Fade Effect
    const img = document.getElementById('statusImage');
    if (img) {
        img.style.opacity = "0"; 
        setTimeout(() => {
            img.src = data.image;
            img.style.opacity = "1"; 
        }, 200);
    }

    // 3. LOGIC PARA SA CANCEL BUTTON
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        if (step > 1) {
            cancelBtn.style.display = "none";
        } else {
            cancelBtn.style.display = "block";
        }
    }

    // 4. NEW LOGIC: Itago o Ipakita ang Rider Info Box batay sa Step
    const riderInfoBar = document.getElementById('riderInfoBar');
    if (riderInfoBar) {
        if (step > 1) {
            riderInfoBar.style.display = "flex";  // Ipakita kapag Step 2, 3, at 4
        } else {
            riderInfoBar.style.display = "none";  // Itago kung Step 1 (Waiting)
        }
    }

    // 5. Patakbuhin ang Stepper update
    updateStepper(step);
}


/* ==========================================
   5. PROGRESS LOGIC (Stepper Lights)
   ========================================== */
function updateStepper(stepNumber) {
    const nodes = document.querySelectorAll('.fxtk-progress-stepper .fxtk-node');
    const lines = document.querySelectorAll('.fxtk-progress-stepper .fxtk-step-line');

    nodes.forEach((node, index) => {
        if (index < stepNumber) {
            node.classList.add('active');
        } else {
            node.classList.remove('active');
        }
    });

    lines.forEach((line, index) => {
        if (index < stepNumber - 1) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
}


/* ==========================================
   6. PRODUCTION INITIALIZATION
   ========================================== */
window.onload = () => {
    updateOrderPage(1); // Default state on load (Waiting)
};


/* ==========================================
   7. TEMPORARY DEMO CODE
   (Still mock — leaving auto-advance as placeholder per current scope)
   ========================================== */
setTimeout(() => { console.log("Demo: Moving to Step 2"); updateOrderPage(2); }, 5000);  
setTimeout(() => { console.log("Demo: Moving to Step 3"); updateOrderPage(3); }, 10000); 
setTimeout(() => { console.log("Demo: Moving to Step 4"); updateOrderPage(4); }, 15000);
