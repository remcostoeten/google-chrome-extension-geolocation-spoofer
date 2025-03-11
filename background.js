// Store settings in memory for quick access
let settings = {
  enabled: false,
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 10,
  randomEnabled: false,
  randomRadius: 100,
  logRequests: false,
}

// Load settings from storage
chrome.storage.local.get("geoSettings", (result) => {
  if (result.geoSettings) {
    settings = result.geoSettings
  }
})

// Listen for settings updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "settingsUpdated") {
    settings = message.settings
  }
})

// Listen for tab updates to inject our script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url && tab.url.startsWith("http")) {
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        files: ["content.js"],
      })
      .catch((error) => console.error("Script injection failed:", error))
  }
})

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getSettings") {
    // Generate random coordinates if enabled
    let latitude = settings.latitude
    let longitude = settings.longitude

    if (settings.enabled && settings.randomEnabled) {
      // Convert radius from meters to degrees (approximate)
      const radiusLat = settings.randomRadius / 111000 // 1 degree ~ 111km
      const radiusLng = settings.randomRadius / (111000 * Math.cos((settings.latitude * Math.PI) / 180))

      // Generate random offset
      const randomLat = (Math.random() * 2 - 1) * radiusLat
      const randomLng = (Math.random() * 2 - 1) * radiusLng

      latitude = settings.latitude + randomLat
      longitude = settings.longitude + randomLng
    }

    // Log the request if enabled
    if (settings.enabled && settings.logRequests && sender.tab) {
      chrome.runtime.sendMessage({
        type: "logRequest",
        url: sender.tab.url,
      })
    }

    sendResponse({
      enabled: settings.enabled,
      latitude: latitude,
      longitude: longitude,
      accuracy: settings.accuracy,
    })
  }

  return true // Keep the message channel open for async response
})

