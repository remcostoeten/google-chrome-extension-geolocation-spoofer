const cities = [];

// Global variables
let map
let marker
let settings = {
  enabled: false,
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 10,
  randomEnabled: false,
  randomRadius: 100,
  logRequests: false,
  ui: {
    fontSize: 14, // Base font size in px
    spacing: 12,  // Base spacing in px
    buttonWidth: '100%', // Full width buttons
    modalWidth: '400px', // Default modal width
    compact: false // Compact mode toggle
  }
}

let profiles = []
let logs = []
let googleMapsApiKey = ""

// PDK API endpoints
const PDK_API = {
  SUGGEST: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest',
  LOOKUP: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup'
};

// Cache for search results
let searchCache = new Map();

// Add initialization state
let isInitialized = false;

function renderProfiles() {
  const profilesList = document.getElementById("profiles-list")
  profilesList.innerHTML = ""

  profiles.forEach((profile, index) => {
    const profileItem = document.createElement("div")
    profileItem.className = "profile-item"

    const profileInfo = document.createElement("div")
    profileInfo.textContent = `${profile.name} (${profile.latitude}, ${profile.longitude})`

    const actions = document.createElement("div")
    actions.className = "profile-actions"

    const loadButton = document.createElement("button")
    loadButton.textContent = "Load"
    loadButton.onclick = () => loadProfile(index)

    const deleteButton = document.createElement("button")
    deleteButton.textContent = "Delete"
    deleteButton.onclick = () => deleteProfile(index)

    actions.appendChild(loadButton)
    actions.appendChild(deleteButton)
    profileItem.appendChild(profileInfo)
    profileItem.appendChild(actions)
    profilesList.appendChild(profileItem)
  })
}

function renderLogs() {
  const logsContainer = document.getElementById("logs-container")
  logsContainer.innerHTML = ""

  logs.slice(-50).forEach(log => {
    const logEntry = document.createElement("div")
    logEntry.className = "log-entry"
    logEntry.textContent = `${new Date(log.timestamp).toLocaleString()} - ${log.url}`
    logsContainer.appendChild(logEntry)
  })
}

function updateUIElements() {
  document.getElementById("enabled").checked = settings.enabled
  document.getElementById("latitude").value = settings.latitude.toFixed(6)
  document.getElementById("longitude").value = settings.longitude.toFixed(6)
  document.getElementById("accuracy").value = settings.accuracy
  document.getElementById("accuracy-value").textContent = settings.accuracy
  document.getElementById("random-enabled").checked = settings.randomEnabled
  document.getElementById("random-radius").value = settings.randomRadius
  document.getElementById("random-radius-value").textContent = settings.randomRadius
  document.getElementById("log-requests").checked = settings.logRequests

  // Try to find matching city for current coordinates
  const matchingCity = cities.find(city =>
    Math.abs(city.lat - settings.latitude) < 0.01 &&
    Math.abs(city.lng - settings.longitude) < 0.01
  )

  const locationInput = document.getElementById("location-input")
  if (matchingCity) {
    locationInput.value = `${matchingCity.name}, ${matchingCity.country}`
  } else {
    locationInput.value = `${settings.latitude.toFixed(4)}, ${settings.longitude.toFixed(4)}`
  }

  // Update map if available
  if (map && marker) {
    const position = new google.maps.LatLng(settings.latitude, settings.longitude)
    marker.setPosition(position)
    map.setCenter(position)
  }

  // Save settings
  saveSettings()
}

function initializeMap() {
  // Implementation details should be added here
  console.log("Initializing map")
}

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get(["geoSettings", "geoProfiles", "geoLogs", "googleMapsApiKey"], (result) => {
    if (result.geoSettings) {
      settings = { ...settings, ...result.geoSettings }
      updateUI()
    }

    if (result.geoProfiles) {
      profiles = result.geoProfiles
      renderProfiles()
    }

    if (result.geoLogs) {
      logs = result.geoLogs
      renderLogs()
    }

    if (result.googleMapsApiKey) {
      googleMapsApiKey = result.googleMapsApiKey
      document.getElementById("api-key").value = googleMapsApiKey
      if (googleMapsApiKey) {
        loadGoogleMapsScript()
      }
    }
  })
}

