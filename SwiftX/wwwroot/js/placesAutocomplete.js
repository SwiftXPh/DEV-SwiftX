let locationMap = null;
let locationMarker = null;
let geocoder = null;

// This is called by the Google Maps script tag callback
window.initLocationMap = function() {
    const mapElement = document.getElementById('location-map');
    if (!mapElement) return;

    // Default to Bukidnon/North Mindanao area
    const defaultLocation = { lat: 7.97, lng: 124.99 };
    
    locationMap = new google.maps.Map(mapElement, {
        center: defaultLocation,
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });

    locationMarker = new google.maps.Marker({
        map: locationMap,
        position: defaultLocation,
        draggable: true
    });

    geocoder = new google.maps.Geocoder();

    // Handle map clicks
    locationMap.addListener('click', (e) => {
        const latLng = e.latLng;
        locationMarker.setPosition(latLng);
        reverseGeocode(latLng);
    });

    // Handle marker drags
    locationMarker.addListener('dragend', () => {
        reverseGeocode(locationMarker.getPosition());
    });
};

function reverseGeocode(latLng) {
    if (!geocoder) return;

    const locationInput = document.getElementById('businessLocation');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');

    if (locationInput) locationInput.classList.add('loading');

    geocoder.geocode({ location: latLng }, (results, status) => {
        if (locationInput) locationInput.classList.remove('loading');
        
        if (status === 'OK' && results[0]) {
            if (locationInput) locationInput.value = results[0].formatted_address;
            if (latitudeInput) latitudeInput.value = latLng.lat();
            if (longitudeInput) longitudeInput.value = latLng.lng();
        } else {
            console.error('Geocoder failed due to: ' + status);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const locationInput = document.getElementById('businessLocation');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const dropdown = document.getElementById('places-dropdown');
    
    if (!locationInput || !dropdown) return;

    let debounceTimer;
    let currentFocus = -1;

    locationInput.addEventListener('input', function(e) {
        const val = this.value;
        closeAllLists();
        if (!val) return false;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                // Show a loading state if we want, or just wait for response
                const response = await fetch(`/Admin/PlacesAutocomplete?input=${encodeURIComponent(val)}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                
                if (data.suggestions && data.suggestions.length > 0) {
                    currentFocus = -1;
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'block';

                    data.suggestions.forEach(suggestion => {
                        const prediction = suggestion.placePrediction;
                        if (!prediction) return;
                        
                        const item = document.createElement('div');
                        item.className = 'places-dropdown-item';
                        
                        // Icon
                        const icon = document.createElement('i');
                        icon.className = 'ph ph-map-pin';
                        item.appendChild(icon);

                        // Text
                        const text = document.createElement('span');
                        text.innerHTML = prediction.text?.text || prediction.description;
                        item.appendChild(text);

                        // Hidden input for place_id
                        const hiddenInput = document.createElement('input');
                        hiddenInput.type = 'hidden';
                        hiddenInput.value = prediction.placeId;
                        item.appendChild(hiddenInput);

                        item.addEventListener('click', async function(e) {
                            const placeId = this.getElementsByTagName('input')[0].value;
                            const description = this.getElementsByTagName('span')[0].innerText;
                            
                            // Immediately set the input value to selection so user sees feedback
                            locationInput.value = description;
                            closeAllLists();
                            
                            // Fetch details for lat/lng and exact formatted address
                            await fetchPlaceDetails(placeId);
                        });
                        dropdown.appendChild(item);
                    });
                } else {
                    closeAllLists();
                }
            } catch (err) {
                console.error('Error fetching autocomplete suggestions:', err);
                closeAllLists();
            }
        }, 300); // 300ms debounce
    });

    locationInput.addEventListener('keydown', function(e) {
        const items = dropdown.getElementsByClassName('places-dropdown-item');
        if (e.keyCode == 40) { // Down
            currentFocus++;
            addActive(items);
        } else if (e.keyCode == 38) { // Up
            currentFocus--;
            addActive(items);
        } else if (e.keyCode == 13) { // Enter
            e.preventDefault();
            if (currentFocus > -1) {
                if (items) items[currentFocus].click();
            }
        } else if (e.keyCode == 27) { // Escape
            closeAllLists();
        }
    });

    async function fetchPlaceDetails(placeId) {
        try {
            // Display loading indicator if needed
            locationInput.classList.add('loading');

            const response = await fetch(`/Admin/PlaceDetails?placeId=${encodeURIComponent(placeId)}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            // The New Places API returns data directly (no "result" wrapper like the old API)
            if (data) {
                locationInput.value = data.formattedAddress || locationInput.value;
                if (data.location) {
                    latitudeInput.value = data.location.latitude;
                    longitudeInput.value = data.location.longitude;
                    
                    // Sync with map
                    if (locationMap && locationMarker) {
                        const pos = { lat: data.location.latitude, lng: data.location.longitude };
                        locationMap.panTo(pos);
                        locationMap.setZoom(15);
                        locationMarker.setPosition(pos);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching place details:', err);
        } finally {
            locationInput.classList.remove('loading');
        }
    }

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add('places-dropdown-item-active');
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove('places-dropdown-item-active');
        }
    }

    function closeAllLists(elmnt) {
        if (elmnt != locationInput && elmnt != dropdown) {
            dropdown.style.display = 'none';
            dropdown.innerHTML = '';
        }
    }

    document.addEventListener('click', function(e) {
        closeAllLists(e.target);
    });
});
