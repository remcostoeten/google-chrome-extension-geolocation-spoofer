const cities = [];

let settings = {
  enabled: false,
  latitude: null,
  longitude: null,
  lastLocationName: "",
  showHints: true,
};

let profiles = [];
let logs = [];

const PDK_API = {
  SUGGEST: "https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest",
  LOOKUP: "https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup",
};

let searchCache = new Map();
let isInitialized = false;

const elements = {
  locationToggle: document.getElementById("locationToggle"),
  locationInput: document.getElementById("locationInput"),
  latitudeInput: document.getElementById("latitudeInput"),
  longitudeInput: document.getElementById("longitudeInput"),
  setLocationBtn: document.getElementById("setLocationBtn"),
  getCurrentLocationBtn: document.getElementById("getCurrentLocationBtn"),
  clearLocationBtn: document.getElementById("clearLocationBtn"),
  statusText: document.getElementById("statusText"),
  enabledStatus: document.getElementById("enabledStatus"),
  profilesList: document.getElementById("profilesList"),
  profileNameInput: document.getElementById("profileNameInput"),
  saveProfileBtn: document.getElementById("saveProfileBtn"),
  enabledCheckbox: document.getElementById("enabled"),
  latitude: document.getElementById("latitude"),
  longitude: document.getElementById("longitude"),
  saveProfile: document.getElementById("save-profile"),
  exportBtn: document.getElementById("export-profiles"),
  importBtn: document.getElementById("import-profiles"),
  importFile: document.getElementById("import-file"),
  getCurrentLocationBtn: document.getElementById("get-current-location"),
  setLocationBtn: document.getElementById("set-location"),
  showHints: document.getElementById("show-hints"),
};

const renderProfiles = async () => {
  const profilesList = document.getElementById("profiles-list");
  if (!profilesList) return;

  profilesList.innerHTML = "";
  
  for (const [index, profile] of profiles.entries()) {
    const profileItem = document.createElement("div");
    profileItem.className = "profile-item";
    
    const profileInfo = document.createElement("div");
    profileInfo.className = "profile-info";
    
    try {
      // Get location name and country code
      const locationName = await ensureLocationName(profile.latitude, profile.longitude);
      const countryCode = getCountryCodeFromAddress(locationName);
      const flag = countryCode ? getCountryFlag(countryCode) : '';
      
      // Create flag span if we have a flag
      if (flag) {
        const flagSpan = document.createElement("span");
        flagSpan.textContent = flag;
        flagSpan.style.marginRight = "8px";
        flagSpan.style.fontSize = "1.2em";
        profileInfo.appendChild(flagSpan);
      }
      
      // Add location name
      const nameSpan = document.createElement("span");
      nameSpan.textContent = profile.name;
      profileInfo.appendChild(nameSpan);
    } catch (error) {
      // Fallback to just the profile name if there's an error
      profileInfo.textContent = profile.name;
    }
    
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "profile-buttons";
    
    const loadButton = document.createElement("button");
    loadButton.textContent = "Load";
    loadButton.onclick = () => loadProfile(index);
    
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => deleteProfile(index);
    
    buttonsContainer.appendChild(loadButton);
    buttonsContainer.appendChild(deleteButton);
    
    profileItem.appendChild(profileInfo);
    profileItem.appendChild(buttonsContainer);
    profilesList.appendChild(profileItem);
  }
};

const updateUIElements = () => {
  if (elements.enabledCheckbox) {
    elements.enabledCheckbox.checked = settings.enabled;
  }
  if (elements.latitudeInput) {
    elements.latitudeInput.value = settings.latitude
      ? settings.latitude.toFixed(6)
      : "";
  }

  if (elements.longitudeInput) {
    elements.longitudeInput.value = settings.longitude
      ? settings.longitude.toFixed(6)
      : "";
  }

  if (elements.locationInput) {
    if (settings.lastLocationName) {
      elements.locationInput.value = settings.lastLocationName;
    } else if (settings.latitude !== null && settings.longitude !== null) {
      ensureLocationName(settings.latitude, settings.longitude)
        .then((locationName) => {
          const countryCode = getCountryCodeFromAddress(locationName);
          const flag = countryCode ? getCountryFlag(countryCode) : "";
          elements.locationInput.value = flag
            ? `${flag} ${locationName}`
            : locationName;
          settings.lastLocationName = elements.locationInput.value;
          saveSettings();
        })
        .catch(() => {
          elements.locationInput.value = `${settings.latitude.toFixed(6)}, ${settings.longitude.toFixed(6)}`;
        });
    }
  }
};

