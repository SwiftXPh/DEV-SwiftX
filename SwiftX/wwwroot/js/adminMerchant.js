// ==========================================
// ELEMENTS & VARIABLES
// ==========================================
const overlay = document.getElementById('merchant-add-modal');
const form = document.getElementById('merchantForm');
const editIndexInput = document.getElementById('editIndex');
const logoInput = document.getElementById('businessLogo');
const logoUpload = document.getElementById('businessLogoUpload');
const logoText = document.getElementById('businessLogoText');
const logoError = document.getElementById('businessLogoError');
const logoPreview = document.getElementById('businessLogoPreview');

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// Logo upload — has-file state + 10MB limit (same MAX_MB pattern as
// rider_signup.js / merchant_signup.js)
if (logoInput) {
    logoInput.addEventListener('change', () => {
        const file = logoInput.files && logoInput.files[0];

        if (file && file.size > MAX_BYTES) {
            if (logoError) {
                logoError.textContent = `File too large — max ${MAX_MB} MB.`;
                logoError.classList.add('visible');
            }
            logoInput.value = ''; // clear so the oversized file can't submit
            logoUpload.classList.remove('has-file');
            logoText.textContent = 'Upload Photo';
            if (logoPreview) logoPreview.src = '';
            return;
        }

        if (logoError) {
            logoError.textContent = '';
            logoError.classList.remove('visible');
        }
        logoUpload.classList.toggle('has-file', !!file);
        logoText.textContent = file ? file.name : 'Upload Photo';

        // Build a thumbnail preview from the picked file (image/* only,
        // enforced by the input's accept attr + this guard)
        if (file && logoPreview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                logoPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else if (logoPreview) {
            logoPreview.src = '';
        }
    });
}

// ==========================================
// OVERLAY & DYNAMIC LABELS LOGIC
// ==========================================
const toggleOverlay = (show, mode = 'merchant', isEdit = false) => {
    // .admin-modal-overlay is shown/hidden via the shared '.open' class
    // (see .admin-modal-overlay.open in modal.css) — not 'mOverlay'/'hidden'.
    overlay.classList.toggle('open', show);

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
        if (logoUpload) logoUpload.classList.remove('has-file');
        if (logoText) logoText.textContent = 'Upload Photo';
        if (logoPreview) logoPreview.src = '';
        if (logoError) {
            logoError.textContent = '';
            logoError.classList.remove('visible');
        }
    }
};

// ==========================================
// CLOSE HANDLING
// The modal partial's Cancel button and header close (X) button
// both call closeModal('merchant-add-modal') via inline onclick.
// That function wasn't defined anywhere in the files provided,
// so it's defined here.
//
// IMPORTANT: if a global closeModal() already exists in some other
// shared/site-wide script you haven't shown me, delete this
// definition instead — two functions with the same name will
// silently conflict, and whichever <script> loads last wins.
// ==========================================
function closeModal(id) {
    if (id === 'merchant-add-modal') {
        toggleOverlay(false);
        return;
    }
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}