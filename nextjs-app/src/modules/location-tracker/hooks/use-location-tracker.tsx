
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Location, 
  LocationStatus, 
  GeocodingResult 
} from '../types';
import { 
  getCurrentPosition, 
  watchPosition, 
  reverseGeocode 
} from '../lib/geo-services';
import { 
  getLocationHistory, 
  addLocationToHistory, 
  updateLocationInHistory,
  clearLocationHistory 
} from '../lib/history-storage';
import { toast } from '@/components/ui/use-toast';

interface UseLocationTrackerOptions {
  mapboxToken: string;
  autoStart?: boolean;
}

const useLocationTracker = ({ mapboxToken, autoStart = true }: UseLocationTrackerOptions) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | undefined>();
  const [status, setStatus] = useState<LocationStatus>('pending');
  const [isWatching, setIsWatching] = useState(autoStart);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load location history on init
  useEffect(() => {
    const savedLocations = getLocationHistory();
    if (savedLocations.length > 0) {
      setLocations(savedLocations);
    }
    
    if (autoStart) {
      startTracking();
    } else {
      setIsLoading(false);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to get current position and reverse geocode
  const updateCurrentPosition = useCallback(async () => {
    try {
      setStatus('pending');
      setError(null);
      
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get city and country
      let geocodingResult: GeocodingResult = {};
      
      try {
        geocodingResult = await reverseGeocode(latitude, longitude, mapboxToken);
      } catch (geocodeError) {
        console.error('Error during geocoding:', geocodeError);
      }
      
      // Create location object
      const newLocation: Location = {
        id: uuidv4(),
        latitude,
        longitude,
        city: geocodingResult.city,
        country: geocodingResult.country,
        timestamp: Date.now().toString(),
        status: 'active',
      };
      if (newLocation === currentLocation) {
        return newLocation;
      } else {
        setCurrentLocation(newLocation);
}      // Update current location
      
      // Add to history
      const updatedLocations = addLocationToHistory(newLocation);
      setLocations(updatedLocations);
      setStatus('active');
      setIsLoading(false);
      
      return newLocation;
      
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
  }, [mapboxToken]);

  // Start location tracking
  const startTracking = useCallback(async () => {
    setIsLoading(true);
    setIsWatching(true);
    
    try {
      await updateCurrentPosition();
      
      // Set up continuous watching
      const clearWatch = watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get city and country
          let geocodingResult: GeocodingResult = {};
          
          try {
            geocodingResult = await reverseGeocode(latitude, longitude, mapboxToken);
          } catch (geocodeError) {
            console.error('Error during geocoding:', geocodeError);
          }
          
          // Create location object
          const newLocation: Location = {
            id: uuidv4(),
            latitude,
            longitude,
            city: geocodingResult.city,
            country: geocodingResult.country,
            timestamp: Date.now(),
            status: 'active',
          };
          
          // Update current location
          setCurrentLocation(newLocation);
          
          // Add to history
          const updatedLocations = addLocationToHistory(newLocation);
          setLocations(updatedLocations);
          setStatus('active');
        },
        (error) => {
          const errorMessage = error.message || 'Unknown error occurred while watching location';
          setError(errorMessage);
          setStatus('inactive');
          
          toast({
            variant: "destructive",
            title: "Location Error",
            description: errorMessage,
          });
        }
      );
      
      return () => {
        clearWatch();
        setIsWatching(false);
      };
    } catch (error) {
      setIsWatching(false);
      setIsLoading(false);
      return () => {};
    }
  }, [mapboxToken, updateCurrentPosition]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    setIsWatching(false);
    
    // If we have a current location, update its status
    if (currentLocation) {
      const updatedLocation = {
        ...currentLocation,
        status: 'inactive' as LocationStatus,
      };
      
      setCurrentLocation(updatedLocation);
      
      // Update in history
      const updatedLocations = updateLocationInHistory(updatedLocation);
      setLocations(updatedLocations);
    }
  }, [currentLocation]);

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

  return {
    locations,
    currentLocation,
    isLoading,
    status,
    error,
    isWatching,
    startTracking,
    stopTracking,
    updateCurrentPosition,
    clearHistory,
    selectLocation,
  };
};

export default useLocationTracker;
