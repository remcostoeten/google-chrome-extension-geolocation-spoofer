
import React from 'react';
import { Location } from '../types';
import { formatCoordinates } from '../lib/geo-services';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface HistoryListProps {
  locations: Location[];
  onSelect: (location: Location) => void;
  onClear: () => void;
  isLoading?: boolean;
}

const HistoryList: React.FC<HistoryListProps> = ({ 
  locations, 
  onSelect, 
  onClear,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-card border border-border p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded w-8"></div>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border border-border bg-secondary/30 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full mb-1"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="bg-card border border-border p-4">
        <h3 className="font-medium mb-4">Location History</h3>
        <div className="p-3 border border-border bg-secondary/30 text-center text-sm text-muted-foreground">
          No location history available.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Location History</h3>
        <button 
          onClick={onClear}
          className="p-2 hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
          title="Clear history"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-none pr-1">
        {locations.map((location) => (
          <div 
            key={location.id}
            onClick={() => onSelect(location)}
            className="p-3 border border-border bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="font-medium text-sm">
                {location.city || 'Unknown Location'}
              </div>
              <div className={`status-indicator ${location.status ? `status-${location.status}` : 'status-inactive'} text-xs`}>
                <span className="text-xs tracking-wider uppercase">
                  {location.status || 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="text-muted-foreground text-xs mt-1">
              {formatCoordinates(location.latitude, location.longitude)}
            </div>
            
            <div className="text-muted-foreground text-xs mt-1">
              {format(new Date(location.timestamp), 'MMM d, yyyy - h:mm a')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
