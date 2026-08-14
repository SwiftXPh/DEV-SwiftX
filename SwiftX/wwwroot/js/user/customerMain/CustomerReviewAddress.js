// CustomerReviewAddress.js — Google Maps & Backend API Integration

let map, marker, autocomplete;
let geocoder;

// Ensure this matches the ID from your label chip container
let labelChips;
let labelInput;

function initMap() {
    const initialCoords = { lat: 14.3833, lng: 120.9333 }; // Philippines fallback

    map = new google.maps.Map(document.getElementById('addressPickerMap'), {
        center: initialCoords,
        zoom: 14,
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
        // If not editing, try to get current location or just use fallback
        reverseGeocode(initialCoords);
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

    // Autocomplete for search bar
    const searchInput = document.getElementById('selectedAddressBar');
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
    
    // Fallback if user presses enter without selecting from dropdown
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
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

                document.getElementById('floor').value = address.unit || '';
                document.getElementById('phone').value = address.phone || '';
                document.getElementById('contact').value = address.name || '';
                document.getElementById('landmark').value = address.note || '';

                // Set label chip
                setLabelChip(address.label);
            }
        })
        .catch(err => console.error('Error fetching address for edit:', err));
}

function reverseGeocode(latLng) {
    setAddressText('Fetching address...');
    
    // Handle both google.maps.LatLng object and plain {lat, lng} object
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
    const searchInput = document.getElementById('selectedAddressBar');
    const addressInput = document.getElementById('address');
    if (searchInput) searchInput.value = text;
    if (addressInput) addressInput.value = text;
}

function setCoords(lat, lng) {
    const searchInput = document.getElementById('selectedAddressBar');
    if (searchInput) {
        searchInput.setAttribute('data-lat', lat);
        searchInput.setAttribute('data-lng', lng);
    }
}

function setLabelChip(label) {
    let matched = false;
    labelChips.forEach(chip => {
        if (chip.getAttribute('data-label') === label) {
            chip.classList.add('selected');
            labelInput.value = label;
            matched = true;
        } else {
            chip.classList.remove('selected');
        }
    });
    
    if (!matched && label) {
        // If it's a custom label, maybe set 'Other' as selected?
        labelChips.forEach(chip => {
            if (chip.getAttribute('data-label') === 'Other') {
                chip.classList.add('selected');
                labelInput.value = 'Other';
            }
        });
    }
}

// Label chips event listeners
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

document.addEventListener('DOMContentLoaded', () => {
    initLabelChips();

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    const form = document.getElementById('addressForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const searchInput = document.getElementById('selectedAddressBar');
            const addressInput = document.getElementById('address');
            
            // Prefer the address input (so user can edit the geocoded text)
            const mappedAddress = addressInput?.value.trim() ?? searchInput?.value.trim() ?? '';
            const lat = searchInput?.getAttribute('data-lat');
            const lng = searchInput?.getAttribute('data-lng');

            if (!mappedAddress || mappedAddress.includes('Fetching')) {
                AlertModal.show({
                    type: 'warning',
                    title: 'Invalid Address',
                    message: 'Please enter or select a valid address before saving.',
                    buttons: [{ label: 'OK', variant: 'ghost' }]
                });
                return;
            }

            const phone = document.getElementById('phone')?.value.trim() ?? '';
            // Basic regex for PH number (11 digits starting with 09)
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

            const urlParams = new URLSearchParams(window.location.search);
            const addressId = urlParams.get('addressId');
            
            const payload = {
                Id: addressId ? parseInt(addressId, 10) : null,
                Label: labelInput.value,
                FullAddress: mappedAddress,
                Lat: lat ? parseFloat(lat) : null,
                Lng: lng ? parseFloat(lng) : null,
                Unit: document.getElementById('floor')?.value.trim(),
                Name: document.getElementById('contact')?.value.trim(),
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
                    AlertModal.show({
                        type: 'success',
                        title: 'Address Saved',
                        message: 'Your address has been saved successfully.',
                        buttons: [
                            {
                                label: 'OK',
                                variant: 'success',
                                callback: () => {
                                    if (window.isFirstTimeFlow) {
                                        window.location.href = '/Customer/CustomerHome';
                                    } else {
                                        const returnTo = urlParams.get('returnTo');
                                        if (returnTo === 'checkout') {
                                            window.location.href = '/Customer/FoodXCheckOut';
                                        } else {
                                            // Go back or to saved addresses
                                            window.location.href = '/Customer/CustomerSavedAddresses';
                                        }
                                    }
                                }
                            }
                        ]
                    });
                } else {
                    throw new Error('Failed to save');
                }
            })
            .catch(err => {
                console.error('Error saving address:', err);
                AlertModal.show({
                    type: 'danger',
                    title: 'Error',
                    message: 'Could not save address. Please try again.',
                    buttons: [{ label: 'OK', variant: 'ghost' }]
                });
            });
        });
    }
});
