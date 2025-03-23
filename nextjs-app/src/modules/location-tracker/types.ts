
export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timestamp: number;
  status?: LocationStatus;
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