const loadSettings = () => {
  chrome.storage.local.get(
    ["geoSettings", "geoProfiles", "geoLogs"],
    (result) => {
      if (result.geoSettings) {
        settings = { ...settings, ...result.geoSettings };
      }

      if (result.geoProfiles) {
        profiles = result.geoProfiles;
        renderProfiles();
      }

      updateUIElements();
    },
  );
};

const saveApiKey = () => {
  const apiKey = document.getElementById("api-key").value.trim();
  chrome.storage.local.set({ googleMapsApiKey: apiKey }, () => {
    googleMapsApiKey = apiKey;
    showStatus(
      "API Key saved. Please refresh the extension to apply changes.",
      "success",
    );
  });
};

const getCountryFlag = (countryCode) => {
  if (!countryCode) return "";
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join("");
};

const getCountryCodeFromAddress = (address) => {
  if (!address) return "";
  const components = address.split(",");
  const lastComponent = components[components.length - 1].trim();
  if (lastComponent.length === 2) {
    return lastComponent;
  }
  const countryMapping = {
    Netherlands: "NL",
    "United States": "US",
    "United Kingdom": "GB",
    Germany: "DE",
    France: "FR",
    Spain: "ES",
    Italy: "IT",
  };
  return countryMapping[lastComponent] || "";
};

