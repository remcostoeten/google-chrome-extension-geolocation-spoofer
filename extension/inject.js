// This script is injected into the page context to override the geolocation API

(() => {
  // Store original geolocation methods
  const originalGeolocation = navigator.geolocation;
  const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
  const originalWatchPosition = navigator.geolocation.watchPosition;

  // Function to get settings from the extension
  function getSettings() {
    return new Promise((resolve) => {
      window.postMessage({ type: "getGeolocationSettings" }, "*");

      function handleMessage(event) {
        if (event.data.type === "geolocationSettings") {
          window.removeEventListener("message", handleMessage);
          resolve(event.data.settings);
        }
      }

      window.addEventListener("message", handleMessage);
    });
  }

  // Override getCurrentPosition
  navigator.geolocation.getCurrentPosition = async function (
    success,
    error,
    options,
  ) {
    try {
      const settings = await getSettings();

      if (settings && settings.enabled) {
        // Return spoofed location
        success({
          coords: {
            latitude: settings.latitude,
            longitude: settings.longitude,
            accuracy: settings.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      } else {
        // Use original geolocation if not enabled
        originalGetCurrentPosition.call(
          originalGeolocation,
          success,
          error,
          options,
        );
      }
    } catch (err) {
      // Fallback to original if something goes wrong
      originalGetCurrentPosition.call(
        originalGeolocation,
        success,
        error,
        options,
      );
    }
  };

  // Override watchPosition
  navigator.geolocation.watchPosition = async function (
    success,
    error,
    options,
  ) {
    try {
      const settings = await getSettings();

      if (settings && settings.enabled) {
        // Return spoofed location
        const watchId = setInterval(() => {
          success({
            coords: {
              latitude: settings.latitude,
              longitude: settings.longitude,
              accuracy: settings.accuracy,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          });
        }, 1000);

        // Return watch ID for clearWatch
        return watchId;
      } else {
        // Use original geolocation if not enabled
        return originalWatchPosition.call(
          originalGeolocation,
          success,
          error,
          options,
        );
      }
    } catch (err) {
      // Fallback to original if something goes wrong
      return originalWatchPosition.call(
        originalGeolocation,
        success,
        error,
        options,
      );
    }
  };

  // Keep original clearWatch method
  navigator.geolocation.clearWatch = originalGeolocation.clearWatch;

  console.log("[Geolocation Manager] Geolocation API overridden");
})();
