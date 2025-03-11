// This script is injected into the page context to override the geolocation API

;(() => {
  // Store original geolocation methods
  const originalGeolocation = navigator.geolocation
  const originalGetCurrentPosition = originalGeolocation.getCurrentPosition.bind(originalGeolocation)
  const originalWatchPosition = originalGeolocation.watchPosition.bind(originalGeolocation)

  // Settings object
  let settings = {
    enabled: false,
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
  }

  // Request settings from content script
  window.postMessage({ type: "getGeolocationSettings" }, "*")

  // Listen for settings updates
  window.addEventListener("message", (event) => {
    // Only accept messages from the same frame
    if (event.source !== window) return

    if (event.data.type === "geolocationSettings") {
      settings = event.data.settings
    }
  })

  // Create a fake position object
  function createFakePosition() {
    return {
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
    }
  }

  // Override getCurrentPosition
  navigator.geolocation.getCurrentPosition = (successCallback, errorCallback, options) => {
    if (settings.enabled) {
      // Use fake position
      setTimeout(() => {
        successCallback(createFakePosition())
      }, 100)
    } else {
      // Use original method
      originalGetCurrentPosition(successCallback, errorCallback, options)
    }
  }

  // Override watchPosition
  navigator.geolocation.watchPosition = (successCallback, errorCallback, options) => {
    if (settings.enabled) {
      // Use fake position
      const watchId = Math.floor(Math.random() * 100000)

      // Call success callback immediately
      setTimeout(() => {
        successCallback(createFakePosition())
      }, 100)

      // Return watch ID
      return watchId
    } else {
      // Use original method
      return originalWatchPosition(successCallback, errorCallback, options)
    }
  }

  // Keep the original clearWatch method
  navigator.geolocation.clearWatch = originalGeolocation.clearWatch.bind(originalGeolocation)

  console.log("[Geolocation Manager] Geolocation API overridden")
})()

