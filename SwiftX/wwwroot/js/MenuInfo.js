// ==========================================
// ELEMENTS & VARIABLES
// ==========================================
const overlay = document.getElementById('overlay');
const form = document.getElementById('merchantForm');
const editIndexInput = document.getElementById('editIndex');
const mainContainer = document.querySelector('.main-container');
const closeBtn = document.getElementById('closeOverlayBtn');

// Load dynamic data structure from local storage, or seed with initial fallback records
let merchants = JSON.parse(localStorage.getItem('myMerchants'));


if (!merchants || merchants.length === 0) {
    merchants = [
        {
            name: "Mcdonalds Valencia",
            location: "Valencia City",
            category: "Restaurant",
            logo: "https://images.unsplash.com/photo-1562967914-608f82629710?w=150",
            items: [
                {
                    name: "Chicken McDo with Rice",
                    price: "109.00",
                    category: "Meals",
                    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=150&auto=format&fit=crop&q=60"
                },
                {
                    name: "McFloat Coca-Cola",
                    price: "55.00",
                    category: "Drinks",
                    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=150&auto=format&fit=crop&q=60"
                },
                {
                    name: "Extra Rice",
                    price: "25.00",
                    category: "Add ons",
                    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=150&auto=format&fit=crop&q=60"
                }
            ]
        }
    ];
    localStorage.setItem('myMerchants', JSON.stringify(merchants));
}

// Dedicated context variables for the Items Page
let currentView = 'items';
let activeMerchantIndex = 0; // Targets the seeded merchant index on page mount

// ==========================================
// SIMPLE OVERLAY LOGIC
// ==========================================
/**
 * Toggles the modal overlay and resets inputs on close.
 * @param {boolean} show - True to open, false to close.
 * @param {boolean} isEdit - True if modifying an existing record.
 */
const toggleOverlay = (show, isEdit = false) => {
    overlay.classList.toggle('hidden', !show);

    if (show) {
        const title = document.getElementById('formTitle');
        if (title) {
            title.textContent = isEdit ? "Edit Item" : "Add New Item";
        }
    }

    // Reset fields and hidden tracking parameters when closing
    !show && (form.reset(), editIndexInput.value = -1);
};

// Cancel Button Listener
if (closeBtn) {
    closeBtn.addEventListener('click', () => toggleOverlay(false));
}
// ==========================================
// VIEW: ITEMS LIST DISPLAY
// ==========================================
window.showItemsView = () => {
    const merchant = merchants[activeMerchantIndex];
    if (!merchant) return;

    // Update page header dynamically
    const headerTitle = document.getElementById('merchantTitleHeader');
    if (headerTitle) {
        headerTitle.textContent = merchant.name;
    }

    const itemList = document.getElementById('itemList');
    if (!itemList) return;

    itemList.innerHTML = ''; // Clear prior container content

    if (merchant.items && merchant.items.length > 0) {
        merchant.items.forEach((item, itemIndex) => {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-img-wrapper">
                    <img src="${item.image}" alt="${item.name}" class="product-image">
                </div>
                <h3 class="product-title">${item.name}</h3>
                <p class="product-price">₱${parseFloat(item.price).toFixed(2)}</p>
                <div class="product-actions">
                    <button type="button" class="btn-action-inline" onclick="editItem(${itemIndex})">Edit</button>
                    <button type="button" class="btn-action-inline btn-danger" onclick="deleteItem(${itemIndex})">Delete</button>
                </div>
            `;
            itemList.appendChild(card);
        });
    } else {
        itemList.innerHTML = `<p class=".__text-light" style="grid-column: 1/-1; text-align: center; opacity: 0.6;">No items found. Click 'Add New Item' to begin.</p>`;
    }
};

// Bind Add Item action hook
const addItemBtn = document.getElementById('addItemBtn');

if (addItemBtn) {
    addItemBtn.onclick = () => openModal('menuitem-add-modal');
}
// ==========================================
// FORM SUBMIT (SAVE / UPDATE)
// ==========================================
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('businessName').value;
    const price = document.getElementById('businessLocation').value;
    const category = document.getElementById('businessCategory').value;
    const logoInput = document.getElementById('businessLogo');
    const editIndex = parseInt(editIndexInput.value);

    const saveChanges = (fileUrl) => {
        if (!merchants[activeMerchantIndex].items) {
            merchants[activeMerchantIndex].items = [];
        }

        if (editIndex === -1) {
            // Add New Item
            merchants[activeMerchantIndex].items.push({ name, price, category, image: fileUrl });
        } else {
            // Edit existing item
            merchants[activeMerchantIndex].items[editIndex] = { name, price, category, image: fileUrl };
        }

        saveData();
        showItemsView();
        closeModal('menuitem-add-modal');
    };

    if (logoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => saveChanges(event.target.result);
        reader.readAsDataURL(logoInput.files[0]);
    } else {
        if (editIndex !== -1) {
            // Retain old image if no new file was submitted during edit
            saveChanges(merchants[activeMerchantIndex].items[editIndex].image);
        } else {
            // System placeholder for new entries without photos
            saveChanges("https://images.unsplash.com/photo-1512058564366-18510be2db19?w=150");
        }
    }
});

// ==========================================
// HELPER FUNCTIONS (EDIT / DELETE / SAVE)
// ==========================================
const saveData = () => localStorage.setItem('myMerchants', JSON.stringify(merchants));

window.editItem = (itemIndex) => {
    console.log("Edit clicked");

    openModal('menuitem-add-modal');

    const item = merchants[activeMerchantIndex].items[itemIndex];

    document.getElementById('businessName').value = item.name;
    document.getElementById('businessLocation').value = item.price;
    document.getElementById('businessCategory').value = item.category;

    editIndexInput.value = itemIndex;
};

// ==========================================
// START APPLICATION
// ==========================================
showItemsView();

function deleteItem(itemIndex) {
    AlertModal.show({
        type: 'danger',
        title: 'Delete Item',
        message: 'Are you sure you want to delete this item? This cannot be undone.',
        buttons: [
            {
                label: 'Cancel',
                variant: 'ghost'
            },
            {
                label: 'Delete',
                variant: 'danger',
                callback: () => {

                    merchants[activeMerchantIndex].items.splice(itemIndex, 1);

                    saveData();
                    showItemsView();

                }
            }
        ]
    });
}