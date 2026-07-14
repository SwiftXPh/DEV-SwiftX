// ==========================================
// ELEMENTS & VARIABLES (Updated to match HTML/CSS)
// ==========================================
// Note: Kept 'merchant-add-modal' and 'closeOverlayBtn' to match preserved HTML IDs
const overlay = document.getElementById('merchant-add-modal');
const form = document.getElementById('merchantForm');
const editIndexInput = document.getElementById('editIndex');
const mainContainer = document.querySelector('.main-container');
const closeBtn = document.getElementById('closeOverlayBtn');

// ==========================================
// OVERLAY & DYNAMIC LABELS LOGIC
// ==========================================
const toggleOverlay = (show, mode = 'merchant', isEdit = false) => {
    // Toggles your short camelCase overlay class
    overlay.classList.toggle('mOverlay', show);
    // Toggles the hidden state class
    overlay.classList.toggle('hidden', !show);

    if (show) {
        const title = document.getElementById('formTitle');
        const nameLabel = document.getElementById('labelName');
        const locLabel = document.getElementById('labelLocation');
        const catLabel = document.getElementById('labelCategory');
        const logoLabel = document.getElementById('labelLogo');

        const nameInput = document.getElementById('businessName');
        const locInput = document.getElementById('businessLocation');
        const categorySelect = document.getElementById('businessCategory');

        if (mode === 'items') {
            title.textContent = isEdit ? "Edit Item" : "Add New Item";
            nameLabel.textContent = "Item Name";
            locLabel.textContent = "Item Price";
            catLabel.textContent = "Item Category";
            logoLabel.textContent = "Item Image";

            nameInput.placeholder = "Chicken Mcdo";
            locInput.placeholder = "100.01";

            categorySelect.innerHTML = `
                <option value="" disabled selected>Dropdown Meals, Drinks, Add ons</option>
                <option value="Meals">Meals</option>
                <option value="Drinks">Drinks</option>
                <option value="Add ons">Add ons</option>
            `;
        } else {
            title.textContent = isEdit ? "Edit Merchant" : "Add New Merchant";
            nameLabel.textContent = "Business Name";
            locLabel.textContent = "Business Location";
            catLabel.textContent = "Business Category";
            logoLabel.textContent = "Business Logo";

            nameInput.placeholder = "Mcdonalds Valencia";
            locInput.placeholder = "Choose on Map";

            categorySelect.innerHTML = `
                <option value="" disabled selected>Select Category</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Cafe">Cafe</option>
            `;
        }
    } else {
        form.reset();
        editIndexInput.value = -1;
    }
};

// Cancel Button Listener (Targeting Close Button inside the form)
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        toggleOverlay(false);
    });
}