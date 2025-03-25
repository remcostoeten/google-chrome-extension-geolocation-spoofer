import React, { useCallback, useEffect, useMemo } from 'react';
import type { Location } from './types';

const VIEWPORT_PADDING = 50;

export const VirtualizedMarkers = React.memo(({ 
  locations, 
  bounds, 
  createMarker 
}: { 
  locations: Location[];
  bounds: mapboxgl.LngLatBounds;
  createMarker: (location: Location) => void;
}) => {
  const visibleLocations = useMemo(() => 
    locations.filter(location => 
      location.longitude >= (bounds.getWest() - VIEWPORT_PADDING) &&
      location.longitude <= (bounds.getEast() + VIEWPORT_PADDING) &&
      location.latitude >= (bounds.getSouth() - VIEWPORT_PADDING) &&
      location.latitude <= (bounds.getNorth() + VIEWPORT_PADDING)
    ),
    [locations, bounds]
  );

  return null; // This component handles marker creation via side effects
}, (prevProps, nextProps) => {
  return prevProps.bounds.toString() === nextProps.bounds.toString() &&
         prevProps.locations === nextProps.locations;
});

VirtualizedMarkers.displayName = 'VirtualizedMarkers';
