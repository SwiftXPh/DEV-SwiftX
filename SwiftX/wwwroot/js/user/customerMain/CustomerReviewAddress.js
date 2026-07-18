// CustomerReviewAddress.js — v2.0.0

document.addEventListener('DOMContentLoaded', () => {

    // ══════════════════════════════════════════════════════════
    // STORAGE  (TODO: replace with backend API when ready)
    // ══════════════════════════════════════════════════════════
    const SAVED_ADDRESSES_KEY = 'foodx_saved_addresses';
    const CHECKOUT_FLOW_FLAG  = 'is_checkout_flow';

    function getSavedAddresses() {
        return JSON.parse(localStorage.getItem(SAVED_ADDRESSES_KEY)) || [];
    }

    function saveAddresses(array) {
        localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(array));
    }


    // ══════════════════════════════════════════════════════════
    // ELEMENT REFS
    // ══════════════════════════════════════════════════════════
    const form           = document.getElementById('addressForm');
    const mapSearchInput = document.getElementById('selectedAddressBar');
    const addressInput   = document.getElementById('address');
    const backBtn        = document.getElementById('back-btn');

    // Primary address input target (form field preferred over map bar)
    const addressTarget  = addressInput || mapSearchInput;

    let map, marker, searchTimeout;
    let initialCoords = [120.9333, 14.3833]; // fallback


    // ══════════════════════════════════════════════════════════
    // URL PARAMS — pre-populate if editing an existing address
    // ══════════════════════════════════════════════════════════
    const urlParams      = new URLSearchParams(window.location.search);
    const addressIdParam = urlParams.get('addressId');
    const urlFullAddress = urlParams.get('fullAddress');
    const returnParam    = urlParams.get('returnTo');

    if (returnParam === 'checkout') {
        localStorage.setItem(CHECKOUT_FLOW_FLAG, 'true');
    }

    let resolvedText         = '';
    let currentMatchedAddress = null;

    if (addressIdParam) {
        const parsedId = parseInt(addressIdParam, 10);
        currentMatchedAddress = getSavedAddresses().find(a => a.id === parsedId);

        if (currentMatchedAddress) {
            initialCoords  = [
                parseFloat(currentMatchedAddress.lng || 120.9333),
                parseFloat(currentMatchedAddress.lat || 14.3833)
            ];
            resolvedText   = currentMatchedAddress.fullAddress || currentMatchedAddress.address || '';

            const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
            set('floor',    currentMatchedAddress.unit);
            set('phone',    currentMatchedAddress.phone);
            set('contact',  currentMatchedAddress.name);
            set('landmark', currentMatchedAddress.note);
        } else if (urlFullAddress) {
            resolvedText = decodeURIComponent(urlFullAddress);
        }
    } else if (urlFullAddress) {
        resolvedText = decodeURIComponent(urlFullAddress);
    }

    // Push resolved text to both inputs
    if (resolvedText) {
        [mapSearchInput, addressInput].forEach(input => {
            if (!input) return;
            input.value = resolvedText;
            input.setAttribute('data-lng', initialCoords[0]);
            input.setAttribute('data-lat', initialCoords[1]);
        });
    }


    // ══════════════════════════════════════════════════════════
    // MAPBOX INIT
    // ══════════════════════════════════════════════════════════
    if (document.getElementById('addressPickerMap')) {
        if (typeof mapboxgl === 'undefined') {
            console.error('Mapbox GL JS not loaded.');
        } else {
            mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';

            map = new mapboxgl.Map({
                container : 'addressPickerMap',
                style     : 'mapbox://styles/mapbox/dark-v11',
                center    : initialCoords,
                zoom      : addressIdParam ? 16 : 14
            });

            marker = new mapboxgl.Marker({ draggable: true, color: '#d34502' })
                .setLngLat(initialCoords)
                .addTo(map);

            if (!addressIdParam && !urlFullAddress) {
                reverseGeocode(initialCoords[0], initialCoords[1]);
            }

            marker.on('dragend', () => {
                const { lng, lat } = marker.getLngLat();
                reverseGeocode(lng, lat);
            });

            map.on('click', (e) => {
                marker.setLngLat(e.lngLat);
                reverseGeocode(e.lngLat.lng, e.lngLat.lat);
            });
        }
    }


    // ══════════════════════════════════════════════════════════
    // FORWARD GEOCODING (search bar → map)
    // ══════════════════════════════════════════════════════════
    mapSearchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length < 4 || query.includes('Fetching')) return;

        searchTimeout = setTimeout(() => forwardGeocode(query), 600);
    });

    function forwardGeocode(query) {
        const token = mapboxgl?.accessToken;
        if (!token || token === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') return;

        const clean = query.replace(/[🗺️📍]/g, '').trim();
        const url   = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(clean)}.json`
                    + `?access_token=${token}&limit=1&country=PH`;

        fetch(url)
            .then(r => r.json())
            .then(data => {
                const feature = data.features?.[0];
                if (!feature) return;
                const [lng, lat] = feature.center;
                map?.flyTo({ center: [lng, lat], zoom: 16 });
                marker?.setLngLat([lng, lat]);
                setCoords(lng, lat);
            })
            .catch(err => console.error('Forward geocode failed:', err));
    }


    // ══════════════════════════════════════════════════════════
    // REVERSE GEOCODING (pin drop → address text)
    // ══════════════════════════════════════════════════════════
    function reverseGeocode(lng, lat) {
        setAddressText('Fetching address...');
        setCoords(lng, lat);

        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: { 'User-Agent': 'SwiftX-Delivery-App' }
        })
            .then(r => r.json())
            .then(data => {
                setAddressText(data.display_name || `Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
            })
            .catch(() => {
                setAddressText(`Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
            });
    }

    function setAddressText(text) {
        [mapSearchInput, addressInput].forEach(input => {
            if (input) input.value = text;
        });
    }

    function setCoords(lng, lat) {
        [mapSearchInput, addressInput].forEach(input => {
            if (!input) return;
            input.setAttribute('data-lng', lng);
            input.setAttribute('data-lat', lat);
        });
    }


    // ══════════════════════════════════════════════════════════
    // BACK BUTTON
    // ══════════════════════════════════════════════════════════
    backBtn?.addEventListener('click', () => {
        window.history.back();
    });


    // ══════════════════════════════════════════════════════════
    // FORM SUBMISSION
    // ══════════════════════════════════════════════════════════
    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const mappedAddress = addressTarget?.value.trim() ?? '';
        const lng           = addressTarget?.getAttribute('data-lng') ?? '';
        const lat           = addressTarget?.getAttribute('data-lat') ?? '';

        if (!mappedAddress || mappedAddress.includes('Fetching')) {
            AlertModal.show({
                type    : 'warning',
                title   : 'Invalid Address',
                message : 'Please enter or select a valid address before saving.',
                buttons : [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }

        const phone      = document.getElementById('phone')?.value.trim() ?? '';
        const phoneRegex = /^\d{11}$/;
        if (!phoneRegex.test(phone)) {
            AlertModal.show({
                type    : 'warning',
                title   : 'Invalid Phone Number',
                message : 'Please enter a valid 11-digit phone number (e.g. 09292096887).',
                buttons : [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }

        let addresses = getSavedAddresses();
        const parsedId = addressIdParam ? parseInt(addressIdParam, 10) : null;

        const newData = {
            fullAddress : mappedAddress,
            address     : mappedAddress,
            lng, lat,
            unit    : document.getElementById('floor')?.value.trim()    ?? '',
            phone,
            name    : document.getElementById('contact')?.value.trim()  ?? '',
            note    : document.getElementById('landmark')?.value.trim() ?? ''
        };

        if (parsedId && addresses.some(a => a.id === parsedId)) {
            // Update existing
            addresses = addresses.map(a => a.id === parsedId ? { ...a, ...newData } : a);
        } else {
            // Add new
            addresses.push({
                id    : Date.now(),
                label : currentMatchedAddress?.label ?? 'Saved Location',
                ...newData
            });
        }

        saveAddresses(addresses);

        AlertModal.show({
            type    : 'success',
            title   : 'Address Saved',
            message : 'Your address has been saved successfully.',
            buttons : [
                {
                    label    : 'OK',
                    variant  : 'success',
                    callback : () => {
                        const dest = localStorage.getItem(CHECKOUT_FLOW_FLAG) === 'true'
                            ? '/Customer/CustomerSavedAddresses?mode=checkout'
                            : '/Customer/CustomerSavedAddresses';
                        window.location.href = dest;
                    }
                }
            ]
        });
    });

});