const setupCitySearch = () => {
  const locationInput = document.getElementById("location-input");
  if (!locationInput) return;

  const wrapper = locationInput.parentElement;
  if (!wrapper) return;

  const suggestionsContainer = document.createElement("div");
  suggestionsContainer.className = "suggestions-container";
  suggestionsContainer.style.position = "absolute";
  suggestionsContainer.style.width = "100%";
  suggestionsContainer.style.maxHeight = "200px";
  suggestionsContainer.style.overflowY = "auto";
  suggestionsContainer.style.backgroundColor = "var(--surface)";
  suggestionsContainer.style.border = "1px solid var(--border)";
  suggestionsContainer.style.borderRadius = "var(--radius)";
  suggestionsContainer.style.marginTop = "4px";
  suggestionsContainer.style.display = "none";
  suggestionsContainer.style.zIndex = "1000";
  wrapper.appendChild(suggestionsContainer);

  let debounceTimer;
  let selectedIndex = -1;

  locationInput.addEventListener("input", async (e) => {
    const query = e.target.value.trim();

    suggestionsContainer.innerHTML = "";
    suggestionsContainer.style.display = "none";
    selectedIndex = -1;

    if (query.length < 2) return;

    wrapper.classList.add("loading");

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const suggestions = await searchDutchAddresses(query);

        suggestionsContainer.innerHTML = "";

        if (suggestions.length === 0) {
          const noResults = document.createElement("div");
          noResults.className = "suggestion-item no-results";
          noResults.textContent = "No matching locations found";
          noResults.style.padding = "8px 12px";
          noResults.style.color = "var(--error)";
          noResults.style.fontSize = "0.85rem";
          suggestionsContainer.appendChild(noResults);
          suggestionsContainer.style.display = "block";
          return;
        }

        suggestions.forEach((suggestion, index) => {
          const item = document.createElement("div");
          item.className = "suggestion-item";

          const flag = suggestion.country
            ? getCountryFlag(suggestion.country)
            : "";

          item.style.display = "flex";
          item.style.alignItems = "center";
          item.style.gap = "8px";
          item.style.padding = "8px 12px";
          item.style.cursor = "pointer";
          item.style.fontSize = "0.85rem";

          if (flag) {
            const flagSpan = document.createElement("span");
            flagSpan.textContent = flag;
            flagSpan.style.fontSize = "1.2em";
            flagSpan.style.marginRight = "8px";
            item.appendChild(flagSpan);
          }

          const textSpan = document.createElement("span");
          textSpan.textContent = suggestion.display;
          item.appendChild(textSpan);

          item.addEventListener("mouseover", () => {
            selectedIndex = index;
            updateSelectedSuggestion();
          });

          item.addEventListener("click", () => {
            selectLocation(suggestion);
          });

          suggestionsContainer.appendChild(item);
        });

        suggestionsContainer.style.display = "block";
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        showStatus("Error fetching location suggestions", "error");
      } finally {
        wrapper.classList.remove("loading");
      }
    }, 300);
  });

  const updateSelectedSuggestion = () => {
    const items = suggestionsContainer.querySelectorAll(".suggestion-item");
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.style.backgroundColor = "var(--surface-hover)";
      } else {
        item.style.backgroundColor = "";
      }
    });
  };

  const selectLocation = (suggestion) => {
    const flag = suggestion.country ? getCountryFlag(suggestion.country) : "";
    const displayString = flag
      ? `${flag} ${suggestion.display}`
      : suggestion.display;

    locationInput.value = displayString;
    settings.latitude = suggestion.lat;
    settings.longitude = suggestion.lng;
    settings.lastLocationName = displayString;
    suggestionsContainer.style.display = "none";

    document.getElementById("latitude").value = settings.latitude.toFixed(6);
    document.getElementById("longitude").value = settings.longitude.toFixed(6);

    saveSettings();
    showStatus("Location updated", "success");
  };

  locationInput.addEventListener("keydown", (e) => {
    const items = suggestionsContainer.querySelectorAll(
      ".suggestion-item:not(.no-results)",
    );
    if (!items.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelectedSuggestion();
        items[selectedIndex].scrollIntoView({ block: "nearest" });
        break;
      case "ArrowUp":
        e.preventDefault();
        selectedIndex =
          selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        updateSelectedSuggestion();
        items[selectedIndex].scrollIntoView({ block: "nearest" });
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const suggestions = Array.from(
            suggestionsContainer.querySelectorAll(
              ".suggestion-item:not(.no-results)",
            ),
          );
          const suggestion = suggestions[selectedIndex];
          if (suggestion) {
            suggestion.click();
          }
        }
        break;
      case "Escape":
        suggestionsContainer.style.display = "none";
        selectedIndex = -1;
        break;
    }
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      suggestionsContainer.style.display = "none";
      selectedIndex = -1;
    }
  });
};

const searchDutchAddresses = async (query) => {
  if (query.length < 2) return [];

  try {
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "GeoLocationManager/1.0",
        },
      },
    );

    if (!nominatimResponse.ok) {
      throw new Error("Nominatim search failed");
    }

    const nominatimData = await nominatimResponse.json();

    if (nominatimData.length > 0) {
      return nominatimData.map((place) => ({
        id: place.place_id,
        display: place.display_name.split(",")[0],
        type: place.type,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        country: place.address?.country_code?.toUpperCase() || "",
      }));
    }

    const pdkParams = new URLSearchParams({
      q: query,
      rows: 10,
    });

    const pdkResponse = await fetch(`${PDK_API.SUGGEST}?${pdkParams}`);
    if (!pdkResponse.ok) {
      throw new Error(`PDK API error! status: ${pdkResponse.status}`);
    }

    const pdkData = await pdkResponse.json();

    if (pdkData.response?.docs) {
      return pdkData.response.docs
        .filter((doc) => doc.centroide_ll)
        .map((doc) => {
          const coords = doc.centroide_ll.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          return {
            id: doc.id,
            display: doc.weergavenaam,
            type: doc.type,
            lat: coords ? parseFloat(coords[2]) : null,
            lng: coords ? parseFloat(coords[1]) : null,
            country: "NL", // PDK API is Netherlands-specific
          };
        })
        .filter((item) => item.lat !== null && item.lng !== null);
    }

    return [];
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
};

