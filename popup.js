import cities from './cities.js';

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

// Function to set location based on input
async function setLocationFromInput() {
  const input = document.getElementById("location-input").value.trim()

  // First check if we have a selected option from the datalist
  const datalist = document.getElementById("city-suggestions")
  const option = Array.from(datalist.options).find(opt => opt.value === input)

  if (option) {
    // Use coordinates from the selected option
    settings.latitude = parseFloat(option.getAttribute('data-lat'))
    settings.longitude = parseFloat(option.getAttribute('data-lng'))
    updateUIElements()
    return
  }

  // If no exact match, try to search for the location
  try {
    const suggestions = await searchDutchAddresses(input)
    if (suggestions.length > 0) {
      // Use the first suggestion
      const firstResult = suggestions[0]
      settings.latitude = parseFloat(firstResult.lat)
      settings.longitude = parseFloat(firstResult.lng)
      document.getElementById("location-input").value = firstResult.display
      updateUIElements()
      return
    }
  } catch (error) {
    console.error('Error searching location:', error)
  }

  // Finally, try parsing as coordinates
  const coords = input.split(",").map(coord => Number.parseFloat(coord.trim()))
  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
    settings.latitude = coords[0]
    settings.longitude = coords[1]
    updateUIElements()
  } else {
    alert("Please enter a valid city name or coordinates (latitude, longitude)")
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

function getCurrentLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        settings.latitude = position.coords.latitude
        settings.longitude = position.coords.longitude
        settings.accuracy = Math.round(position.coords.accuracy)

        // If we have Google Maps API key, try to get the address
        if (googleMapsApiKey && google.maps.Geocoder) {
          const geocoder = new google.maps.Geocoder()
          const latlng = { lat: settings.latitude, lng: settings.longitude }

          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK" && results[0]) {
              document.getElementById("location-input").value = results[0].formatted_address
            }
          })
        }

        updateUIElements()
      },
      (error) => {
        console.error("Error getting location:", error)
        alert("Could not get current location. Error: " + error.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  } else {
    alert("Geolocation is not supported by this browser.")
  }
}

// Function to search Dutch addresses
async function searchDutchAddresses(query) {
  if (query.length < 2) return [];

  // Check cache first
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }

  try {
    const params = new URLSearchParams({
      q: query,
      fq: 'type:gemeente OR type:woonplaats OR type:weg',  // Filter for municipalities, cities, and streets
      rows: 10
    });

    const response = await fetch(`${PDK_API.SUGGEST}?${params}`);
    const data = await response.json();

    const suggestions = data.response.docs.map(doc => ({
      id: doc.id,
      display: doc.weergavenaam,
      type: doc.type,
      lat: doc.centroide_ll.split('(')[1].split(' ')[1],
      lng: doc.centroide_ll.split('(')[1].split(' ')[0]
    }));

    // Cache the results
    searchCache.set(query, suggestions);
    return suggestions;
  } catch (error) {
    console.error('Error fetching Dutch addresses:', error);
    return [];
  }
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

// Update setupCitySearch function to use the PDK API
function setupCitySearch() {
  const locationInput = document.getElementById("location-input")
  const datalist = document.getElementById("city-suggestions")
  let debounceTimer

  // Clear existing suggestions
  datalist.innerHTML = ""

  // Handle input changes with debounce
  locationInput.addEventListener("input", (e) => {
    const value = e.target.value.trim()

    // Clear previous timer
    clearTimeout(debounceTimer)

    // Set new timer
    debounceTimer = setTimeout(async () => {
      if (value.length >= 2) {
        // Clear existing suggestions
        datalist.innerHTML = ""

        // Get new suggestions
        const suggestions = await searchDutchAddresses(value)

        suggestions.forEach(suggestion => {
          const option = document.createElement("option")
          option.value = suggestion.display
          option.setAttribute('data-id', suggestion.id)
          option.setAttribute('data-lat', suggestion.lat)
          option.setAttribute('data-lng', suggestion.lng)
          datalist.appendChild(option)
        })
      }
    }, 300)
  })

  // Handle Enter key
  locationInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setLocationFromInput()
    }
  })

  // Handle selection from datalist
  locationInput.addEventListener("change", async (e) => {
    setLocationFromInput()
  })
}

// Initialize the popup
document.addEventListener("DOMContentLoaded", () => {
  loadSettings()
  setupCitySearch()

  // Event listeners
  document.getElementById("get-current-location").addEventListener("click", getCurrentLocation)
  document.getElementById("set-location").addEventListener("click", setLocationFromInput)
  document.getElementById("enabled").addEventListener("change", function () {
    settings.enabled = this.checked
    saveSettings()
  })
  document.getElementById("latitude").addEventListener("change", function () {
    settings.latitude = Number.parseFloat(this.value)
    updateUI()
    saveSettings()
  })
  document.getElementById("longitude").addEventListener("change", function () {
    settings.longitude = Number.parseFloat(this.value)
    updateUI()
    saveSettings()
  })
  document.getElementById("accuracy").addEventListener("input", function () {
    settings.accuracy = Number.parseInt(this.value)
    document.getElementById("accuracy-value").textContent = this.value
    saveSettings()
  })
  document.getElementById("random-enabled").addEventListener("change", function () {
    settings.randomEnabled = this.checked
    saveSettings()
  })
  document.getElementById("random-radius").addEventListener("input", function () {
    settings.randomRadius = Number.parseInt(this.value)
    document.getElementById("random-radius-value").textContent = this.value
    saveSettings()
  })
  document.getElementById("log-requests").addEventListener("change", function () {
    settings.logRequests = this.checked
    saveSettings()
  })
  document.getElementById("save-profile").addEventListener("click", function () {
    const name = document.getElementById("profile-name").value.trim()
    if (name) {
      profiles.push({
        name,
        latitude: settings.latitude,
        longitude: settings.longitude,
      })
      chrome.storage.local.set({ geoProfiles: profiles }, () => {
        document.getElementById("profile-name").value = ""
        renderProfiles()
      })
    }
  })

  // New event listener for saving API key
  document.getElementById("save-api-key").addEventListener("click", saveApiKey)

  // Tab switching logic
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.tab

      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      button.classList.add("active")
      document.getElementById(tabName).classList.add("active")
    })
  })

  // Add input event for location-input to provide real-time suggestions
  const locationInput = document.getElementById("location-input")
  let autocomplete

  if (googleMapsApiKey) {
    // Initialize Google Places Autocomplete
    autocomplete = new google.maps.places.Autocomplete(locationInput, {
      types: ['geocode']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.geometry) {
        settings.latitude = place.geometry.location.lat()
        settings.longitude = place.geometry.location.lng()
        updateUIElements()
      }
    })
  }
})

// Make initMap global so it can be called by the Google Maps script
window.initMap = initMap

