// AddressBottomSheet.js

function escapeHtmlAbs(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
document.addEventListener('DOMContentLoaded', () => {
    fetchAndSetHeaderDefaultAddress();
});

function openAddressBottomSheet() {
    const overlay = document.getElementById('addressBottomSheetOverlay');
    const sheet = document.getElementById('addressBottomSheet');
    
    if (overlay && sheet) {
        overlay.classList.add('active');
        sheet.classList.add('active');
        fetchAndRenderSheetAddresses();
    }
}

function closeAddressBottomSheet() {
    const overlay = document.getElementById('addressBottomSheetOverlay');
    const sheet = document.getElementById('addressBottomSheet');
    
    if (overlay && sheet) {
        overlay.classList.remove('active');
        sheet.classList.remove('active');
    }
}

function fetchAndSetHeaderDefaultAddress() {
    fetch('/Customer/GetDefaultAddress')
        .then(res => {
            if (res.status === 401) return null; // Not logged in or expired
            return res.json();
        })
        .then(data => {
            const headerText = document.getElementById('headerDeliveryAddress');
            if (headerText) {
                if (data && data.fullAddress) {
                    headerText.textContent = data.label ? `${data.label} (${data.fullAddress})` : data.fullAddress;
                } else {
                    headerText.textContent = 'Set your delivery location';
                }
            }
        })
        .catch(err => console.error('Error fetching default address:', err));
}

function fetchAndRenderSheetAddresses() {
    const content = document.getElementById('addressBottomSheetContent');
    if (!content) return;
    
    content.innerHTML = '<div class="address-bottom-sheet__loading">Loading addresses...</div>';
    
    fetch('/Customer/GetAddresses')
        .then(res => {
            if (res.status === 401) throw new Error('Unauthorized');
            return res.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                content.innerHTML = `
                    <div class="address-bottom-sheet__empty">
                        <i class="ph ph-map-pin-slash"></i>
                        <p>No saved addresses found.</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            data.forEach(addr => {
                const isDefault = addr.isDefault ? 'is-default' : '';
                const defaultBadge = addr.isDefault ? '<span class="abs-card__default-badge">Active</span>' : '';
                
                let iconClass = 'ph-map-pin';
                if (addr.label === 'Home') iconClass = 'ph-house';
                else if (addr.label === 'Work') iconClass = 'ph-briefcase';
                
                const details = [
                    addr.unit ? `Unit: ${addr.unit}` : '',
                    addr.name ? `${addr.name}` : '',
                    addr.phone ? `${addr.phone}` : ''
                ].filter(x => x).join(' • ');
                
                html += `
                    <div class="abs-card ${isDefault}" onclick="selectAddress(${addr.id})">
                        <i class="ph-fill ${iconClass} abs-card__icon"></i>
                        <div class="abs-card__content">
                            <div class="abs-card__header">
                                <span class="abs-card__label">${escapeHtmlAbs(addr.label || 'Saved Location')}</span>
                                ${defaultBadge}
                            </div>
                            <div class="abs-card__address-text">${escapeHtmlAbs(addr.fullAddress)}</div>
                            ${details ? `<div class="abs-card__details">${escapeHtmlAbs(details)}</div>` : ''}
                        </div>
                        <div class="abs-card__actions">
                            <button type="button" class="abs-action-btn edit" onclick="editAddress(event, ${addr.id})" aria-label="Edit">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                            <button type="button" class="abs-action-btn delete" onclick="deleteAddress(event, ${addr.id})" aria-label="Delete">
                                <i class="ph ph-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            content.innerHTML = html;
        })
        .catch(err => {
            console.error('Error fetching addresses:', err);
            content.innerHTML = '<div class="address-bottom-sheet__loading">Failed to load addresses.</div>';
        });
}

function selectAddress(id) {
    // Get antiforgery token if available on the page, or bypass if not strictly enforced for API on this layout
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
            fetchAndSetHeaderDefaultAddress();
            closeAddressBottomSheet();
        }
    })
    .catch(err => console.error('Error setting default address:', err));
}

function editAddress(event, id) {
    event.stopPropagation(); // Prevent card selection
    window.location.href = `/Customer/CustomerReviewAddress?addressId=${id}`;
}

function deleteAddress(event, id) {
    event.stopPropagation(); // Prevent card selection
    
    AlertModal.show({
        type: 'danger',
        title: 'Delete Address',
        message: 'Are you sure you want to delete this address?',
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
                            fetchAndRenderSheetAddresses();
                            fetchAndSetHeaderDefaultAddress(); // In case we deleted the default one
                        }
                    })
                    .catch(err => console.error('Error deleting address:', err));
                }
            }
        ]
    });
}
