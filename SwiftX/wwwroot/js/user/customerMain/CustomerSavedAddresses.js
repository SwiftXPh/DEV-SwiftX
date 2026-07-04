// CustomerSavedAddresses.js — v2.0.0

// ══════════════════════════════════════════════════════════
// STORAGE LAYER
// TODO: replace localStorage with real backend API calls
//       once the controller endpoints are ready.
// ══════════════════════════════════════════════════════════
const SAVED_ADDRESSES_KEY = 'foodx_saved_addresses';
const CHECKOUT_FLOW_FLAG  = 'is_checkout_flow';

const defaultAddresses = [
    {
        id: 1, label: 'Home',
        fullAddress : 'Blk 4 Lot 8 Tierra Vista Subdivision, Barangay Santiago, General Trias, Cavite',
        unit: 'Floor 1', phone: '09602161220', name: 'Kelvin Jimenez',
        note: 'Near 7/11', lat: 14.3833, lng: 120.9333
    },
    {
        id: 2, label: 'Work',
        fullAddress : '456 Tech Tower, 32nd St, Bonifacio Global City, Taguig',
        unit: 'Room 404', phone: '09187654321', name: 'Juan Dela Cruz',
        note: 'Next to Lobby Entrance', lat: 14.5548, lng: 121.0476
    },
    {
        id: 3, label: "Mom's House",
        fullAddress : 'Apartment 7B, Greenview Villas, Dasmariñas, Cavite',
        unit: '7B', phone: '09228889999', name: 'Maria Dela Cruz',
        note: 'Gate is painted green', lat: 14.3294, lng: 120.9361
    }
];

if (!localStorage.getItem(SAVED_ADDRESSES_KEY)) {
    localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(defaultAddresses));
}

function getSavedAddresses() {
    return JSON.parse(localStorage.getItem(SAVED_ADDRESSES_KEY)) || [];
}

function saveAddresses(array) {
    localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(array));
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// ══════════════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════════════
function loadSavedAddresses() {
    const feed = document.getElementById('saved-addresses-feed');
    if (!feed) return;

    // Resolve checkout mode from data attribute (set by Razor)
    const isCheckoutMode = feed.getAttribute('data-checkout-mode') === 'true'
        || localStorage.getItem(CHECKOUT_FLOW_FLAG) === 'true';

    if (isCheckoutMode) {
        localStorage.setItem(CHECKOUT_FLOW_FLAG, 'true');
    }

    const addresses = getSavedAddresses();

    feed.innerHTML = '';

    if (!addresses.length) {
        feed.innerHTML = `
            <div class="sa-empty">
                <i class="ph ph-map-pin"></i>
                <p>No saved addresses found. Add one below!</p>
            </div>`;
        return;
    }

    const fragment = document.createDocumentFragment();

    addresses.forEach(addr => {
        let iconClass = 'ph ph-map-pin';
        const labelLower = (addr.label || '').toLowerCase();
        if (labelLower.includes('home'))                          iconClass = 'ph ph-house';
        else if (labelLower.includes('work') || labelLower.includes('office')) iconClass = 'ph ph-briefcase';

        const card = document.createElement('div');
        card.className         = 'address-card';
        card.setAttribute('data-id', addr.id);
        card.setAttribute('role', 'listitem');

        if (isCheckoutMode) card.classList.add('selectable-checkout-card');

        card.innerHTML = `
            <div class="address-details">
                <span class="address-label">
                    <i class="${iconClass}"></i>
                    ${escapeHtml(addr.label || 'Saved Location')}
                </span>
                <p class="address-text">${escapeHtml(addr.fullAddress || addr.address)}</p>
            </div>
            <div class="address-actions">
                <button type="button" class="action-btn edit-btn" aria-label="Edit address">
                    <i class="ph ph-pencil-simple"></i>
                </button>
                <button type="button" class="action-btn delete-btn" aria-label="Delete address">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `;

        fragment.appendChild(card);
    });

    feed.appendChild(fragment);


    // ── Event delegation on feed (single listener, no clone hack) ──
    feed.addEventListener('click', (e) => {
        const card = e.target.closest('.address-card');
        if (!card) return;

        const id = parseInt(card.getAttribute('data-id'), 10);

        if (e.target.closest('.edit-btn')) {
            editAddress(id);
            return;
        }

        if (e.target.closest('.delete-btn')) {
            deleteAddress(id, card);
            return;
        }

        // Checkout selection
        if (localStorage.getItem(CHECKOUT_FLOW_FLAG) === 'true') {
            const selected = getSavedAddresses().find(a => a.id === id);
            if (selected) {
                localStorage.setItem('foodx_selected_address', JSON.stringify(selected));
                localStorage.removeItem(CHECKOUT_FLOW_FLAG);
                window.location.href = '/Customer/FoodXCheckOut';
            }
        }
    }, { once: false });
}


// ══════════════════════════════════════════════════════════
// EDIT
// ══════════════════════════════════════════════════════════
function editAddress(id) {
    const addr          = getSavedAddresses().find(a => a.id === id);
    const isCheckout    = localStorage.getItem(CHECKOUT_FLOW_FLAG) === 'true';
    const returnSuffix  = isCheckout ? '&returnTo=checkout' : '';
    const encodedAddr   = encodeURIComponent(addr?.fullAddress || addr?.address || '');

    window.location.href =
        `/Customer/CustomerReviewAddress?addressId=${id}&fullAddress=${encodedAddr}${returnSuffix}`;
}


// ══════════════════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════════════════
function deleteAddress(id, cardEl) {
    AlertModal.show({
        type    : 'danger',
        title   : 'Delete Address',
        message : 'Are you sure you want to delete this address? This cannot be undone.',
        buttons : [
            { label: 'Cancel', variant: 'ghost' },
            {
                label    : 'Delete',
                variant  : 'danger',
                callback : () => {
                    const updated = getSavedAddresses().filter(a => a.id !== id);
                    saveAddresses(updated);

                    if (cardEl) {
                        cardEl.style.opacity   = '0';
                        cardEl.style.transform = 'scale(0.95)';
                        cardEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                        setTimeout(() => {
                            cardEl.remove();
                            if (!updated.length) loadSavedAddresses();
                        }, 200);
                    }
                }
            }
        ]
    });
}


// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    loadSavedAddresses();

    // Back button — URL from data attribute set by Razor
    const backBtn = document.getElementById('btnCloseAddresses');
    backBtn?.addEventListener('click', () => {
        const url = backBtn.getAttribute('data-back-url') || '/Customer/CustomerHome';
        window.location.href = url;
    });

    // Add address button
    const addBtn = document.getElementById('btnAddAddress');
    addBtn?.addEventListener('click', () => {
        const url = addBtn.getAttribute('data-add-url') || '/Customer/CustomerReviewAddress';
        window.location.href = url;
    });
});
