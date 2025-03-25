import React, { useRef, useEffect, useState, Suspense } from 'react';
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
}

// Map styles
const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
};

const DEFAULT_MAPBOX_TOKEN = 'YOUR_MAPBOX_TOKEN';

const DEFAULT_MAP_OPTIONS: MapOptions = {
  zoom: 13,
  minZoom: 2,
  maxZoom: 18,
  center: [0, 0], // Default center, will be updated with current location
  style: MAP_STYLES.dark,
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Initialize Mapbox
  useEffect(() => {
    if (mapboxToken === DEFAULT_MAPBOX_TOKEN) {
      console.error('Please provide a valid Mapbox token');
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
      if (onMapLoad) onMapLoad();
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, currentLocation, onMapLoad]);

  // Update markers when locations change
  useEffect(() => {
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
        
        const markerInner = document.createElement('div');
        markerInner.className = 'map-pin__inner';
        markerEl.appendChild(markerInner);

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
