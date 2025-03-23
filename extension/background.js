// Store settings in memory for quick access
let settings = {
  enabled: false,
  latitude: null,
  longitude: null,
  accuracy: 10,
  randomEnabled: false,
  randomRadius: 100,
  logRequests: false,
  lastLocationName: null,
};

// Save settings to storage
const saveSettings = () => {
  chrome.storage.local.set({ geoSettings: settings }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving settings:', chrome.runtime.lastError);
    }
  });
};

// Load settings when extension starts
chrome.storage.local.get(['geoSettings'], (result) => {
  if (result.geoSettings) {
    settings = { ...settings, ...result.geoSettings };
    // Ensure the override is properly initialized with saved settings
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.startsWith('http')) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            settings: settings
          }).catch(() => {}); // Ignore errors for inactive tabs
        }
      });
    });
  }
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.geoSettings) {
    settings = { ...settings, ...changes.geoSettings.newValue };
    saveSettings(); // Ensure changes are persisted
  }
});

// Override geolocation for all tabs
chrome.scripting.registerContentScripts([{
  id: 'geolocation-override',
  matches: ['<all_urls>'],
  js: ['content-script.js'],
  runAt: 'document_start',
}]).catch(console.error);

// Listen for tab updates to inject our script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "loading" &&
    tab.url &&
    tab.url.startsWith("http")
  ) {
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        files: ["content.js"],
      })
      .catch((error) => console.error("Script injection failed:", error));
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getSettings") {
    // Generate random coordinates if enabled
    let latitude = settings.latitude;
    let longitude = settings.longitude;

    if (settings.enabled && settings.randomEnabled) {
      // Convert radius from meters to degrees (approximate)
      const radiusLat = settings.randomRadius / 111000; // 1 degree ~ 111km
      const radiusLng =
        settings.randomRadius /
        (111000 * Math.cos((settings.latitude * Math.PI) / 180));

      // Generate random offset
      const randomLat = (Math.random() * 2 - 1) * radiusLat;
      const randomLng = (Math.random() * 2 - 1) * radiusLng;

      latitude = settings.latitude + randomLat;
      longitude = settings.longitude + randomLng;
    }

    // Log the request if enabled
    if (settings.enabled && settings.logRequests && sender.tab) {
      chrome.runtime.sendMessage({
        type: "logRequest",
        url: sender.tab.url,
      });
    }

    sendResponse({
      enabled: settings.enabled,
      latitude: latitude,
      longitude: longitude,
      accuracy: settings.accuracy,
      lastLocationName: settings.lastLocationName
    });
  }

  if (message.type === 'GET_LOCATION_OVERRIDE') {
    sendResponse({
      enabled: settings.enabled,
      latitude: settings.latitude,
      longitude: settings.longitude,
      lastLocationName: settings.lastLocationName
    });
  }

  if (message.type === 'UPDATE_SETTINGS') {
    settings = { ...settings, ...message.settings };
    saveSettings();
    sendResponse({ success: true });
  }

  return true; // Keep the message channel open for async response
});
