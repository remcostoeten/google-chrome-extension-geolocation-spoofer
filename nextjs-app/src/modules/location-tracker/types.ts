export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  status?: 'active' | 'inactive' | 'pending';
  city?: string;
  country?: string;
}
export type LocationStatus = 'active' | 'inactive' | 'pending';

export interface GeocodingResult {
  city?: string;
  country?: string;
  fullAddress?: string;
}

export interface MapStyles {
  [key: string]: string;
}

export interface MapOptions {
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  center: [number, number];
  style: string;
}
