// Saves options to chrome.storage
function saveOptions() {
  const apiKey = document.getElementById("api-key").value
  chrome.storage.sync.set({ googleMapsApiKey: apiKey }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById("status")
    status.textContent = "Options saved."
    setTimeout(() => {
      status.textContent = ""
    }, 750)
  })
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get({ googleMapsApiKey: "" }, (items) => {
    document.getElementById("api-key").value = items.googleMapsApiKey
  })
}

document.addEventListener("DOMContentLoaded", restoreOptions)
document.getElementById("save").addEventListener("click", saveOptions)

