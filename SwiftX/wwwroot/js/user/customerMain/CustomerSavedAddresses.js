// CustomerSavedAddresses.js — Backend API Integration

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

    const isCheckoutMode = feed.getAttribute('data-checkout-mode') === 'true';

    feed.innerHTML = '<div style="text-align: center; padding: 20px;">Loading addresses...</div>';

    fetch('/Customer/GetAddresses')
        .then(res => {
            if (res.status === 401) throw new Error('Unauthorized');
            return res.json();
        })
        .then(addresses => {
            feed.innerHTML = '';

            if (!addresses || !addresses.length) {
                feed.innerHTML = `
                    <div class="sa-empty">
                        <i class="ph ph-map-pin"></i>
                        <p>No saved addresses found. Add one below!</p>
                    </div>`;
                return;
            }

            const fragment = document.createDocumentFragment();

            addresses.forEach(addr => {
                let iconClass = 'ph-map-pin';
                const labelLower = (addr.label || '').toLowerCase();
                if (labelLower.includes('home')) iconClass = 'ph-house';
                else if (labelLower.includes('work') || labelLower.includes('office')) iconClass = 'ph-briefcase';

                const card = document.createElement('div');
                card.className = 'address-card';
                if (addr.isDefault) {
                    card.classList.add('is-default');
                }
                card.setAttribute('data-id', addr.id);
                card.setAttribute('role', 'listitem');

                if (isCheckoutMode) card.classList.add('selectable-checkout-card');
                
                const defaultBadge = addr.isDefault ? '<span style="font-size: 10px; background: #d34502; color: white; padding: 2px 4px; border-radius: 4px; margin-left: 8px;">ACTIVE</span>' : '';

                card.innerHTML = `
                    <div class="address-details">
                        <span class="address-label">
                            <i class="ph ${iconClass}"></i>
                            ${escapeHtml(addr.label || 'Saved Location')}
                            ${defaultBadge}
                        </span>
                        <p class="address-text">${escapeHtml(addr.fullAddress)}</p>
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
        })
        .catch(err => {
            console.error('Failed to load addresses:', err);
            feed.innerHTML = '<div style="text-align: center; color: red;">Failed to load addresses.</div>';
        });

    // ── Event delegation on feed ──
    if (!feed.dataset.listenerAttached) {
        feed.addEventListener('click', (e) => {
            const card = e.target.closest('.address-card');
            if (!card) return;

            const id = parseInt(card.getAttribute('data-id'), 10);

            if (e.target.closest('.edit-btn')) {
                editAddress(id, isCheckoutMode);
                return;
            }

            if (e.target.closest('.delete-btn')) {
                deleteAddress(id, card);
                return;
            }

            // Checkout selection
            if (isCheckoutMode) {
                const tokenElement = document.querySelector('input[name="__RequestVerificationToken"]');
                const token = tokenElement ? tokenElement.value : '';

                fetch('/Customer/SetDefaultAddress', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'RequestVerificationToken': token
                    },
                    body: JSON.stringify({ id: id })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = '/Customer/FoodXCheckOut';
                    }
                })
                .catch(err => console.error('Error setting default address:', err));
            }
        });
        feed.dataset.listenerAttached = 'true';
    }
}

// ══════════════════════════════════════════════════════════
// EDIT
// ══════════════════════════════════════════════════════════
function editAddress(id, isCheckout) {
    const returnSuffix = isCheckout ? '&returnTo=checkout' : '';
    window.location.href = `/Customer/CustomerReviewAddress?addressId=${id}${returnSuffix}`;
}

// ══════════════════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════════════════
function deleteAddress(id, cardEl) {
    AlertModal.show({
        type: 'danger',
        title: 'Delete Address',
        message: 'Are you sure you want to delete this address? This cannot be undone.',
        buttons: [
            { label: 'Cancel', variant: 'ghost' },
            {
                label: 'Delete',
                variant: 'danger',
                callback: () => {
                    const tokenElement = document.querySelector('input[name="__RequestVerificationToken"]');
                    const token = tokenElement ? tokenElement.value : '';

                    fetch('/Customer/DeleteAddress', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'RequestVerificationToken': token
                        },
                        body: JSON.stringify({ id: id })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            if (cardEl) {
                                cardEl.style.opacity = '0';
                                cardEl.style.transform = 'scale(0.95)';
                                cardEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                                setTimeout(() => {
                                    cardEl.remove();
                                    const feed = document.getElementById('saved-addresses-feed');
                                    if (feed && feed.children.length === 0) {
                                        loadSavedAddresses(); // reload to show empty state
                                    }
                                }, 200);
                            } else {
                                loadSavedAddresses();
                            }
                        }
                    })
                    .catch(err => console.error('Error deleting address:', err));
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
