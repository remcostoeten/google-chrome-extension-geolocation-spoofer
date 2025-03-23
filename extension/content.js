// Inject our script into the page to override geolocation
const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
(document.head || document.documentElement).appendChild(script);
script.onload = () => {
  script.remove();
};

// Listen for messages from the injected script
window.addEventListener("message", (event) => {
  // Only accept messages from the same frame
  if (event.source !== window) return;

  if (event.data.type === "getGeolocationSettings") {
    // Request settings from background script
    chrome.runtime.sendMessage({ type: "getSettings" }, (response) => {
      // Send settings back to the injected script
      window.postMessage(
        {
          type: "geolocationSettings",
          settings: response,
        },
        "*",
      );
    });
  }
});
