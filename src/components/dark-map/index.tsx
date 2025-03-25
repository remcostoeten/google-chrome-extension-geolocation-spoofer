import React, { useRef, useEffect, useState, memo, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Maximize, Minimize, Plus, Minus } from 'lucide-react';
import { createMapMarker, setupMapControls } from './map-utils';
import { VirtualizedMarkers } from './virtualized-markers';
import { debounce } from 'lodash-es';
import type { MapProps } from './types';
import { SpatialIndex } from '../../utils/spatial-index';
import { tokenCache } from '../../utils/token-cache';
import { BufferPool } from '../../utils/performance-config';
import { TileCache } from '../../utils/tile-cache';

const DarkMap = memo(({ locations = [], mapboxToken }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapBounds, setMapBounds] = useState<mapboxgl.LngLatBounds | null>(null);
  const markersCache = useRef(new Map());
  const mapWorker = useRef<Worker>();
  const spatialIndex = useRef(new SpatialIndex());
  const frameRequest = useRef<number>();
  const renderCache = useRef(new WeakMap());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const preloadQueue = useRef<string[]>([]);

  // Add clustering configuration
  const clusterConfig = useMemo(() => ({
    radius: 50,
    maxZoom: 16
  }), []);

  useEffect(() => {
    const cachedToken = tokenCache.get();
    if (cachedToken) {
      mapboxgl.accessToken = cachedToken;
    } else {
      mapboxgl.accessToken = mapboxToken;
      tokenCache.set(mapboxToken);
    }

    // Preload map tiles for common zoom levels
    const preloadTiles = async () => {
      const commonZoomLevels = [13, 14, 15];
      const centerTile = { x: 0, y: 0 };
      
      for (const zoom of commonZoomLevels) {
        const url = `https://api.mapbox.com/v4/mapbox.dark/${zoom}/${centerTile.x}/${centerTile.y}.vector.pbf?access_token=${mapboxgl.accessToken}`;
        await fetch(url);
      }
    };

    Promise.all([
      preloadTiles(),
      preloadMarkerAssets(),
    ]).then(() => setIsInitialLoad(false));
  }, [mapboxToken]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 0],
      zoom: 13,
      maxZoom: 17,
      preserveDrawingBuffer: false, // Performance boost
      antialias: false, // Disable antialiasing for better performance
      useWebGL2: true // Enable WebGL2 if available
    });

    setupMapControls(map.current);

    // Enable clustering
    map.current.on('load', () => {
      map.current?.addSource('locations', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: clusterConfig.maxZoom,
        clusterRadius: clusterConfig.radius
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, clusterConfig]);

  useEffect(() => {
    if (!map.current) return;
    locations.forEach(location => {
      createMapMarker(map.current!, location);
    });
  }, [locations]);

  useEffect(() => {
    mapWorker.current = new Worker(
      new URL('../../workers/map.worker.ts', import.meta.url)
    );

    return () => mapWorker.current?.terminate();
  }, []);

  const updateMapBounds = useCallback(debounce(() => {
    if (!map.current) return;
    setMapBounds(map.current.getBounds());
  }, 100), []);

  useEffect(() => {
    if (!map.current) return;
    
    map.current.on('moveend', updateMapBounds);
    map.current.on('zoomend', updateMapBounds);
    
    // Enable WebGL optimizations
    (map.current as any).transform.renderWorldCopies = false;
    map.current.setMaxZoom(17); // Limit max zoom for performance
    
    return () => {
      map.current?.off('moveend', updateMapBounds);
      map.current?.off('zoomend', updateMapBounds);
    };
  }, [updateMapBounds]);

  // Preload and cache marker images
  const preloadMarkerAssets = useCallback(() => {
    const markerImage = new Image();
    markerImage.src = '/marker-icon.png';
    return new Promise(resolve => {
      markerImage.onload = resolve;
    });
  }, []);

  useEffect(() => {
    preloadMarkerAssets();
  }, [preloadMarkerAssets]);

  // Add marker cleanup
  useEffect(() => {
    return () => {
      markersCache.current.forEach(marker => marker.remove());
      markersCache.current.clear();
    };
  }, []);

  // Add WebGL layer setup
  const setupWebGLLayer = useCallback(() => {
    if (!map.current) return;
    
    const gl = map.current.getCanvas().getContext('webgl2', {
      antialias: false,
      desynchronized: true,
      preserveDrawingBuffer: false
    });
    
    if (gl) {
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
    }
  }, []);

  useEffect(() => {
    if (!map.current) return;
    setupWebGLLayer();
    
    // Enable memory optimizations
    const clearStaleData = () => {
      if (renderCache.current.size > 1000) {
        renderCache.current = new WeakMap();
      }
    };
    
    const interval = setInterval(clearStaleData, 30000);
    return () => clearInterval(interval);
  }, [setupWebGLLayer]);

  // Optimize marker updates with spatial indexing
  const updateMarkers = useCallback((locations) => {
    if (!map.current || !mapBounds) return;
    
    cancelAnimationFrame(frameRequest.current!);
    
    const priorityMarkers = locations.filter(loc => {
      const bounds = mapBounds.toArray().flat();
      return loc.lng >= bounds[0] && 
             loc.lng <= bounds[2] && 
             loc.lat >= bounds[1] && 
             loc.lat <= bounds[3];
    });

    frameRequest.current = requestAnimationFrame(() => {
      priorityMarkers.forEach(location => {
        if (!renderCache.current.has(location)) {
          const marker = optimizedMarkerCreation(location);
          markersCache.current.set(location.id, marker);
          renderCache.current.set(location, true);
        }
      });

      requestIdleCallback(() => {
        const remainingMarkers = locations.filter(
          loc => !priorityMarkers.includes(loc)
        );
        updateMarkers(remainingMarkers);
      });
    });
  }, [mapBounds, optimizedMarkerCreation]);

  // Update spatial index when locations change
  useEffect(() => {
    locations.forEach(loc => {
      spatialIndex.current.insert(loc.id, loc.lng, loc.lat);
    });
  }, [locations]);

  // Memory management
  useEffect(() => {
    const memoryCheck = () => {
      if (performance.memory && (performance.memory as any).usedJSHeapSize > 200_000_000) {
        renderCache.current = new WeakMap();
        markersCache.current.forEach((marker, id) => {
          if (!spatialIndex.current.query(
            mapBounds?.getWest() || 0,
            mapBounds?.getSouth() || 0,
            mapBounds?.getEast() || 0,
            mapBounds?.getNorth() || 0
          ).has(id)) {
            marker.remove();
            markersCache.current.delete(id);
          }
        });
      }
    };

    const interval = setInterval(memoryCheck, 10000);
    return () => clearInterval(interval);
  }, [mapBounds]);

  // Add GPU acceleration hint
  useEffect(() => {
    if (mapContainer.current) {
      mapContainer.current.style.transform = 'translateZ(0)';
      mapContainer.current.style.willChange = 'transform';
    }
  }, []);

  const toggleFullscreen = () => setIsFullscreen(prev => !prev);
  const handleZoom = (direction: 'in' | 'out') => {
    direction === 'in' ? map.current?.zoomIn() : map.current?.zoomOut();
  };

  // Progressive loading strategy
  const loadVisibleTilesFirst = useCallback(() => {
    if (!map.current || !mapBounds) return;

    const visibleTiles = map.current.queryRenderedFeatures({
      layers: ['background']
    });

    const visibleTileUrls = visibleTiles.map(tile => tile.source);
    preloadQueue.current = [...new Set(visibleTileUrls)];

    const loadNextTile = () => {
      const url = preloadQueue.current.shift();
      if (url) {
        fetch(url).then(() => {
          if (preloadQueue.current.length) {
            requestIdleCallback(loadNextTile);
          }
        });
      }
    };

    requestIdleCallback(loadNextTile);
  }, [mapBounds]);

  // Optimize marker creation with SharedArrayBuffer for multi-threading
  const optimizedMarkerCreation = useCallback((location) => {
    if (!map.current) return;

    const buffer = BufferPool.acquire();
    const view = new Float64Array(buffer);
    view[0] = location.lng;
    view[1] = location.lat;

    mapWorker.current?.postMessage({ 
      type: 'CREATE_MARKER',
      buffer,
      id: location.id 
    }, [buffer]);

    const marker = createMapMarker(map.current, location);
    
    // Release buffer when marker is removed
    marker.on('remove', () => {
      BufferPool.release(buffer);
    });

    return marker;
  }, []);

  // Add tile caching
  useEffect(() => {
    if (!map.current) return;
    
    const tileCache = TileCache.getInstance();
    map.current.on('sourcedata', async (e) => {
      if (e.isSourceLoaded && e.sourceId === 'mapbox') {
        const tiles = map.current!.queryRenderedFeatures();
        tiles.forEach(async (tile) => {
          if (tile.source === 'mapbox') {
            await tileCache.getTile(tile.properties!.url);
          }
        });
      }
    });
  }, []);

  // Add image optimization
  const optimizeMapAssets = () => {
    // Create optimized marker images with different resolutions
    const sizes = [1, 1.5, 2];
    return Promise.all(sizes.map(size => {
      const image = new Image();
      image.src = `/marker-icon@${size}x.png`;
      return new Promise(resolve => {
        image.onload = resolve;
      });
    }));
  };

  // Add to component initialization
  useEffect(() => {
    const init = async () => {
      if (isInitialLoad) {
        await Promise.all([
          optimizeMapAssets(),
          import('./map-utils').then(module => module.preloadMapStyle()),
          new Promise(resolve => {
            // Add loading timeout to prevent flashing
            setTimeout(resolve, 300);
          })
        ]);
        setIsInitialLoad(false);
      }
    };
    init();
  }, [isInitialLoad]);

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[500px]'}`}>
      {isInitialLoad && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="loading-spinner" />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
      {mapBounds && (
        <VirtualizedMarkers
          locations={locations}
          bounds={mapBounds}
          createMarker={createMapMarker}
        />
      )}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        <button onClick={() => handleZoom('in')}><Plus size={18} /></button>
        <button onClick={() => handleZoom('out')}><Minus size={18} /></button>
      </div>
    </div>
  );
});

DarkMap.displayName = 'DarkMap';
export default DarkMap;
