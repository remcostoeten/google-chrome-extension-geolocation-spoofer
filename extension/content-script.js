// Store the original geolocation methods
const originalGeolocation = {
  getCurrentPosition: navigator.geolocation.getCurrentPosition.bind(navigator.geolocation),
  watchPosition: navigator.geolocation.watchPosition.bind(navigator.geolocation),
};

// Cache for settings to reduce storage reads
let cachedSettings = null;

// Function to get the current override settings
async function getLocationOverride() {
  if (cachedSettings) {
    return cachedSettings;
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_LOCATION_OVERRIDE' }, (response) => {
      cachedSettings = response;
      resolve(response);
    });
  });
}

// Override the geolocation API
const overrideGeolocation = () => {
  // Override getCurrentPosition
  navigator.geolocation.getCurrentPosition = async function(success, error, options) {
    try {
      const override = await getLocationOverride();
      if (override.enabled && override.latitude !== null && override.longitude !== null) {
        // If override is enabled and has valid coordinates, return them immediately
        success({
          coords: {
            latitude: override.latitude,
            longitude: override.longitude,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        });
      } else {
        // If override is disabled or has invalid coordinates, use original geolocation
        originalGeolocation.getCurrentPosition(success, error, options);
      }
    } catch (e) {
      // If there's any error in the override, fall back to original geolocation
      originalGeolocation.getCurrentPosition(success, error, options);
    }
  };

  // Override watchPosition
  navigator.geolocation.watchPosition = async function(success, error, options) {
    try {
      const override = await getLocationOverride();
      if (override.enabled && override.latitude !== null && override.longitude !== null) {
        // If override is enabled, return the overridden position immediately
        success({
          coords: {
            latitude: override.latitude,
            longitude: override.longitude,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        });
        
        // Set up periodic updates for watchPosition
        const watchId = Math.floor(Math.random() * 1000000);
        const interval = setInterval(async () => {
          const currentSettings = await getLocationOverride();
          if (currentSettings.enabled) {
            success({
              coords: {
                latitude: currentSettings.latitude,
                longitude: currentSettings.longitude,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
              },
              timestamp: Date.now()
            });
          } else {
            clearInterval(interval);
            originalGeolocation.watchPosition(success, error, options);
          }
        }, 1000);

        return watchId;
      } else {
        // If override is disabled, use original watchPosition
        return originalGeolocation.watchPosition(success, error, options);
      }
    } catch (e) {
      // If there's any error in the override, fall back to original watchPosition
      return originalGeolocation.watchPosition(success, error, options);
    }
  };
};

// Initialize the override
overrideGeolocation();

// Listen for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    cachedSettings = message.settings;
    overrideGeolocation();
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.geoSettings) {
    cachedSettings = changes.geoSettings.newValue;
    overrideGeolocation();
  }
}); 