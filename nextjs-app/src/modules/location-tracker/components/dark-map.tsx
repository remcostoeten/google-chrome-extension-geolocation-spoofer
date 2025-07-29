import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location, MapOptions } from '../types';
import { formatCoordinates } from '../lib/geo-services';
import { Maximize, Minimize, Plus, Minus, Compass } from 'lucide-react';

interface DarkMapProps {
  locations: Location[];
  currentLocation?: Location;
  mapboxToken: string;
  onMapLoad?: () => void;
}

const mapStyle = {
  dark: 'mapbox://styles/mapbox/dark-v11'
};

const DEFAULT_MAPBOX_TOKEN = 'YOUR_MAPBOX_TOKEN';

const DEFAULT_MAP_OPTIONS: MapOptions = {
  zoom: 13,
  minZoom: 2,
  maxZoom: 18,
  center: [0, 0],
  style: mapStyle.dark,
};

const DarkMap: React.FC<DarkMapProps> = ({
  locations,
  currentLocation,
  mapboxToken = DEFAULT_MAPBOX_TOKEN,
  onMapLoad
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const currentLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // useCallback for map initialization
  const initializeMap = useCallback(() => {
    if (!mapboxToken || mapboxToken === DEFAULT_MAPBOX_TOKEN || mapboxToken === '') {
      const errorMsg = 'Please provide a valid Mapbox token. Check your .env file for VITE_MAPBOX_TOKEN.';
      console.error(errorMsg);
      setMapError(errorMsg);
      return;
    }

    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    const options = { ...DEFAULT_MAP_OPTIONS };

    if (currentLocation) {
      options.center = [currentLocation.longitude, currentLocation.latitude];
    }

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      ...options,
    });

    // Add navigation control
    mapInstance.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: false,
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add fullscreen control
    mapInstance.addControl(
      new mapboxgl.FullscreenControl(),
      'top-right'
    );

    // Add geolocate control
    mapInstance.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    mapInstance.on('load', () => {
      map.current = mapInstance;
      setMapError(null);
      console.log('Map loaded successfully');
      if (onMapLoad) onMapLoad();
    });

    mapInstance.on('error', (e) => {
      console.error('Map error:', e);
      setMapError('Failed to load map. Please check your Mapbox token.');
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, currentLocation, onMapLoad]);

  // Initialize Mapbox
  useEffect(() => {
    return initializeMap();
  }, [initializeMap]);

  // Update markers when locations change
  const updateMarkers = useCallback(() => {
    if (!map.current) return;

    // Remove old markers not in the current locations
    Object.keys(markers.current).forEach(id => {
      if (!locations.find(loc => loc.id === id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    // Add or update markers for current locations
    locations.forEach(location => {
      const { id, latitude, longitude, city } = location;

      if (markers.current[id]) {
        // Update existing marker position
        markers.current[id].setLngLat([longitude, latitude]);
      } else {
        // Create marker elements
        const markerEl = document.createElement('div');
        markerEl.className = 'map-pin';
        markerEl.innerHTML = `
          <div class="map-pin__pointer">
            <div class="map-pin__inner"></div>
            <div class="map-pin__pulse"></div>
          </div>
          <div class="map-pin__shadow"></div>
        `;

        // Create a popup
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'glass-panel',
          offset: 25
        }).setHTML(`
          <div class="text-xs font-medium">
            <div class="text-muted-foreground">${city || 'Unknown Location'}</div>
            <div class="text-foreground">${formatCoordinates(latitude, longitude)}</div>
          </div>
        `);

        // Create and store the marker
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map.current);

        markers.current[id] = marker;

        // Show popup on hover
        markerEl.addEventListener('mouseenter', () => {
          marker.getPopup().addTo(map.current!);
        });

        markerEl.addEventListener('mouseleave', () => {
          marker.getPopup().remove();
        });
      }
    });

    // Focus map on current location if available
    if (currentLocation && map.current) {
      map.current.flyTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        zoom: 14,
        speed: 1.5,
        curve: 1,
        essential: true
      });
    }
  }, [locations, currentLocation]);

  // Update current location marker
  const updateCurrentLocationMarker = useCallback(() => {
    if (!map.current) {
      console.log('Map not ready for current location marker');
      return;
    }

    console.log('Updating current location marker:', currentLocation);

    // Remove existing current location marker
    if (currentLocationMarker.current) {
      currentLocationMarker.current.remove();
      currentLocationMarker.current = null;
      console.log('Removed existing current location marker');
    }

    // Add current location marker if available
    if (currentLocation) {
      const { latitude, longitude, city } = currentLocation;
      console.log('Adding current location marker at:', latitude, longitude);

      // Create a distinct marker element for current location
      const currentMarkerEl = document.createElement('div');
      currentMarkerEl.className = 'current-location-marker';
      currentMarkerEl.style.zIndex = '1000'; // Ensure it's on top
      currentMarkerEl.innerHTML = `
        <div class="current-location-pin">
          <div class="current-location-pin__center"></div>
          <div class="current-location-pin__pulse"></div>
          <div class="current-location-pin__outer-pulse"></div>
        </div>
      `;

      // Create popup for current location
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'glass-panel current-location-popup',
        offset: 25
      }).setHTML(`
        <div class="text-xs font-medium">
          <div class="text-primary font-semibold">📍 Current Location</div>
          <div class="text-muted-foreground">${city || 'Unknown Location'}</div>
          <div class="text-foreground">${formatCoordinates(latitude, longitude)}</div>
        </div>
      `);

      // Create and store the current location marker
      const marker = new mapboxgl.Marker({
        element: currentMarkerEl,
        anchor: 'center'
      })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current);

      currentLocationMarker.current = marker;
      console.log('Current location marker added successfully');

      // Show popup on hover
      currentMarkerEl.addEventListener('mouseenter', () => {
        marker.getPopup().addTo(map.current!);
      });

      currentMarkerEl.addEventListener('mouseleave', () => {
        marker.getPopup().remove();
      });

      // Focus map on current location
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        speed: 1.2,
        curve: 1,
        essential: true
      });
    } else {
      console.log('No current location to display');
    }
  }, [currentLocation]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  useEffect(() => {
    updateCurrentLocationMarker();
  }, [updateCurrentLocationMarker]);

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle zoom in
  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };

  // Handle zoom out
  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };

  // Show error if mapbox token is invalid
  if (mapError) {
    return (
      <div className={`relative z-0 w-full transition-all duration-300 ease-in-out ${isFullscreen ? 'h-screen fixed inset-0' : 'h-[500px]'} flex items-center justify-center bg-muted border border-border`}>
        <div className="text-center p-8">
          <div className="text-destructive text-lg font-semibold mb-2">Map Error</div>
          <div className="text-muted-foreground text-sm mb-4">{mapError}</div>
          <div className="text-xs text-muted-foreground">
            <div>1. Get a Mapbox token from: <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://account.mapbox.com/access-tokens/</a></div>
            <div>2. Create a .env file in your project root</div>
            <div>3. Add: VITE_MAPBOX_TOKEN=your_token_here</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative z-0 w-full transition-all duration-300 ease-in-out ${isFullscreen ? 'h-screen fixed inset-0' : 'h-[500px]'}`}>
      <div
        ref={mapContainer}
        className="w-full h-full map-container"
      />

      {/* Custom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={handleFullscreenToggle}
          className="p-2 bg-card border border-border hover:bg-secondary transition-colors"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>

        <button
          onClick={handleZoomIn}
          className="p-2 bg-card border border-border hover:bg-secondary transition-colors"
        >
          <Plus size={18} />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 bg-card border border-border hover:bg-secondary transition-colors"
        >
          <Minus size={18} />
        </button>
      </div>

      {currentLocation && (
        <div className="absolute top-4 left-4 glass-panel p-3 z-10 animate-fade-in-up text-sm">
          <div className="status-indicator status-active flex items-center mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Live Location</span>
          </div>
          <div className="text-white font-medium">
            {currentLocation.city || 'Unknown Location'}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatCoordinates(currentLocation.latitude, currentLocation.longitude)}
          </div>
        </div>
      )}
    </div>
  );
};

export default DarkMap;
