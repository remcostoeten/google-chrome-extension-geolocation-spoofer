import React, { useState, useCallback, useRef } from 'react';
import { Location } from '../types';
import { formatCoordinates } from '../lib/geo-services';
import { format } from 'date-fns';
import { MapPin, Clock, Globe, PauseCircle, PlayCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Fixed import from shadcn/ui instead of react-day-picker
import useLocationTracker from '../hooks/use-location-tracker';

interface LocationDisplayProps {
  mapboxToken: string;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ mapboxToken }) => {
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const REFRESH_COOLDOWN = 2000; // 2 seconds cooldown

  const {
    locations,
    currentLocation,
    isLoading,
    status,
    isWatching,
    startTracking,
    stopTracking,
    updateCurrentPosition,
    clearHistory,
    selectLocation,
  } = useLocationTracker({ 
    mapboxToken, 
    autoStart: false,
    refreshInterval: 0 // Disable auto refresh
  });

  const handleToggleTracking = () => {
    if (isWatching) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const handleRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefresh >= REFRESH_COOLDOWN && !isLoading) {
      updateCurrentPosition();
      setLastRefresh(now);
    }
  }, [lastRefresh, isLoading, updateCurrentPosition]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    const timeoutRef = refreshTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);

  // Update button to show cooldown
  const isRefreshDisabled = Date.now() - lastRefresh < REFRESH_COOLDOWN;

  if (isLoading) {
    return (
      <div className="bg-card border border-border p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-muted rounded w-2/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!currentLocation) {
    return (
      <div className="bg-card border border-border p-4">
        <p className="text-muted-foreground">No location data available</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-4 animate-fade-in">
      <div className="flex flex-col space-y-3">
        <div>
          <div className={`status-indicator ${currentLocation.status ? `status-${currentLocation.status}` : 'status-active'}`}>
            <span className="text-xs font-medium tracking-wider uppercase">
              {currentLocation.status === 'pending' ? 'Locating...' : 
               currentLocation.status === 'inactive' ? 'Inactive' : 
               currentLocation.status === 'active' ? 'Active' : 'Unknown'}
            </span>
          </div>
          <h2 className="text-xl font-medium mt-1">
            {currentLocation.city || 'Unknown Location'}
            {currentLocation.country ? `, ${currentLocation.country}` : ''}
          </h2>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin size={16} className="mr-2" />
            <span>{formatCoordinates(currentLocation.latitude, currentLocation.longitude)}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock size={16} className="mr-2" />
            <span>{format(new Date(currentLocation.timestamp), 'MMM d, yyyy - h:mm:ss a')}</span>
          </div>
          
          {currentLocation.country && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Globe size={16} className="mr-2" />
              <span>{currentLocation.country}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4">
        <Button
          onClick={handleToggleTracking}
          variant="outline"
          className="flex-1"
        >
          {isWatching ? (
            <>
              <PauseCircle className="mr-2 h-4 w-4" />
              Stop Tracking
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Tracking
            </>
          )}
        </Button>

        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isLoading || isRefreshDisabled}
          className={isRefreshDisabled ? 'opacity-50' : ''}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="ml-2">
            {isRefreshDisabled ? 'Wait...' : 'Refresh'}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default LocationDisplay;
