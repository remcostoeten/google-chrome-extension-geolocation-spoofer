# Geolocation Tester

A modern web application built to test and override browser geolocation. This tool is designed to work in conjunction with the geolocation-manager browser extension, allowing developers to test their applications with different geolocation values.

## Features

- 🌍 **Geolocation Testing** - Test your application with different geographic locations
- 🗺️ **MapBox Integration** - Visual representation of selected locations
- 🎯 **Precise Coordinates** - Set exact latitude and longitude values
- ⚡️ **Real-time Updates** - Instant feedback on location changes
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui
- 🔒 **TypeScript** - Full type safety
- 📱 **Responsive Design** - Works on all devices

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- A modern web browser
- [Geolocation Manager Extension](https://github.com/remcostoeten/geolocation-manager) (optional but recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/remcostoeten/geolocation-tester.git
cd geolocation-tester
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. Allow location access in your browser when prompted
2. Use the interface to:
   - View your current location
   - Set custom coordinates
   - Use the map to select locations
   - Test geolocation-dependent features

## Project Structure

```
geolocation-tester/
├── src/              # Source files
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/         # Utility functions
│   └── pages/       # Application pages
├── public/           # Static files
├── dist/            # Production build
└── ...config files
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Integration with Geolocation Manager

This application works best when used alongside the [Geolocation Manager](https://github.com/remcostoeten/geolocation-manager) browser extension. The extension allows you to:

- Override browser geolocation
- Save favorite locations
- Quick switch between locations
- Test location-based features

## Author

**Remco Stoeten**
- Website: [remcostoeten.com](https://remcostoeten.com)
- GitHub: [@remcostoeten](https://github.com/remcostoeten)

## License

This project is licensed under the MIT License.
