
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Location, 
  LocationStatus, 
  GeocodingResult 
} from '../types';
import { 
  getCurrentPosition, 
  reverseGeocode,
  watchPosition 
} from '../lib/geo-services';
import { 
  getLocationHistory, 
  addLocationToHistory,
  clearLocationHistory 
} from '../lib/history-storage';
import { toast } from '@/components/ui/use-toast';

interface UseLocationTrackerOptions {
  mapboxToken: string;
  autoStart?: boolean;
  watchLocation?: boolean;
}

const useLocationTracker = ({ mapboxToken, autoStart = true, watchLocation = true }: UseLocationTrackerOptions) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | undefined>();
  const [status, setStatus] = useState<LocationStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialCheck, setHasInitialCheck] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const watchIdRef = useRef<(() => void) | null>(null);
  const lastKnownPositionRef = useRef<{lat: number, lng: number} | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // Load location history on init and do initial check
  useEffect(() => {
    const savedLocations = getLocationHistory();
    if (savedLocations.length > 0) {
      setLocations(savedLocations);
    }
    
    if (autoStart && !hasInitialCheck) {
      performInitialLocationCheck();
    } else {
      setIsLoading(false);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to process location data (used by both manual and watch updates)
  const processLocationUpdate = useCallback(async (latitude: number, longitude: number, isAutoUpdate = false) => {
    // Prevent concurrent processing
    if (isProcessingRef.current && isAutoUpdate) {
      console.log('Location update already in progress, skipping...');
      return currentLocation;
    }

    try {
      isProcessingRef.current = true;
      
      // Validate coordinates
      if (!isFinite(latitude) || !isFinite(longitude) || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        throw new Error('Invalid coordinates received');
      }

      // Skip if position hasn't changed significantly (within ~10 meters)
      if (lastKnownPositionRef.current && isAutoUpdate) {
        const prevLat = lastKnownPositionRef.current.lat;
        const prevLng = lastKnownPositionRef.current.lng;
        const distance = Math.sqrt(
          Math.pow((latitude - prevLat) * 111000, 2) + 
          Math.pow((longitude - prevLng) * 111000, 2)
        );
        if (distance < 10) {
          console.log('Location change too small, skipping update');
          return currentLocation;
        }
      }

      console.log(`Processing location update: ${latitude}, ${longitude} (auto: ${isAutoUpdate})`);
      lastKnownPositionRef.current = { lat: latitude, lng: longitude };
      
      if (!isAutoUpdate) {
        setStatus('pending');
        setError(null);
        setRetryCount(0); // Reset retry count on manual update
      }
      
      // Reverse geocode to get city and country
      let geocodingResult: GeocodingResult = {};
      
      try {
        geocodingResult = await reverseGeocode(latitude, longitude, mapboxToken);
      } catch (geocodeError) {
        console.error('Error during geocoding:', geocodeError);
        // Continue without geocoding data
      }
      
      // Create location object
      const newLocation: Location = {
        id: uuidv4(),
        latitude,
        longitude,
        city: geocodingResult.city || 'Unknown Location',
        country: geocodingResult.country || 'Unknown Country',
        timestamp: Date.now(),
        status: 'active',
      };
      
      // Update current location
      setCurrentLocation(newLocation);
      
      // Add to history for all location updates (both manual and automatic)
      // The distance check above already filters out insignificant changes
      const updatedLocations = addLocationToHistory(newLocation);
      setLocations(updatedLocations);
      
      setStatus('active');
      setError(null); // Clear any previous errors
      
      if (!isAutoUpdate) {
        setIsLoading(false);
      }
      
      return newLocation;
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred while fetching location';
      
      console.error('Location processing error:', errorMessage);
      setError(errorMessage);
      setStatus('inactive');
      
      if (!isAutoUpdate) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: errorMessage,
        });
      }
      
      return undefined;
    } finally {
      isProcessingRef.current = false;
    }
  }, [mapboxToken, currentLocation]);

  // Function to get current position and reverse geocode
  const updateCurrentPosition = useCallback(async () => {
    try {
      setIsLoading(true);
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      return await processLocationUpdate(latitude, longitude, false);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred while fetching location';
      
      setError(errorMessage);
      setStatus('inactive');
      setIsLoading(false);
      
      toast({
        variant: "destructive",
        title: "Location Error",
        description: errorMessage,
      });
      
      return undefined;
    }
  }, [processLocationUpdate]);

  // Handle geolocation watch errors with retry logic
  const handleWatchError = useCallback((error: GeolocationPositionError) => {
    console.error('Location watch error:', {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString()
    });

    let errorMessage = 'Unknown location error';
    let shouldRetry = false;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location permissions.';
        shouldRetry = false;
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location position unavailable. Retrying...';
        shouldRetry = true;
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timeout. Retrying...';
        shouldRetry = true;
        break;
      default:
        errorMessage = 'Geolocation error occurred.';
        shouldRetry = true;
    }

    // Don't show toast for frequent errors, just log them
    if (retryCount === 0) {
      console.warn('Location watch error:', errorMessage);
    }

    // Implement exponential backoff retry for recoverable errors
    if (shouldRetry && retryCount < 5) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
      console.log(`Retrying location watch in ${retryDelay}ms (attempt ${retryCount + 1})`);
      
      setRetryCount(prev => prev + 1);
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        stopWatching();
        startWatching();
      }, retryDelay);
    } else if (!shouldRetry) {
      // Stop watching for non-recoverable errors
      stopWatching();
      setError(errorMessage);
    }
  }, [retryCount]);

  // Start watching location changes
  const startWatching = useCallback(() => {
    if (isWatching || watchIdRef.current) {
      console.log('Already watching location');
      return;
    }

    console.log('Starting location watch...');
    setIsWatching(true);
    setError(null); // Clear previous errors

    const clearWatch = watchPosition(
      (position) => {
        console.log('Location watch update:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        });
        
        // Reset retry count on successful update
        setRetryCount(0);
        
        // Process the location update
        processLocationUpdate(position.coords.latitude, position.coords.longitude, true);
      },
      handleWatchError
    );

    watchIdRef.current = clearWatch;
  }, [isWatching, processLocationUpdate, handleWatchError]);

  // Stop watching location changes
  const stopWatching = useCallback(() => {
    console.log('Stopping location watch...');
    
    // Clear the watch
    if (watchIdRef.current) {
      watchIdRef.current();
      watchIdRef.current = null;
    }
    
    // Clear any pending retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setIsWatching(false);
    setRetryCount(0);
    isProcessingRef.current = false;
  }, []);

  // Perform initial location check (once)
  const performInitialLocationCheck = useCallback(async () => {
    if (hasInitialCheck) return;
    
    setHasInitialCheck(true);
    setIsLoading(true);
    
    try {
      const location = await updateCurrentPosition();
      if (location) {
        toast({
          title: "Location Retrieved",
          description: "Your location has been successfully retrieved.",
        });
        
        // Start watching for location changes after initial success
        if (watchLocation) {
          setTimeout(() => startWatching(), 1000); // Small delay to avoid conflicts
        }
      }
    } catch (error) {
      console.error('Initial location check failed:', error);
    }
  }, [hasInitialCheck, updateCurrentPosition, watchLocation, startWatching]);

  // Clear location history
  const clearHistory = useCallback(() => {
    clearLocationHistory();
    setLocations([]);
    
    toast({
      title: "History Cleared",
      description: "Your location history has been cleared.",
    });
  }, []);

  // Select a location from history
  const selectLocation = useCallback((location: Location) => {
    setCurrentLocation(location);
  }, []);

  // Cleanup effect to stop watching when component unmounts
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  // Toggle watching functionality
  const toggleWatching = useCallback(() => {
    if (isWatching) {
      stopWatching();
      toast({
        title: "Location Watching Stopped",
        description: "No longer automatically tracking location changes.",
      });
    } else {
      startWatching();
      toast({
        title: "Location Watching Started",
        description: "Now automatically tracking location changes.",
      });
    }
  }, [isWatching, startWatching, stopWatching]);

  return {
    locations,
    currentLocation,
    isLoading,
    status,
    error,
    isWatching,
    retryCount,
    updateCurrentPosition,
    clearHistory,
    selectLocation,
    startWatching,
    stopWatching,
    toggleWatching,
  };
};

export default useLocationTracker;
