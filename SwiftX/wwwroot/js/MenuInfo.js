// ==========================================
// ELEMENTS & VARIABLES
// ==========================================
const form = document.getElementById('merchantForm');
const editIndexInput = document.getElementById('editIndex');
const logoInput = document.getElementById('businessLogo');
const logoUpload = document.getElementById('businessLogoUpload');
const logoPreview = document.getElementById('businessLogoPreview');
const logoText = document.getElementById('businessLogoText');
const formTitle = document.getElementById('formTitle');

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
// FORM RESET / POPULATE HELPERS
// ==========================================
/**
 * Resets the form to a blank "Add New Item" state — fields, hidden
 * edit-index tracker, and the upload zone's preview/placeholder text.
 */
const resetItemForm = () => {
    form.reset();
    editIndexInput.value = -1;
    if (formTitle) formTitle.textContent = 'Add New Menu Item';
    if (logoUpload) logoUpload.classList.remove('has-file');
    if (logoText) logoText.textContent = 'Upload Item Image';
    if (logoPreview) logoPreview.src = '';
};

/**
 * Populates the form with an existing item's data for editing, including
 * showing its current image in the upload zone's preview.
 */
const populateItemForm = (item, itemIndex) => {
    document.getElementById('businessName').value = item.name;
    document.getElementById('businessLocation').value = item.price;
    document.getElementById('businessCategory').value = item.category;
    editIndexInput.value = itemIndex;

    if (formTitle) formTitle.textContent = 'Edit Item';

    if (item.image && logoPreview && logoUpload && logoText) {
        logoPreview.src = item.image;
        logoUpload.classList.add('has-file');
        logoText.textContent = 'Current image (choose a file to replace)';
    }
};

// ==========================================
// ITEM IMAGE UPLOAD — preview + 10MB limit
// (same pattern as adminMerchant.js)
// ==========================================
const logoError = document.getElementById('businessLogoError');
const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

if (logoInput) {
    logoInput.addEventListener('change', () => {
        const file = logoInput.files && logoInput.files[0];

        if (file && file.size > MAX_BYTES) {
            if (logoError) {
                logoError.textContent = `File too large — max ${MAX_MB} MB.`;
                logoError.classList.add('visible');
            }
            logoInput.value = '';
            logoUpload.classList.remove('has-file');
            logoText.textContent = 'Upload Item Image';
            logoPreview.src = '';
            return;
        }

        if (logoError) {
            logoError.textContent = '';
            logoError.classList.remove('visible');
        }

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { logoPreview.src = e.target.result; };
            reader.readAsDataURL(file);
            logoUpload.classList.add('has-file');
            logoText.textContent = file.name;
        } else {
            logoUpload.classList.remove('has-file');
            logoText.textContent = 'Upload Item Image';
            logoPreview.src = '';
        }
    });
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
                    <button type="button" class="admin-modal-btn admin-modal-btn--ghost" onclick="editItem(${itemIndex})">Edit</button>
                    <button type="button" class="admin-modal-btn admin-modal-btn--danger" onclick="deleteItem(${itemIndex})">Delete</button>
                </div>
            `;
            itemList.appendChild(card);
        });
    } else {
        itemList.innerHTML = `<p class="__text-light" style="grid-column: 1/-1; text-align: center; opacity: 0.6;">No items found. Click 'Add New Item' to begin.</p>`;
    }
};

window.openAddItemModal = () => {
    resetItemForm();
    openModal('menuitem-add-modal');
};
// ==========================================
// FORM SUBMIT (SAVE / UPDATE)
// ==========================================
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('businessName').value;
    const price = document.getElementById('businessLocation').value;
    const category = document.getElementById('businessCategory').value;
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
    openModal('menuitem-add-modal');

    const item = merchants[activeMerchantIndex].items[itemIndex];
    populateItemForm(item, itemIndex);
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