// MenuInfo.js — Admin Product/Menu Management
document.addEventListener('DOMContentLoaded', () => {
    // ══════════════════════════════════════════════════════════
    // SIGNED URL IMAGE LOADER FOR PRODUCT CARDS
    // ══════════════════════════════════════════════════════════
    const productImages = document.querySelectorAll('img[data-image-path]');
    productImages.forEach(async (img) => {
        const path = img.getAttribute('data-image-path');
        if (!path) return;
        try {
            const res = await fetch(`/Admin/DocumentUrl?bucket=merchant&path=${encodeURIComponent(path)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    img.src = data.url;
                }
            }
        } catch (err) {
            console.error('Error fetching product image URL:', err);
        }
    });

    // ══════════════════════════════════════════════════════════
    // IMAGE UPLOAD HANDLER WITH 10MB LIMIT & PREVIEW
    // ══════════════════════════════════════════════════════════
    const imageInput = document.getElementById('productImage');
    const imageUpload = document.getElementById('productImageUpload');
    const imagePreview = document.getElementById('productImagePreview');
    const imageText = document.getElementById('productImageText');
    const imageError = document.getElementById('productImageError');

    const MAX_MB = 10;
    const MAX_BYTES = MAX_MB * 1024 * 1024;

    if (imageInput) {
        imageInput.addEventListener('change', () => {
            const file = imageInput.files && imageInput.files[0];

            if (file && file.size > MAX_BYTES) {
                if (imageError) {
                    imageError.textContent = `File too large — max ${MAX_MB} MB.`;
                    imageError.classList.add('visible');
                }
                imageInput.value = '';
                if (imageUpload) imageUpload.classList.remove('has-file');
                if (imageText) imageText.textContent = 'Upload Item Image';
                if (imagePreview) imagePreview.src = '';
                return;
            }

            if (imageError) {
                imageError.textContent = '';
                imageError.classList.remove('visible');
            }

            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (imagePreview) imagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
                if (imageUpload) imageUpload.classList.add('has-file');
                if (imageText) imageText.textContent = file.name;
            } else {
                if (imageUpload) imageUpload.classList.remove('has-file');
                if (imageText) imageText.textContent = 'Upload Item Image';
                if (imagePreview) imagePreview.src = '';
            }
        });
    }
});

// ══════════════════════════════════════════════════════════
// MODAL ACTIONS & HELPERS
// ══════════════════════════════════════════════════════════
function resetMenuItemForm() {
    const form = document.getElementById('menuItemForm');
    if (form) form.reset();

    const productId = document.getElementById('productId');
    const productStoreId = document.getElementById('productStoreId');
    const currentStoreId = document.getElementById('currentStoreId');
    const formTitle = document.getElementById('formTitle');
    const availabilityField = document.getElementById('availabilityField');
    const imageUpload = document.getElementById('productImageUpload');
    const imagePreview = document.getElementById('productImagePreview');
    const imageText = document.getElementById('productImageText');
    const imageError = document.getElementById('productImageError');

    if (productId) productId.value = '0';
    if (productStoreId && currentStoreId) productStoreId.value = currentStoreId.value;
    if (formTitle) formTitle.textContent = 'Add New Menu Item';
    if (availabilityField) availabilityField.style.display = 'none';

    if (imageUpload) imageUpload.classList.remove('has-file');
    if (imagePreview) imagePreview.src = '';
    if (imageText) imageText.textContent = 'Upload Item Image';
    if (imageError) {
        imageError.textContent = '';
        imageError.classList.remove('visible');
    }

    if (form) form.action = '/Admin/AddProduct';
}

window.openAddItemModal = function () {
    resetMenuItemForm();
    openModal('menuitem-add-modal');
};

window.editItem = async function (id) {
    resetMenuItemForm();

    const form = document.getElementById('menuItemForm');
    const formTitle = document.getElementById('formTitle');
    const availabilityField = document.getElementById('availabilityField');

    if (formTitle) formTitle.textContent = 'Edit Menu Item';
    if (form) form.action = '/Admin/UpdateProduct';
    if (availabilityField) availabilityField.style.display = 'block';

    try {
        const res = await fetch(`/Admin/GetProductJson?id=${id}`);
        if (!res.ok) {
            alert('Failed to fetch item details.');
            return;
        }

        const data = await res.json();
        document.getElementById('productId').value = data.id;
        document.getElementById('productStoreId').value = data.storeId;
        document.getElementById('productName').value = data.name;
        document.getElementById('productPrice').value = data.price;
        document.getElementById('productCategory').value = data.category || '';
        document.getElementById('productDescription').value = data.description || '';
        document.getElementById('productAvailability').value = data.isAvailable ? 'true' : 'false';

        const imageUpload = document.getElementById('productImageUpload');
        const imagePreview = document.getElementById('productImagePreview');
        const imageText = document.getElementById('productImageText');

        if (data.imageUrl && imagePreview && imageUpload && imageText) {
            imagePreview.src = data.imageUrl;
            imageUpload.classList.add('has-file');
            imageText.textContent = 'Current image (choose a file to replace)';
        }

        openModal('menuitem-add-modal');
    } catch (err) {
        console.error('Error fetching product data:', err);
        alert('An error occurred while loading item details.');
    }
};

window.deleteItem = function (id) {
    AlertModal.show({
        type: 'danger',
        title: 'Delete Menu Item',
        message: 'Are you sure you want to delete this menu item? This cannot be undone.',
        buttons: [
            { label: 'Cancel', variant: 'ghost' },
            {
                label: 'Delete',
                variant: 'danger',
                callback: () => {
                    document.getElementById('deleteProductId').value = id;
                    document.getElementById('deleteProductForm').submit();
                }
            }
        ]
    });
};