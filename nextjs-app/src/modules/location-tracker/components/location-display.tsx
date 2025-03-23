
import React from 'react';
import { Location } from '../types';
import { formatCoordinates } from '../lib/geo-services';
import { format } from 'date-fns';
import { MapPin, Clock, Globe } from 'lucide-react';

interface LocationDisplayProps {
  location: Location;
  isLoading?: boolean;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ 
  location, 
  isLoading = false 
}) => {
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

  return (
    <div className="bg-card border border-border p-4 animate-fade-in">
      <div className="flex flex-col space-y-3">
        <div>
          <div className={`status-indicator ${location.status ? `status-${location.status}` : 'status-active'}`}>
            <span className="text-xs font-medium tracking-wider uppercase">
              {location.status === 'pending' ? 'Locating...' : 
               location.status === 'inactive' ? 'Inactive' : 'Active'}
            </span>
          </div>
          <h2 className="text-xl font-medium mt-1">
            {location.city || 'Unknown Location'}
            {location.country ? `, ${location.country}` : ''}
          </h2>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin size={16} className="mr-2" />
            <span>{formatCoordinates(location.latitude, location.longitude)}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock size={16} className="mr-2" />
            <span>{format(new Date(location.timestamp), 'MMM d, yyyy - h:mm:ss a')}</span>
          </div>
          
          {location.country && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Globe size={16} className="mr-2" />
              <span>{location.country}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationDisplay;
