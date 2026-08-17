// CustomerReviewAddress.js — Google Maps & Backend API Integration with Slide-up Modal

let map, marker, autocomplete;
let geocoder;

let labelChips;
let labelInput;
let currentAddressString = '';

function initMap() {
    const initialCoords = { lat: 8.1571, lng: 125.1256 }; // Bukidnon, Philippines fallback

    map = new google.maps.Map(document.getElementById('addressPickerMap'), {
        center: initialCoords,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        mapId: 'DEMO_MAP_ID' // Required for AdvancedMarkerElement
    });

    geocoder = new google.maps.Geocoder();

    marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: initialCoords,
        gmpDraggable: true
    });

    // Check if editing an existing address
    const urlParams = new URLSearchParams(window.location.search);
    const addressId = urlParams.get('addressId');

    if (addressId) {
        fetchAddressForEdit(addressId);
    } else {
        // If not editing, try to get current location or use fallback
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    map.setCenter(userCoords);
                    marker.position = userCoords;
                    reverseGeocode(userCoords);
                },
                () => {
                    reverseGeocode(initialCoords);
                },
                { timeout: 7000 }
            );
        } else {
            reverseGeocode(initialCoords);
        }
    }

    // Map click
    map.addListener('click', (e) => {
        marker.position = e.latLng;
        reverseGeocode(e.latLng);
    });

    // Marker drag
    marker.addListener('dragend', () => {
        reverseGeocode(marker.position);
    });

    // Autocomplete for top search bar
    const searchInput = document.getElementById('selectedAddressBar');
    if (searchInput) {
        autocomplete = new google.maps.places.Autocomplete(searchInput, {
            componentRestrictions: { country: 'ph' },
            fields: ['geometry', 'formatted_address']
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
                return;
            }

            map.setCenter(place.geometry.location);
            map.setZoom(16);
            marker.position = place.geometry.location;

            setAddressText(place.formatted_address);
            setCoords(place.geometry.location.lat(), place.geometry.location.lng());
        });

        // Prevent enter submission in search input
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }
}

function fetchAddressForEdit(id) {
    fetch('/Customer/GetAddresses')
        .then(res => res.json())
        .then(data => {
            const address = data.find(a => a.id == id);
            if (address) {
                const pos = { lat: address.lat, lng: address.lng };
                map.setCenter(pos);
                map.setZoom(16);
                marker.position = pos;

                setAddressText(address.fullAddress);
                setCoords(address.lat, address.lng);

                const floorEl = document.getElementById('floor');
                const phoneEl = document.getElementById('phone');
                const contactEl = document.getElementById('contact');
                const landmarkEl = document.getElementById('landmark');

                if (floorEl) floorEl.value = address.unit || '';
                if (phoneEl) phoneEl.value = address.phone || '';
                if (contactEl) contactEl.value = address.name || '';
                if (landmarkEl) landmarkEl.value = address.note || '';

                // Set label chip
                setLabelChip(address.label);
            }
        })
        .catch(err => console.error('Error fetching address for edit:', err));
}