function saveApiKey() {
  const apiKey = document.getElementById("api-key").value.trim()
  chrome.storage.local.set({ googleMapsApiKey: apiKey }, () => {
    googleMapsApiKey = apiKey
    const status = document.getElementById("api-key-status")
    status.textContent = "API Key saved. Please refresh the extension to apply changes."
    status.style.color = "#4CAF50"
    setTimeout(() => {
      status.textContent = ""
    }, 3000)

    if (apiKey) {
      loadGoogleMapsScript()
    } else {
      // Remove Google Maps if API key is cleared
      const mapContainer = document.getElementById("map-container")
      if (mapContainer) {
        mapContainer.style.display = "none"
      }
      map = null
      marker = null
    }
  })
}

function loadGoogleMapsScript() {
  if (!googleMapsApiKey) return

  const script = document.createElement("script")
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initMap`
  script.async = true
  script.defer = true
  document.head.appendChild(script)
}

function updateUI() {
  document.getElementById("enabled").checked = settings.enabled
  document.getElementById("latitude").value = settings.latitude
  document.getElementById("longitude").value = settings.longitude
  document.getElementById("accuracy").value = settings.accuracy
  document.getElementById("accuracy-value").textContent = settings.accuracy
  document.getElementById("random-enabled").checked = settings.randomEnabled
  document.getElementById("random-radius").value = settings.randomRadius
  document.getElementById("random-radius-value").textContent = settings.randomRadius
  document.getElementById("log-requests").checked = settings.logRequests

  if (map && marker) {
    const position = new google.maps.LatLng(settings.latitude, settings.longitude)
    marker.setPosition(position)
    map.setCenter(position)
  }
}

function initMap() {
  const mapContainer = document.getElementById("map-container")
  mapContainer.style.display = "block"

  const mapOptions = {
    center: { lat: settings.latitude, lng: settings.longitude },
    zoom: 13,
  }

  map = new google.maps.Map(document.getElementById("map"), mapOptions)

  marker = new google.maps.Marker({
    position: { lat: settings.latitude, lng: settings.longitude },
    map: map,
    draggable: true,
    title: "Drag to set location",
  })

  google.maps.event.addListener(marker, "dragend", () => {
    const position = marker.getPosition()
    settings.latitude = position.lat()
    settings.longitude = position.lng()
    updateUI()
    saveSettings()
  })

  google.maps.event.addListener(map, "click", (event) => {
    settings.latitude = event.latLng.lat()
    settings.longitude = event.latLng.lng()
    marker.setPosition(event.latLng)
    updateUI()
    saveSettings()
  })
}

// Function to convert country code to flag emoji
function getCountryFlag(countryCode) {
  if (!countryCode) return '';
  // Convert country code to regional indicator symbols
  const flagEmoji = countryCode.toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('');
  return flagEmoji;
}

// Function to extract country code from address components
function getCountryCodeFromAddress(address) {
  if (!address) return '';
  const components = address.split(',');
  // Try to find a two-letter country code at the end of the address
  const lastComponent = components[components.length - 1].trim();
  if (lastComponent.length === 2) {
    return lastComponent;
  }
  // Common country mappings
  const countryMapping = {
    'Netherlands': 'NL',
    'United States': 'US',
    'United Kingdom': 'GB',
    'Germany': 'DE',
    'France': 'FR',
    'Spain': 'ES',
    'Italy': 'IT'
    // Add more mappings as needed
  };
  return countryMapping[lastComponent] || '';
}

// Function to setup city search with suggestions
function setupCitySearch() {
  const locationInput = document.getElementById("location-input");
  if (!locationInput) return;

  const wrapper = locationInput.parentElement;
  if (!wrapper) return;

  // Create suggestions container
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.className = 'suggestions-container';
  suggestionsContainer.style.position = 'absolute';
  suggestionsContainer.style.width = '100%';
  suggestionsContainer.style.maxHeight = '200px';
  suggestionsContainer.style.overflowY = 'auto';
  suggestionsContainer.style.backgroundColor = 'var(--surface)';
  suggestionsContainer.style.border = '1px solid var(--border)';
  suggestionsContainer.style.borderRadius = 'var(--radius)';
  suggestionsContainer.style.marginTop = '4px';
  suggestionsContainer.style.display = 'none';
  suggestionsContainer.style.zIndex = '1000';
  wrapper.appendChild(suggestionsContainer);

  let debounceTimer;
  let selectedIndex = -1;

  locationInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    
    // Clear existing suggestions
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.style.display = 'none';
    selectedIndex = -1;

    if (query.length < 2) return;

    // Show loading state
    wrapper.classList.add('loading');

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const suggestions = await searchDutchAddresses(query);
        
        // Clear previous suggestions
        suggestionsContainer.innerHTML = '';

        if (suggestions.length === 0) {
          const noResults = document.createElement('div');
          noResults.className = 'suggestion-item no-results';
          noResults.textContent = 'No matching locations found';
          noResults.style.padding = '8px 12px';
          noResults.style.color = 'var(--error)';
          noResults.style.fontSize = '0.85rem';
          suggestionsContainer.appendChild(noResults);
          suggestionsContainer.style.display = 'block';
          return;
        }

        suggestions.forEach((suggestion, index) => {
          const item = document.createElement('div');
          item.className = 'suggestion-item';
          
          // Get country flag
          const flag = suggestion.country ? getCountryFlag(suggestion.country) : '';
          
          // Create container for flag and text
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.gap = '8px';
          item.style.padding = '8px 12px';
          item.style.cursor = 'pointer';
          item.style.fontSize = '0.85rem';
          
          // Add flag if available
          if (flag) {
            const flagSpan = document.createElement('span');
            flagSpan.textContent = flag;
            flagSpan.style.fontSize = '1.2em';
            flagSpan.style.marginRight = '8px';
            item.appendChild(flagSpan);
          }
          
          // Add location text
          const textSpan = document.createElement('span');
          textSpan.textContent = suggestion.display;
          item.appendChild(textSpan);

          item.addEventListener('mouseover', () => {
            selectedIndex = index;
            updateSelectedSuggestion();
          });

          item.addEventListener('click', () => {
            selectLocation(suggestion);
          });

          suggestionsContainer.appendChild(item);
        });

        suggestionsContainer.style.display = 'block';
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        showStatus('Error fetching location suggestions', 'error');
      } finally {
        wrapper.classList.remove('loading');
      }
    }, 300);
  });

  function updateSelectedSuggestion() {
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.style.backgroundColor = 'var(--surface-hover)';
      } else {
        item.style.backgroundColor = '';
      }
    });
  }

  function selectLocation(suggestion) {
    locationInput.value = suggestion.display;
    settings.latitude = suggestion.lat;
    settings.longitude = suggestion.lng;
    suggestionsContainer.style.display = 'none';
    updateUIElements();
    saveSettings();
    showStatus('Location updated', 'success');
  }

  // Handle keyboard navigation
  locationInput.addEventListener('keydown', (e) => {
    const items = suggestionsContainer.querySelectorAll('.suggestion-item:not(.no-results)');
    if (!items.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelectedSuggestion();
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        updateSelectedSuggestion();
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const suggestions = Array.from(suggestionsContainer.querySelectorAll('.suggestion-item:not(.no-results)'));
          const suggestion = suggestions[selectedIndex];
          if (suggestion) {
            suggestion.click();
          }
        }
        break;
      case 'Escape':
        suggestionsContainer.style.display = 'none';
        selectedIndex = -1;
        break;
    }
  });

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      suggestionsContainer.style.display = 'none';
      selectedIndex = -1;
    }
  });
}

// Update searchDutchAddresses function to handle errors better
async function searchDutchAddresses(query) {
  if (query.length < 2) return [];

  try {
    // Try Nominatim first for broader search
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GeoLocationManager/1.0'
        }
      }
    );

    if (!nominatimResponse.ok) {
      throw new Error('Nominatim search failed');
    }

    const nominatimData = await nominatimResponse.json();
    
    if (nominatimData.length > 0) {
      return nominatimData.map(place => ({
        id: place.place_id,
        display: place.display_name.split(',')[0],
        type: place.type,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        country: place.address?.country_code?.toUpperCase() || ''
      }));
    }

    // If no results from Nominatim, try PDK API for Dutch-specific locations
    const pdkParams = new URLSearchParams({
      q: query,
      rows: 10
    });

    const pdkResponse = await fetch(`${PDK_API.SUGGEST}?${pdkParams}`);
    if (!pdkResponse.ok) {
      throw new Error(`PDK API error! status: ${pdkResponse.status}`);
    }

    const pdkData = await pdkResponse.json();

    if (pdkData.response?.docs) {
      return pdkData.response.docs
        .filter(doc => doc.centroide_ll)
        .map(doc => {
          const coords = doc.centroide_ll.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          return {
            id: doc.id,
            display: doc.weergavenaam,
            type: doc.type,
            lat: coords ? parseFloat(coords[2]) : null,
            lng: coords ? parseFloat(coords[1]) : null,
            country: 'NL' // PDK API is Netherlands-specific
          };
        })
        .filter(item => item.lat !== null && item.lng !== null);
    }

    return [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

// Update setLocationFromInput to handle errors better
async function setLocationFromInput() {
  const input = document.getElementById("location-input").value.trim();
  const datalist = document.getElementById("city-suggestions");

  try {
    // First check if we have a selected option from the datalist
    const option = Array.from(datalist.options).find(opt => opt.value === input);

    if (option) {
      const lat = parseFloat(option.getAttribute('data-lat'));
      const lng = parseFloat(option.getAttribute('data-lng'));

      if (!isNaN(lat) && !isNaN(lng)) {
        settings.latitude = lat;
        settings.longitude = lng;
        updateUIElements();
        saveSettings();
        return;
      }
    }

    // If no exact match, try to search for the location
    const suggestions = await searchDutchAddresses(input);
    if (suggestions.length > 0) {
      const firstResult = suggestions[0];
      settings.latitude = parseFloat(firstResult.lat);
      settings.longitude = parseFloat(firstResult.lng);
      document.getElementById("location-input").value = firstResult.display;
      updateUIElements();
      saveSettings();
      return;
    }

    // Finally, try parsing as coordinates
    const coords = input.split(",").map(coord => parseFloat(coord.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      settings.latitude = coords[0];
      settings.longitude = coords[1];
      updateUIElements();
      saveSettings();
    } else {
      throw new Error("Invalid location format");
    }
  } catch (error) {
    console.error('Error setting location:', error);
    // Show error to user
    const status = document.createElement('div');
    status.textContent = "Please enter a valid city name or coordinates (latitude, longitude)";
    status.className = 'error';
    status.style.position = 'absolute';
    status.style.bottom = '-20px';
    status.style.left = '0';
    status.style.fontSize = '0.75rem';

    const container = document.getElementById("location-input").parentElement;
    container.style.position = 'relative';
    container.appendChild(status);

    setTimeout(() => {
      status.remove();
    }, 3000);
  }
}

function loadProfile(index) {
  const profile = profiles[index]
  settings.latitude = profile.latitude
  settings.longitude = profile.longitude
  updateUI()
  saveSettings()
}

function deleteProfile(index) {
  profiles.splice(index, 1)
  chrome.storage.local.set({ geoProfiles: profiles }, () => {
    renderProfiles()
  })
}

function saveSettings() {
  chrome.storage.local.set({ geoSettings: settings }, () => {
    console.log("Settings saved", settings)
  })
}

async function getCurrentLocation() {
  const locationInput = document.getElementById("location-input");
  if (!locationInput) {
    showStatus('Location input element not found', 'error');
    return;
  }

  const wrapper = locationInput.parentElement;
  if (!wrapper) {
    showStatus('Location input wrapper not found', 'error');
    return;
  }

  try {
    if (!("geolocation" in navigator)) {
      throw new Error("Geolocation is not supported by this browser.");
    }

    // Show loading state
    wrapper.classList.add('loading');

    // Request permission first
    const permission = await navigator.permissions.query({ name: 'geolocation' });

    if (permission.state === 'denied') {
      throw new Error('Location permission denied. Please enable location access in your browser settings.');
    }

    // Get position with a promise wrapper
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    // Update settings with the new position
    settings.latitude = position.coords.latitude;
    settings.longitude = position.coords.longitude;
    settings.accuracy = Math.round(position.coords.accuracy);

    // Try to get the location name
    try {
      const locationName = await ensureLocationName(settings.latitude, settings.longitude);
      locationInput.value = locationName;
    } catch (error) {
      // Fallback to coordinates if location name lookup fails
      locationInput.value = `${settings.latitude.toFixed(6)}, ${settings.longitude.toFixed(6)}`;
    }

    // Update UI and save
    await updateUIElements();
    saveSettings();

    // Show success message
    showStatus('Location successfully updated', 'success');
  } catch (error) {
    console.error("Error getting location:", error);
    showStatus(error.message || 'Could not get current location', 'error');
  } finally {
    wrapper.classList.remove('loading');
  }
}

// Improve showStatus to be more toast-like
function showStatus(message, type = 'error') {
  const toastContainer = document.querySelector('.toast-container') || (() => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
  })();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.backgroundColor = 'var(--surface)';
  toast.style.color = `var(--${type})`;
  toast.style.padding = '12px 16px';
  toast.style.borderRadius = 'var(--radius)';
  toast.style.marginTop = '8px';
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
  toast.style.fontSize = '0.85rem';
  toast.style.border = '1px solid var(--border)';
  toast.style.minWidth = '200px';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'all 0.3s ease';

  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="color: var(--${type})">${icon}</span>
      <span>${message}</span>
    </div>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Function to get detailed information about a location
async function getLocationDetails(id) {
  try {
    const params = new URLSearchParams({
      id: id
    });

    const response = await fetch(`${PDK_API.LOOKUP}?${params}`);
    const data = await response.json();

    const doc = data.response.docs[0];
    return {
      name: doc.weergavenaam,
      type: doc.type,
      lat: doc.centroide_ll.split('(')[1].split(' ')[1],
      lng: doc.centroide_ll.split('(')[1].split(' ')[0]
    };
  } catch (error) {
    console.error('Error fetching location details:', error);
    return null;
  }
}

// Initialize the popup
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupCitySearch();
  setupGeolocationMonitoring();

  // Add UI settings tab content
  const tabsContainer = document.querySelector('.tabs-container');
  if (tabsContainer) {  // Only add UI settings if tabs container exists
    const uiSettings = document.createElement('div');
    uiSettings.id = 'ui-settings';
    uiSettings.className = 'tab-content';
    uiSettings.innerHTML = `
      <h3 style="font-size: var(--heading-font-size)">UI Customization</h3>
      <div class="settings-group">
        <label>
          Font Size (px)
          <input type="range" id="font-size" min="12" max="20" value="${settings.ui.fontSize}">
          <span id="font-size-value">${settings.ui.fontSize}</span>
        </label>
        
        <label>
          Spacing (px)
          <input type="range" id="spacing" min="8" max="20" value="${settings.ui.spacing}">
          <span id="spacing-value">${settings.ui.spacing}</span>
        </label>
        
        <label>
          Modal Width
          <select id="modal-width">
            <option value="350px" ${settings.ui.modalWidth === '350px' ? 'selected' : ''}>Small (350px)</option>
            <option value="400px" ${settings.ui.modalWidth === '400px' ? 'selected' : ''}>Medium (400px)</option>
            <option value="500px" ${settings.ui.modalWidth === '500px' ? 'selected' : ''}>Large (500px)</option>
          </select>
        </label>
        
        <label>
          <input type="checkbox" id="compact-mode" ${settings.ui.compact ? 'checked' : ''}>
          Compact Mode
        </label>
      </div>
    `;
    
    tabsContainer.appendChild(uiSettings);
    
    // Add UI settings event listeners
    const fontSizeInput = document.getElementById('font-size');
    const spacingInput = document.getElementById('spacing');
    const modalWidthSelect = document.getElementById('modal-width');
    const compactModeCheckbox = document.getElementById('compact-mode');

    if (fontSizeInput) {
      fontSizeInput.addEventListener('input', function() {
        settings.ui.fontSize = parseInt(this.value);
        document.getElementById('font-size-value').textContent = this.value;
        applyUISettings();
        debouncedSave();
      });
    }
    
    if (spacingInput) {
      spacingInput.addEventListener('input', function() {
        settings.ui.spacing = parseInt(this.value);
        document.getElementById('spacing-value').textContent = this.value;
        applyUISettings();
        debouncedSave();
      });
    }
    
    if (modalWidthSelect) {
      modalWidthSelect.addEventListener('change', function() {
        settings.ui.modalWidth = this.value;
        applyUISettings();
        debouncedSave();
      });
    }
    
    if (compactModeCheckbox) {
      compactModeCheckbox.addEventListener('change', function() {
        settings.ui.compact = this.checked;
        applyUISettings();
        debouncedSave();
      });
    }
  }

  // Apply UI settings after everything is set up
  applyUISettings();

  // Event listeners for core functionality
  const getCurrentLocationBtn = document.getElementById("get-current-location");
  if (getCurrentLocationBtn) {
    getCurrentLocationBtn.addEventListener("click", getCurrentLocation);
  }

  const setLocationBtn = document.getElementById("set-location");
  if (setLocationBtn) {
    setLocationBtn.addEventListener("click", setLocationFromInput);
  }

  // ... rest of the event listeners with null checks ...
  const enabledCheckbox = document.getElementById("enabled");
  if (enabledCheckbox) {
    enabledCheckbox.addEventListener("change", function() {
      settings.enabled = this.checked;
      saveSettings();
      showStatus(settings.enabled ? 'Location override enabled' : 'Location override disabled', 'success');
    });
  }

  // Add other event listeners with similar null checks
  const elements = {
    latitude: document.getElementById("latitude"),
    longitude: document.getElementById("longitude"),
    accuracy: document.getElementById("accuracy"),
    randomEnabled: document.getElementById("random-enabled"),
    randomRadius: document.getElementById("random-radius"),
    logRequests: document.getElementById("log-requests"),
    saveProfile: document.getElementById("save-profile"),
    saveApiKey: document.getElementById("save-api-key")
  };

  if (elements.latitude) {
    elements.latitude.addEventListener("change", function() {
      const lat = Number.parseFloat(this.value);
      if (validateCoordinates(lat, settings.longitude)) {
        settings.latitude = lat;
        updateUI();
        saveSettings();
      } else {
        this.value = settings.latitude;
        showStatus('Invalid latitude value', 'error');
      }
    });
  }

  if (elements.longitude) {
    elements.longitude.addEventListener("change", function() {
      const lng = Number.parseFloat(this.value);
      if (validateCoordinates(settings.latitude, lng)) {
        settings.longitude = lng;
        updateUI();
        saveSettings();
      } else {
        this.value = settings.longitude;
        showStatus('Invalid longitude value', 'error');
      }
    });
  }

  if (elements.accuracy) {
    elements.accuracy.addEventListener("input", function() {
      settings.accuracy = Number.parseInt(this.value);
      const accuracyValue = document.getElementById("accuracy-value");
      if (accuracyValue) {
        accuracyValue.textContent = this.value;
      }
      saveSettings();
    });
  }

  if (elements.randomEnabled) {
    elements.randomEnabled.addEventListener("change", function() {
      settings.randomEnabled = this.checked;
      saveSettings();
      showStatus(settings.randomEnabled ? 'Random location enabled' : 'Random location disabled', 'success');
    });
  }

  if (elements.randomRadius) {
    elements.randomRadius.addEventListener("input", function() {
      settings.randomRadius = Number.parseInt(this.value);
      const radiusValue = document.getElementById("random-radius-value");
      if (radiusValue) {
        radiusValue.textContent = this.value;
      }
      saveSettings();
    });
  }

  if (elements.logRequests) {
    elements.logRequests.addEventListener("change", function() {
      settings.logRequests = this.checked;
      saveSettings();
      showStatus(settings.logRequests ? 'Request logging enabled' : 'Request logging disabled', 'success');
    });
  }

  if (elements.saveProfile) {
    elements.saveProfile.addEventListener("click", function() {
      const profileNameInput = document.getElementById("profile-name");
      if (!profileNameInput) return;
      
      const name = profileNameInput.value.trim();
      if (name) {
        profiles.push({
          name,
          latitude: settings.latitude,
          longitude: settings.longitude,
        });
        chrome.storage.local.set({ geoProfiles: profiles }, () => {
          profileNameInput.value = "";
          renderProfiles();
        });
      }
    });
  }

  if (elements.saveApiKey) {
    elements.saveApiKey.addEventListener("click", saveApiKey);
  }

  // Initialize tabs if they exist
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  if (tabButtons.length > 0 && tabContents.length > 0) {
    function switchTab(tabName) {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabContents.forEach(content => content.classList.remove("active"));

      const selectedButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
      const selectedContent = document.getElementById(tabName);

      if (selectedButton && selectedContent) {
        selectedButton.classList.add("active");
        selectedContent.classList.add("active");
      }
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabName = button.getAttribute("data-tab");
        if (tabName) {
          switchTab(tabName);
        }
      });
    });

    // Initialize with the first tab
    const defaultTab = tabButtons[0]?.getAttribute("data-tab");
    if (defaultTab) {
      switchTab(defaultTab);
    }
  }
});

// Make initMap global so it can be called by the Google Maps script
window.initMap = initMap

// Add function to apply UI settings
function applyUISettings() {
  const root = document.documentElement;
  const ui = settings.ui;
  
  // Set CSS variables
  root.style.setProperty('--base-font-size', `${ui.fontSize}px`);
  root.style.setProperty('--base-spacing', `${ui.spacing}px`);
  root.style.setProperty('--modal-width', ui.modalWidth);
  
  // Apply font sizes
  root.style.setProperty('--heading-font-size', `${ui.fontSize * 1.2}px`);
  root.style.setProperty('--text-font-size', `${ui.fontSize}px`);
  root.style.setProperty('--small-font-size', `${ui.fontSize * 0.85}px`);
  
  // Apply spacing
  root.style.setProperty('--spacing-sm', `${ui.spacing * 0.5}px`);
  root.style.setProperty('--spacing-md', `${ui.spacing}px`);
  root.style.setProperty('--spacing-lg', `${ui.spacing * 1.5}px`);
  
  // Apply button styles
  const buttons = document.querySelectorAll('.button-group');
  buttons.forEach(group => {
    group.style.display = 'flex';
    group.style.flexDirection = 'column';
    group.style.gap = `${ui.spacing * 0.5}px`;
    
    const btns = group.querySelectorAll('button');
    btns.forEach(btn => {
      btn.style.width = ui.buttonWidth;
      btn.style.margin = '0';
    });
  });
  
  // Apply compact mode if enabled
  if (ui.compact) {
    root.classList.add('compact-mode');
  } else {
    root.classList.remove('compact-mode');
  }
}

// Add function to ensure we always have a location name
async function ensureLocationName(lat, lng) {
  try {
    // First try to get a proper location name
    const locationInfo = await getLocationName(lat, lng);
    if (locationInfo?.city) {
      return locationInfo.city + (locationInfo.country ? `, ${locationInfo.country}` : '');
    }

    // If no city found, try reverse geocoding with more detail
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GeoLocationManager/1.0'
        }
      }
    );

    const data = await response.json();

    // Try to find the most specific named location
    const address = data.address;
    const locationName = address?.suburb ||
      address?.neighbourhood ||
      address?.quarter ||
      address?.city_district ||
      address?.city ||
      address?.town ||
      address?.village ||
      address?.municipality ||
      address?.county ||
      address?.state ||
      'Unknown Location';

    const country = address?.country;
    return country ? `${locationName}, ${country}` : locationName;
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Unknown Location';
  }
}

// Add browser geolocation monitoring
function setupGeolocationMonitoring() {
  const originalGeolocation = navigator.geolocation.getCurrentPosition;
  const originalWatchPosition = navigator.geolocation.watchPosition;

  // Override getCurrentPosition
  navigator.geolocation.getCurrentPosition = function (success, error, options) {
    if (settings.enabled) {
      success({
        coords: {
          latitude: settings.latitude,
          longitude: settings.longitude,
          accuracy: settings.accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      });

      // Log the request if enabled
      if (settings.logRequests) {
        addLog('getCurrentPosition called - Spoofed location returned');
      }
    } else {
      originalGeolocation.call(navigator.geolocation, success, error, options);
    }
  };

  // Override watchPosition
  navigator.geolocation.watchPosition = function (success, error, options) {
    if (settings.enabled) {
      const watchId = setInterval(() => {
        let coords = {
          latitude: settings.latitude,
          longitude: settings.longitude,
          accuracy: settings.accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        };

        // Add random variation if enabled
        if (settings.randomEnabled) {
          const radius = settings.randomRadius / 111300; // Convert meters to degrees
          const u = Math.random();
          const v = Math.random();
          const w = radius * Math.sqrt(u);
          const t = 2 * Math.PI * v;
          const x = w * Math.cos(t);
          const y = w * Math.sin(t);

          coords.latitude += y;
          coords.longitude += x / Math.cos(settings.latitude * Math.PI / 180);
        }

        success({
          coords: coords,
          timestamp: Date.now()
        });

        if (settings.logRequests) {
          addLog('watchPosition updated - Spoofed location returned');
        }
      }, 1000);

      return watchId;
    } else {
      return originalWatchPosition.call(navigator.geolocation, success, error, options);
    }
  };
}

// Add reverse geocoding for browser location test
async function getLocationName(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GeoLocationManager/1.0'
        }
      }
    );
    const data = await response.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.municipality,
      country: data.address?.country
    };
  } catch (error) {
    console.error('Error getting location name:', error);
    return null;
  }
}