const setLocationFromInput = async () => {
  const input = document.getElementById("location-input").value.trim();
  const setLocationBtn = document.getElementById("set-location");

  if (!setLocationBtn) {
    console.error("Set location button not found");
    return;
  }

  try {
    // First check if this is a coordinate pair
    const coords = input.split(",").map((coord) => parseFloat(coord.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      if (!validateCoordinates(coords[0], coords[1])) {
        throw new Error("Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.");
      }
      settings.latitude = coords[0];
      settings.longitude = coords[1];
    } else {
      // If not coordinates, try to find the location by name
      const suggestions = await searchDutchAddresses(input);
      const exactMatch = suggestions.find(s => s.display.toLowerCase() === input.toLowerCase());
      
      if (exactMatch) {
        settings.latitude = exactMatch.lat;
        settings.longitude = exactMatch.lng;
      } else if (suggestions.length > 0) {
        // Use the first suggestion if no exact match
        settings.latitude = suggestions[0].lat;
        settings.longitude = suggestions[0].lng;
      } else {
        throw new Error("Location not found. Please try a different name or use coordinates.");
      }
    }

    // Get location name and add flag
    const locationName = await ensureLocationName(settings.latitude, settings.longitude);
    const countryCode = getCountryCodeFromAddress(locationName);
    const flag = countryCode ? getCountryFlag(countryCode) : "";
    const displayString = flag ? `${flag} ${locationName}` : locationName;
    
    const locationInput = document.getElementById("location-input");
    locationInput.value = displayString;
    settings.lastLocationName = displayString;
    
    // Update button state to show saved state
    setLocationBtn.innerHTML = '✓ Saved';
    setLocationBtn.classList.add('saved');
    setLocationBtn.disabled = true;
    
    // Update UI and save settings
    document.getElementById("latitude").value = settings.latitude.toFixed(6);
    document.getElementById("longitude").value = settings.longitude.toFixed(6);
    updateUIElements();
    saveSettings();
    
    showStatus("Location saved successfully", "success");

    showHint(
      "You can save this location here for quick access later",
      "profiles",
    );
  } catch (error) {
    console.error("Error setting location:", error);
    showStatus(error.message, "error");
  }
};

const loadProfile = (index) => {
  const profile = profiles[index];
  settings.latitude = profile.latitude;
  settings.longitude = profile.longitude;
  updateUIElements();
  saveSettings();
};

const deleteProfile = (index) => {
  profiles.splice(index, 1);
  chrome.storage.local.set({ geoProfiles: profiles }, () => {
    renderProfiles();
  });
};

const saveSettings = () => {
  const locationInput = document.getElementById("location-input");
  if (locationInput) {
    settings.lastLocationName = locationInput.value;
  }

  chrome.storage.local.set({ geoSettings: settings }, () => {
    console.log("Settings saved", settings);
  });
};

const getCurrentLocation = async () => {
  const locationInput = document.getElementById("location-input");
  if (!locationInput) {
    showStatus("Location input element not found", "error");
    return;
  }

  const wrapper = locationInput.parentElement;
  if (!wrapper) {
    showStatus("Location input wrapper not found", "error");
    return;
  }

  try {
    if (!("geolocation" in navigator)) {
      throw new Error("Geolocation is not supported by this browser.");
    }

    wrapper.classList.add("loading");

    const permission = await navigator.permissions.query({
      name: "geolocation",
    });

    if (permission.state === "denied") {
      throw new Error(
        "Location permission denied. Please enable location access in your browser settings.",
      );
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    settings.latitude = position.coords.latitude;
    settings.longitude = position.coords.longitude;

    // Get location name and ensure flag is displayed
    const locationName = await ensureLocationName(settings.latitude, settings.longitude);
    const countryCode = getCountryCodeFromAddress(locationName);
    const flag = countryCode ? getCountryFlag(countryCode) : "";
    const displayString = flag ? `${flag} ${locationName}` : locationName;
    
    // Update the location input and settings
    locationInput.value = displayString;
    settings.lastLocationName = displayString;

    // Update latitude and longitude inputs
    document.getElementById("latitude").value = settings.latitude.toFixed(6);
    document.getElementById("longitude").value = settings.longitude.toFixed(6);

    saveSettings();
    showStatus("Location successfully updated", "success");
  } catch (error) {
    console.error("Error getting location:", error);
    showStatus(error.message || "Could not get current location", "error");
  } finally {
    wrapper.classList.remove("loading");
  }
};

const showStatus = (message, type = "error") => {
  // Create toast container if it doesn't exist
  const toastContainer = document.querySelector(".toast-container") || (() => {
    const container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
  })();

  // Create and style the toast
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);

  // Animate the toast in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Remove the toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

const getLocationDetails = async (id) => {
  try {
    const params = new URLSearchParams({
      id: id,
    });

    const response = await fetch(`${PDK_API.LOOKUP}?${params}`);
    const data = await response.json();

    const doc = data.response.docs[0];
    return {
      name: doc.weergavenaam,
      type: doc.type,
      lat: doc.centroide_ll.split("(")[1].split(" ")[1],
      lng: doc.centroide_ll.split("(")[1].split(" ")[0],
    };
  } catch (error) {
    console.error("Error fetching location details:", error);
    return null;
  }
};

const showHint = (message, targetTab = null) => {
  if (!settings.showHints) return;

  const toastContainer =
    document.querySelector(".toast-container") ||
    (() => {
      const container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
      return container;
    })();

  const toast = document.createElement("div");
  toast.className = "toast hint";

  if (targetTab) {
    const text = document.createElement("span");
    text.textContent = message.split("here")[0];

    const link = document.createElement("span");
    link.className = "hint-link";
    link.textContent = "here";
    link.onclick = () => {
      const tabBtn = document.querySelector(
        `.tab-btn[data-tab="${targetTab}"]`,
      );
      if (tabBtn) tabBtn.click();
    };

    const textEnd = document.createElement("span");
    textEnd.textContent = message.split("here")[1];

    toast.appendChild(text);
    toast.appendChild(link);
    toast.appendChild(textEnd);
  } else {
    toast.textContent = message;
  }

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
};

const style = document.createElement("style");
style.textContent = `
  .toast.hint {
    background-color: var(--surface);
    color: var(--text);
    padding: 12px 16px;
    border-radius: var(--radius);
    margin-top: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    font-size: 0.85rem;
    border: 1px solid var(--border);
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.3s ease;
  }

  .hint-link {
    color: var(--primary);
    text-decoration: underline;
    cursor: pointer;
    margin: 0 4px;
  }

  .hint-link:hover {
    opacity: 0.8;
  }
`;
document.head.appendChild(style);

// Update button and toast styles
const buttonStyle = document.createElement("style");
buttonStyle.textContent = `
  button.saved {
    background-color: var(--success) !important;
    color: var(--surface) !important;
    border-color: var(--success) !important;
    cursor: default !important;
    transition: all 0.3s ease !important;
  }

  .toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  }

  .toast {
    min-width: 250px;
    max-width: 400px;
    font-size: 14px;
    padding: 12px 16px;
    border-radius: 6px;
    background-color: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: auto;
  }

  .toast.success {
    border-left: 4px solid var(--success);
  }

  .toast.error {
    border-left: 4px solid var(--error);
  }

  .toast.hint {
    border-left: 4px solid var(--primary);
    background-color: var(--surface);
    color: var(--text);
  }
`;
document.head.appendChild(buttonStyle);

const spinnerStyle = document.createElement("style");
spinnerStyle.textContent = `
  .loading::after {
    content: "";
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    border: 2px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spinner 0.6s linear infinite;
  }

  @keyframes spinner {
    to {
      transform: translateY(-50%) rotate(360deg);
    }
  }

  .loading {
    position: relative;
  }

  .loading input {
    padding-right: 32px;
  }
`;
document.head.appendChild(spinnerStyle);

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupCitySearch();

  if (elements.exportBtn) {
    elements.exportBtn.addEventListener("click", exportProfiles);
  }

  if (elements.importBtn) {
    elements.importBtn.addEventListener("click", importProfiles);
  }

  if (elements.importFile) {
    elements.importFile.addEventListener("change", handleFileSelect);
  }

  if (elements.getCurrentLocationBtn) {
    elements.getCurrentLocationBtn.addEventListener(
      "click",
      getCurrentLocation,
    );
  }

  if (elements.setLocationBtn) {
    elements.setLocationBtn.addEventListener("click", setLocationFromInput);
  }

  if (elements.enabledCheckbox) {
    elements.enabledCheckbox.addEventListener("change", function () {
      settings.enabled = this.checked;
      saveSettings();
      showStatus(
        settings.enabled
          ? "Location override enabled"
          : "Location override disabled",
        "success",
      );
    });
  }

  if (elements.latitude) {
    elements.latitude.addEventListener("change", function () {
      const lat = Number.parseFloat(this.value);
      if (validateCoordinates(lat, settings.longitude)) {
        settings.latitude = lat;
        updateUIElements();
        saveSettings();
      } else {
        this.value = settings.latitude;
        showStatus("Invalid latitude value", "error");
      }
    });
  }

  if (elements.longitude) {
    elements.longitude.addEventListener("change", function () {
      const lng = Number.parseFloat(this.value);
      if (validateCoordinates(settings.latitude, lng)) {
        settings.longitude = lng;
        updateUIElements();
        saveSettings();
      } else {
        this.value = settings.longitude;
        showStatus("Invalid longitude value", "error");
      }
    });
  }

  if (elements.saveProfile) {
    elements.saveProfile.addEventListener("click", function () {
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

  if (elements.showHints) {
    elements.showHints.checked = settings.showHints;
    elements.showHints.addEventListener("change", function () {
      settings.showHints = this.checked;
      saveSettings();
      showStatus(
        settings.showHints ? "Hints enabled" : "Hints disabled",
        "success",
      );
    });
  }

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  if (tabButtons.length > 0 && tabContents.length > 0) {
    function switchTab(tabName) {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      const selectedButton = document.querySelector(
        `.tab-btn[data-tab="${tabName}"]`,
      );
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

    const defaultTab = tabButtons[0]?.getAttribute("data-tab");
    if (defaultTab) {
      switchTab(defaultTab);
    }
  }

  const locationInput = document.getElementById("location-input");
  if (locationInput) {
    locationInput.addEventListener("input", () => {
      const setLocationBtn = document.getElementById("set-location");
      if (setLocationBtn) {
        setLocationBtn.innerHTML = 'Set Location';
        setLocationBtn.classList.remove('saved');
        setLocationBtn.disabled = false;
      }
    });
  }
});

async function ensureLocationName(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "GeoLocationManager/1.0",
        },
      },
    );
    const data = await response.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      "Unknown Location"
    );
  } catch (error) {
    console.error("Error getting location name:", error);
    return "Unknown Location";
  }
}

