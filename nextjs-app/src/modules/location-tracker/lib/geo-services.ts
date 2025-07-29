
import { GeocodingResult } from '../types';

// Function to get current position as a Promise
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    console.log('Requesting geolocation...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Geolocation success:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        resolve(position);
      },
      (error) => {
        console.error('Geolocation error:', {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.code === 1,
          POSITION_UNAVAILABLE: error.code === 2,
          TIMEOUT: error.code === 3
        });
        
        let errorMessage = 'Unknown location error';
        switch (error.code) {
          case 1:
            errorMessage = 'Location access denied by user';
            break;
          case 2:
            errorMessage = 'Location position unavailable';
            break;
          case 3:
            errorMessage = 'Location request timeout';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
};

// Function to watch position and get updates with debouncing
export const watchPosition = (
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error: GeolocationPositionError) => void
): () => void => {
  if (!navigator.geolocation) {
    onError({ 
      code: 0, 
      message: 'Geolocation is not supported by this browser', 
      PERMISSION_DENIED: 1, 
      POSITION_UNAVAILABLE: 2, 
      TIMEOUT: 3 
    } as GeolocationPositionError);
    return () => {};
  }
  
  let lastPosition: GeolocationPosition | null = null;
  let debounceTimeout: NodeJS.Timeout | null = null;
  
  const debouncedSuccess = (position: GeolocationPosition) => {
    // Clear any pending debounced calls
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Check if position has changed significantly
    if (lastPosition) {
      const distance = calculateDistance(
        lastPosition.coords.latitude,
        lastPosition.coords.longitude,
        position.coords.latitude,
        position.coords.longitude
      );
      
      // If change is very small (less than 5 meters), debounce the update
      if (distance < 0.005) {
        debounceTimeout = setTimeout(() => {
          lastPosition = position;
          onSuccess(position);
        }, 2000); // 2 second debounce
        return;
      }
    }
    
    lastPosition = position;
    onSuccess(position);
  };
  
  const enhancedError = (error: GeolocationPositionError) => {
    console.error('Geolocation watch error details:', {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    
    onError(error);
  };
  
  console.log('Starting geolocation watch with options:', {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000
  });
  
  const watchId = navigator.geolocation.watchPosition(
    debouncedSuccess,
    enhancedError,
    { 
      enableHighAccuracy: true, 
      timeout: 10000, // Reduced timeout
      maximumAge: 5000 // Allow cached positions up to 5 seconds old
    }
  );
  
  return () => {
    console.log('Clearing geolocation watch:', watchId);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    navigator.geolocation.clearWatch(watchId);
  };
};

// Function to reverse geocode coordinates (get city, country from lat/lng)
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  mapboxToken: string
): Promise<GeocodingResult> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=place,country`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      return {};
    }
    
    const result: GeocodingResult = {
      fullAddress: data.features[0]?.place_name || '',
    };
    
    // Extract city and country
    data.features.forEach((feature: any) => {
      if (feature.place_type.includes('place')) {
        result.city = feature.text;
      }
      if (feature.place_type.includes('country')) {
        result.country = feature.text;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error during reverse geocoding:', error);
    return {};
  }
};

// Format coordinates to a readable string
export const formatCoordinates = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};

// Calculate distance between two points
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

// Convert degrees to radians
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
