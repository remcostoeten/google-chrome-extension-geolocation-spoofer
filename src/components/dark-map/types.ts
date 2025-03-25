export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  description?: string;
}

export interface MapProps {
  locations?: Location[];
  mapboxToken: string;
}