function exportProfiles() {
  const exportData = {
    profiles: profiles,
    exportDate: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `geolocation-profiles-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showStatus("Profiles exported successfully", "success");
}

function importProfiles() {
  const fileInput = document.getElementById("import-file");
  fileInput.click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      if (!importedData.profiles || !Array.isArray(importedData.profiles)) {
        throw new Error("Invalid profile data format");
      }

      const newProfiles = [...profiles];
      importedData.profiles.forEach((profile) => {
        if (
          profile.name &&
          typeof profile.latitude === "number" &&
          typeof profile.longitude === "number"
        ) {
          const existingIndex = newProfiles.findIndex(
            (p) => p.name === profile.name,
          );
          if (existingIndex >= 0) {
            newProfiles[existingIndex] = profile;
          } else {
            newProfiles.push(profile);
          }
        }
      });

      profiles = newProfiles;
      chrome.storage.local.set({ geoProfiles: profiles }, () => {
        renderProfiles();
        showStatus("Profiles imported successfully", "success");
      });
    } catch (error) {
      console.error("Error importing profiles:", error);
      showStatus("Error importing profiles: Invalid file format", "error");
    }

    event.target.value = "";
  };

  reader.readAsText(file);
}

function validateCoordinates(latitude, longitude) {
  if (latitude < -90 || latitude > 90) {
    return false;
  }

  if (longitude < -180 || longitude > 180) {
    return false;
  }

  return true;
}
