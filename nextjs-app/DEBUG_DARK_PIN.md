# Debug Guide: Location Tracking Issues

## Problems Solved
1. ✅ Dark pin (current location marker) not appearing on the map
2. ✅ App crashing when switching locations through sensors
3. ✅ GeolocationPositionError handling
4. ✅ Frequent location updates causing performance issues

## New Features Added
- 🎯 **Location Watching**: Automatically detects location changes
- 🔄 **Retry Logic**: Smart retry with exponential backoff
- 🛡️ **Error Boundaries**: Graceful error handling without crashes
- ⚡ **Debouncing**: Prevents excessive updates for small changes
- 📊 **Status Indicators**: Visual feedback for watching status

## Root Causes and Solutions

### 1. Missing Mapbox Token (Most Likely Issue)

**Check if you have a valid Mapbox token:**

1. Open your browser's developer console (F12)
2. Look for the log message: `Environment variables:`
3. Check if `hasToken: true` and `tokenLength` is greater than 0

**Solution:**
1. Get a Mapbox token from: https://account.mapbox.com/access-tokens/
2. Create/edit the `.env` file in your project root
3. Add: `VITE_MAPBOX_TOKEN=your_actual_token_here`
4. Restart your development server

### 2. Map Not Loading Properly

**Debug Steps:**
1. Open browser console and look for:
   - `Map loaded successfully` (good)
   - `Map error:` (indicates token/loading issues)
   - `Please provide a valid Mapbox token` (token issue)

**Solution:**
- If you see map errors, verify your token is valid
- Check network tab for failed requests to Mapbox APIs

### 3. Current Location Not Available

**Debug Steps:**
1. Look for console messages:
   - `Updating current location marker:` followed by location data (good)
   - `No current location to display` (no location data)
   - `Map not ready for current location marker` (map initialization issue)

**Solution:**
- Click "Get Current Location" button to trigger location fetching
- Check if browser is asking for location permissions
- Ensure you're not blocking geolocation in browser settings

### 4. CSS/Styling Issues

**Debug Steps:**
1. Check if the marker element exists in DOM:
   - Open Elements tab in DevTools
   - Look for elements with class `current-location-marker`
2. Check if CSS is loading:
   - Look for the CSS classes in the Styles tab

**Solution:**
- The CSS has been updated with better z-index and visibility
- Clear browser cache and hard refresh (Ctrl+Shift+R)

## Quick Test Steps

1. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

2. **Open browser console and check for:**
   - Environment variables log
   - Map loading messages
   - Current location marker messages
   - Location watch status

3. **Test location functionality:**
   - Click "Get Current Location" button
   - Allow location access when prompted
   - Watch console for marker creation messages
   - Toggle "Start/Stop Watching" button

4. **Test sensor location changes:**
   - Open Chrome DevTools (F12)
   - Go to Console tab, then click the three dots menu → More tools → Sensors
   - Change location using the location override
   - Watch the app update automatically without crashing

5. **Verify visually:**
   - Look for a blue pulsing circle on the map (current location)
   - It should be distinct from regular location pins (orange)
   - Status indicator should show "📡 Actively watching for location changes"
   - Retry attempts should be shown if errors occur

## Expected Console Output (Working State)

```
Environment variables: {
  VITE_MAPBOX_TOKEN: "pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6...",
  tokenLength: 94,
  hasToken: true
}
Map loaded successfully
Starting location watch...
Starting geolocation watch with options: {enableHighAccuracy: true, timeout: 10000, maximumAge: 5000}
Processing location update: 40.7128, -74.0060 (auto: false)
Updating current location marker: {id: "...", latitude: 40.7128, longitude: -74.0060, ...}
Adding current location marker at: 40.7128 -74.0060
Current location marker added successfully
Location watch update: {lat: 40.7128, lng: -74.0060, accuracy: 10, timestamp: "2025-01-28T15:52:00.000Z"}
```

## Error Handling Examples

**Position Unavailable (Common with sensor changes):**
```
Location watch error: {code: 2, message: "", timestamp: "2025-01-28T15:52:00.000Z"}
Retrying location watch in 1000ms (attempt 1)
```

**Successful Recovery:**
```
Stopping location watch...
Starting location watch...
Location watch update: {lat: 53.0045, lng: 8.7689, accuracy: 10}
Processing location update: 53.0045, 8.7689 (auto: true)
```

## Visual Identification

- **Regular location pins:** Orange/yellow circles with drop shadow
- **Current location marker:** Blue circle with multiple pulsing rings
- **Position:** Should be centered on your actual coordinates

## New UI Elements

### Watch Control Button
- **"Start Watching"** (outlined): Click to begin automatic location monitoring
- **"Stop Watching"** (filled): Click to stop automatic monitoring
- **Retry counter**: Shows "(1)", "(2)", etc. during retry attempts

### Status Panel
- **"📡 Actively watching for location changes"**: Indicates automatic monitoring is active
- **"⚠️ [Error message]"**: Shows current error state
- **Retry attempts**: Shows current retry attempt number

## Troubleshooting Sensor Changes

### Common Issues:
1. **Blank location after sensor change**: 
   - ✅ **Fixed**: Now handled with proper error boundaries and retry logic
   - The app will automatically retry failed location requests

2. **App crashes on location change**: 
   - ✅ **Fixed**: Error boundary catches crashes and provides recovery options
   - Click "Try Again" or "Reload Page" if crashes occur

3. **Frequent GeolocationPositionError code 2**: 
   - ✅ **Fixed**: Implemented exponential backoff retry (1s, 2s, 4s, 8s, 16s, max 30s)
   - Position unavailable errors are now handled gracefully

### If Still Having Issues:

1. Check browser permissions for location access
2. Try a different browser or incognito mode
3. Verify the Mapbox token has the correct scopes:
   - styles:read
   - fonts:read  
   - datasets:read
   - geocoding

4. Check if you're on HTTPS (required for geolocation API)
5. Clear browser cache and hard refresh (Ctrl+Shift+R)
6. Check if location services are enabled on your OS

## Emergency Fallback

If the issue persists, you can temporarily add this to the CSS to make the marker more visible:

```css
.current-location-marker {
  background-color: red !important;
  width: 50px !important;
  height: 50px !important;
  border-radius: 50% !important;
  z-index: 9999 !important;
}
```

This will create a large red circle that's impossible to miss.
