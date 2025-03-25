'use client'

import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  coords: {
    latitude: number;
    longitude: number;
  } | null;
  error: string | null;
  isLoading: boolean;
}

export const useGeolocationFetch = () => {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    isLoading: true,
  });

  const getLocation = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported',
        isLoading: false,
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
          isLoading: false,
        });
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    getLocation();
    
    // Retry once after 10s if location wasn't available
    const timeoutId = setTimeout(() => {
      if (!state.coords && !state.error) {
        getLocation();
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, []);

  return {
    ...state,
    retry: getLocation,
  };
};
