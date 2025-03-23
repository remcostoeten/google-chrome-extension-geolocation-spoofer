# Geolocation Manager

A sleek, user-friendly Chrome extension for managing browser location settings. Features a dark theme interface and powerful profile management capabilities.

## Features

- 🌍 Override browser geolocation with custom coordinates
- 🏷️ Save and manage location profiles
- 📤 Export and import location profiles
- 🌙 Modern dark theme interface
- 🚩 Location display with country flags
- 🗺️ Optional Google Maps integration

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store page](#)
2. Click "Add to Chrome"
3. Follow the installation prompts

### Manual Installation
1. Download the latest release from the [releases page](https://github.com/remcostoeten/geolocation-manager/releases)
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the downloaded folder

## Usage

1. Click the extension icon in your browser toolbar
2. Toggle "Enable Location Override" to activate
3. Enter a location by:
   - Typing a city name or address
   - Entering coordinates directly
   - Using the current location button
4. Save frequently used locations as profiles
5. Export/Import profiles for backup or sharing

### Profile Management

- **Save Profile**: Enter a name and click "Save Current Location"
- **Export Profiles**: Click "Export Profiles" to download as JSON
- **Import Profiles**: Click "Import Profiles" and select a JSON file

## Optional Features

### Google Maps Integration
To enable the map interface:
1. Get a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview)
2. Open extension settings
3. Enter your API key and save

## Development

### Prerequisites
- Node.js
- Chrome Browser

### Setup
1. Clone the repository
```bash
git clone https://github.com/remcostoeten/geolocation-manager.git
cd geolocation-manager
```

2. Install dependencies
```bash
npm install
```

3. Load the extension in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

### Building
```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**remcostoeten**
- GitHub: [@remcostoeten](https://github.com/remcostoeten)

## Acknowledgments

- Icons from [Material Design Icons](https://material.io/resources/icons/)
- Country flags from Unicode emoji 