
import { GeocodingResult } from '../types';

// Function to get current position as a Promise
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
};

// Function to watch position and get updates
export const watchPosition = (
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error: GeolocationPositionError) => void
): () => void => {
  if (!navigator.geolocation) {
    onError({ code: 0, message: 'Geolocation is not supported', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
    return () => {};
  }
  
  const watchId = navigator.geolocation.watchPosition(
    onSuccess,
    onError,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
  
  return () => navigator.geolocation.clearWatch(watchId);
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
