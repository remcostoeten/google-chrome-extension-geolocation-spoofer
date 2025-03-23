
import { Location } from '../types';

// Storage key
const LOCATION_HISTORY_KEY = 'location-tracker-history';

// Function to save location history to localStorage
export const saveLocationHistory = (history: Location[]): void => {
  try {
    localStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save location history:', error);
  }
};

// Function to get location history from localStorage
export const getLocationHistory = (): Location[] => {
  try {
    const historyJson = localStorage.getItem(LOCATION_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Failed to retrieve location history:', error);
    return [];
  }
};

// Function to add a new location to history
export const addLocationToHistory = (location: Location): Location[] => {
  const history = getLocationHistory();
  const newHistory = [location, ...history].slice(0, 50); // Keep max 50 locations
  saveLocationHistory(newHistory);
  return newHistory;
};

// Function to clear location history
export const clearLocationHistory = (): void => {
  try {
    localStorage.removeItem(LOCATION_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear location history:', error);
  }
};

// Function to update a specific location in history
export const updateLocationInHistory = (updatedLocation: Location): Location[] => {
  const history = getLocationHistory();
  const newHistory = history.map(location => 
    location.id === updatedLocation.id ? updatedLocation : location
  );
  saveLocationHistory(newHistory);
  return newHistory;
};