function reverseGeocode(latLng) {
    setAddressText('Fetching address...');

    let lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
    let lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;

    setCoords(lat, lng);

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
            setAddressText(results[0].formatted_address);
        } else {
            setAddressText(`Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        }
    });
}

function setAddressText(text) {
    currentAddressString = text;

    const searchInput = document.getElementById('selectedAddressBar');
    const addressInput = document.getElementById('address');
    const floatingAddress = document.getElementById('floatingAddressText');

    if (searchInput) searchInput.value = text;
    if (addressInput) addressInput.value = text;
    if (floatingAddress) floatingAddress.textContent = text;
}

function setCoords(lat, lng) {
    const searchInput = document.getElementById('selectedAddressBar');
    if (searchInput) {
        searchInput.setAttribute('data-lat', lat);
        searchInput.setAttribute('data-lng', lng);
    }
}

function setLabelChip(label) {
    if (!labelChips) return;
    let matched = false;

    labelChips.forEach(chip => {
        if (chip.getAttribute('data-label') === label) {
            chip.classList.add('selected');
            if (labelInput) labelInput.value = label;
            matched = true;
        } else {
            chip.classList.remove('selected');
        }
    });

    if (!matched && label) {
        labelChips.forEach(chip => {
            if (chip.getAttribute('data-label') === 'Other') {
                chip.classList.add('selected');
                if (labelInput) labelInput.value = 'Other';
            }
        });
    }
}

function initLabelChips() {
    labelChips = document.querySelectorAll('.ra-label-chip');
    labelInput = document.getElementById('addressLabel');

    labelChips.forEach(chip => {
        chip.addEventListener('click', () => {
            labelChips.forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            if (labelInput) labelInput.value = chip.getAttribute('data-label');
        });
    });
}

// ── Slide-up Modal Controls ──
function openAddressModal() {
    const modalOverlay = document.getElementById('addressModalOverlay');
    if (!modalOverlay) return;

    // Check if location is still resolving
    if (!currentAddressString || currentAddressString.includes('Fetching')) {
        AlertModal.show({
            type: 'warning',
            title: 'Locating Pin',
            message: 'Please wait a moment while the location coordinates are resolved.',
            buttons: [{ label: 'OK', variant: 'ghost' }]
        });
        return;
    }

    modalOverlay.style.display = 'flex';
    requestAnimationFrame(() => {
        modalOverlay.classList.add('active');
    });
}

function closeAddressModal() {
    const modalOverlay = document.getElementById('addressModalOverlay');
    if (!modalOverlay) return;

    modalOverlay.classList.remove('active');
    setTimeout(() => {
        modalOverlay.style.display = 'none';
    }, 320);
}

document.addEventListener('DOMContentLoaded', () => {
    initLabelChips();

    // Back Button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    // Modal Trigger Buttons
    const btnOpenModal = document.getElementById('btnOpenAddressModal');
    if (btnOpenModal) {
        btnOpenModal.addEventListener('click', openAddressModal);
    }

    const btnCloseModal = document.getElementById('btnCloseAddressModal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeAddressModal);
    }

    const modalOverlay = document.getElementById('addressModalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeAddressModal();
            }
        });
    }

    // ESC key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            closeAddressModal();
        }
    });

    // Form Submission
    const form = document.getElementById('addressForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const searchInput = document.getElementById('selectedAddressBar');
            const addressInput = document.getElementById('address');

            const mappedAddress = addressInput?.value.trim() || searchInput?.value.trim() || currentAddressString;
            const lat = searchInput?.getAttribute('data-lat');
            const lng = searchInput?.getAttribute('data-lng');

            if (!mappedAddress || mappedAddress.includes('Fetching')) {
                AlertModal.show({
                    type: 'warning',
                    title: 'Invalid Address',
                    message: 'Please pin or select a valid location before saving.',
                    buttons: [{ label: 'OK', variant: 'ghost' }]
                });
                return;
            }

            const phone = document.getElementById('phone')?.value.trim() ?? '';
            const phoneRegex = /^09\d{9}$/;
            if (!phoneRegex.test(phone)) {
                AlertModal.show({
                    type: 'warning',
                    title: 'Invalid Phone Number',
                    message: 'Please enter a valid 11-digit phone number (e.g. 09292096887).',
                    buttons: [{ label: 'OK', variant: 'ghost' }]
                });
                return;
            }

            const contactName = document.getElementById('contact')?.value.trim() ?? '';
            if (!contactName) {
                AlertModal.show({
                    type: 'warning',
                    title: 'Contact Name Required',
                    message: 'Please provide a contact person name for delivery.',
                    buttons: [{ label: 'OK', variant: 'ghost' }]
                });
                return;
            }

            const submitBtn = document.getElementById('submitAddressBtn');
            const originalBtnText = submitBtn ? submitBtn.textContent : 'Save Address';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
            }

            const urlParams = new URLSearchParams(window.location.search);
            const addressId = urlParams.get('addressId');

            const payload = {
                Id: addressId ? parseInt(addressId, 10) : null,
                Label: labelInput ? labelInput.value : 'Home',
                FullAddress: mappedAddress,
                Lat: lat ? parseFloat(lat) : null,
                Lng: lng ? parseFloat(lng) : null,
                Unit: document.getElementById('floor')?.value.trim(),
                Name: contactName,
                Phone: phone,
                Note: document.getElementById('landmark')?.value.trim()
            };

            const tokenElement = document.querySelector('input[name="__RequestVerificationToken"]');
            const token = tokenElement ? tokenElement.value : '';

            fetch('/Customer/SaveAddress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': token
                },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (res.status === 401) throw new Error('Unauthorized');
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    const doRedirect = () => {
                        if (window.isFirstTimeFlow) {
                            window.location.href = '/Customer/CustomerHome';
                        } else {
                            const returnTo = urlParams.get('returnTo');
                            if (returnTo === 'checkout') {
                                window.location.href = '/Customer/FoodXCheckOut';
                            } else {
                                window.location.href = '/Customer/CustomerSavedAddresses';
                            }
                        }
                    };

                    AlertModal.show({
                        type: 'success',
                        title: 'Address Saved',
                        message: 'Your address has been saved successfully.',
                        onClose: doRedirect,
                        buttons: [
                            {
                                label: 'OK',
                                variant: 'success',
                                callback: () => AlertModal.close()
                            }
                        ]
                    });
                    
                    // Auto-redirect after 1.5 seconds
                    setTimeout(() => {
                        AlertModal.close();
                    }, 1500);
                } else {
                    throw new Error('Failed to save');
                }
            })
            .catch(err => {
                console.error('Error saving address:', err);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
                AlertModal.show({
                    type: 'danger',
                    title: 'Error',
                    message: 'Could not save address. Please check your connection and try again.',
                    buttons: [{ label: 'OK', variant: 'ghost' }]
                });
            });
        });
    }
});
