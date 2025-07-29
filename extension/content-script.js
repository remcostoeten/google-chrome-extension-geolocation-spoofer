// Store the original geolocation methods
const originalGeolocation = navigator.geolocation ? {
  getCurrentPosition: navigator.geolocation.getCurrentPosition.bind(navigator.geolocation),
  watchPosition: navigator.geolocation.watchPosition.bind(navigator.geolocation),
} : null;

// Cache for settings to reduce storage reads
let cachedSettings = null;
let isInitialized = false;

// Function to get the current override settings
function getLocationOverride() {
  return new Promise((resolve, reject) => {
    if (cachedSettings) {
      resolve(cachedSettings);
      return;
    }

    try {
      chrome.runtime.sendMessage({ type: 'GET_LOCATION_OVERRIDE' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Extension not available:', chrome.runtime.lastError.message);
          reject(new Error('Extension not available'));
          return;
        }
        cachedSettings = response || { enabled: false };
        resolve(cachedSettings);
      });
    } catch (error) {
      console.warn('Failed to communicate with extension:', error);
      reject(error);
    }
  });
}

// Override the geolocation API
function overrideGeolocation() {
  if (!navigator.geolocation || !originalGeolocation) {
    console.warn('Geolocation API not available');
    return;
  }

  // Override getCurrentPosition
  navigator.geolocation.getCurrentPosition = async function(success, error, options) {
    try {
      const override = await getLocationOverride();
      if (override && override.enabled && override.latitude !== null && override.longitude !== null) {
        console.log('Using extension location override:', override.latitude, override.longitude);
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
        return;
      }
    } catch (e) {
      console.warn('Extension override failed, using original geolocation:', e.message);
    }
    
    // If override is disabled, has invalid coordinates, or failed, use original geolocation
    if (originalGeolocation && originalGeolocation.getCurrentPosition) {
      originalGeolocation.getCurrentPosition(success, error, options);
    } else if (error) {
      error({ code: 2, message: 'Position unavailable' });
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
}

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