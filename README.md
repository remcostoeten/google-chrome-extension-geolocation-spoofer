# Geolocation Manager & Tester

This repository contains two unique apps for managing and testing geolocation:

1.  **Geolocation Tester:** A Next.js 15 application deployed at
    [https://geolocation-tester.vercel.app/](https://geolocation-tester.vercel.app/).
    Use it to test your current geolocation.

2.  **Geolocation Spoofing Browser Extension:**  An extension to spoof your
    geolocation (overwrite the browser location).  This can also be achieved
    through browser developer tools
    (`more tools -> sensors -> location`), but the extension offers these
    advantages:

    *   More intuitive user interface
    *   Visually appealing design
    *   Ability to export and import saved addresses
    *   Displays possible results and country flag during address search
    *   Location spoofing persists across all tabs (unlike DevTools method)
    *   No need to remember latitude/longitude values

![geolocation-viewer-cover](https://github.com/user-attachments/assets/a0f6aa10-0b45-4731-8866-6d5fd8192d53)

## Project Structure

```
├── extension/           # Chrome extension for geolocation spoofing
├── nextjs-app/         # Next.js application for testing (coming soon)
└── README.md          # This file
```

## Components

### Chrome Extension
A powerful browser extension for managing and overriding your geolocation. Perfect for wanting to spoof location for (in-browser) Pokemon Go, going anywhere on Tinder without the need for Tinder+ subscription AND not getting the label "used passport mode", thus people really thinking you are there and development purposes such as automatic timezone/currency assignment based on country/area.

Key features:
- Override browser geolocation with custom coordinates
- Save and manage favorite locations
- Dark monochrome theme
- Export/Import location profiles

### Next.js geolocation viewer

View on [Geolocation viewer](https://geolocation-tester.vercel.app/) or if you want to run local 

A web application that reads (on persmission) the location that the browser sents out. This tool is build especailly for this extension to test if the location hopping works. This uses the same technique as well established sites like [MyLocation.org](https://mylocation.org/) (under the tab browser geolocation).

#### Features

1. View current location on interval
2. Show current location with: country, city, longitude, latitude and timestamp
3. See previous locations.

## Installation

### Chrome Extension
1. Download the latest release from the extension directory
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extracted extension folder

Or

1. cloning this repo
2. navigate to `chrome://extensions/`  or .. `brave://extensions/`
3. toggle devtools switch top right
4. load unpacked
5. navigate to the cloned repo, inside there navigate to the extension folder and open that and done.

### Installation

```bash
git clone https://github.com/remcostoeten/google-chrome-extension-geolocation-spoofer.git geolocation-viewer
cd geolocation-viewer
pnpm install
pnpm run dev
```
For the map to work use a api key from here [mapbox](https://account.mapbox.com/)

## License

MIT License - See LICENSE file for details

## Author

[@remcostoeten](https://github.com/remcostoeten)
