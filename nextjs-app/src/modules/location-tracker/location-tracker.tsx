import React, { Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { PauseCircle, PlayCircle, RefreshCw } from 'lucide-react';
import Footer from '@/components/footer-component';
import useLocationTracker from './hooks/use-location-tracker';

// Lazy load components
const LazyDarkMap = lazy(() => import('./components/dark-map'));
const LazyLocationDisplay = lazy(() => import('./components/location-display'));
const LazyHistoryList = lazy(() => import('./components/history-list'));

// Always use this token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const LocationTracker: React.FC = () => {
  return <LocationTrackerContent mapboxToken={MAPBOX_TOKEN} />;
};

interface LocationTrackerContentProps {
  mapboxToken: string;
}

const LocationTrackerContent: React.FC<LocationTrackerContentProps> = ({ mapboxToken }) => {
  const {
    locations,
    currentLocation,
    isLoading,
    status,
    isWatching,
    startTracking,
    stopTracking,
    updateCurrentPosition,
    clearHistory,
    selectLocation,
  } = useLocationTracker({ mapboxToken, autoStart: true });

  const handleToggleTracking = () => {
    if (isWatching) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const handleRefresh = () => {
    updateCurrentPosition();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold mb-2">Location Tracker</h1>
          <p className="text-muted-foreground">
            Track and visualize your current and historical locations
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {/* Map Container */}
            <Suspense fallback={<div className="h-[500px] animate-pulse bg-muted" />}>
              <LazyDarkMap
                locations={locations}
                currentLocation={currentLocation}
                mapboxToken={mapboxToken}
              />
            </Suspense>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleToggleTracking}
                className="flex-1 border-border hover:bg-secondary/80 transition-all duration-300"
              >
                {isWatching ? (
                  <>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Stop Tracking
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Tracking
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleRefresh}
                className="border-border hover:bg-secondary/80 transition-all duration-300"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="ml-2">Refresh</span>
              </Button>
            </div>
          </div>

          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {/* Current Location */}
        

            <Suspense fallback={<div className="bg-card border border-border p-4 animate-pulse" />}>
              <LazyHistoryList
                locations={locations}
                onSelect={selectLocation}
                onClear={clearHistory}
                isLoading={isLoading && locations.length === 0}
              />
            </Suspense>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LocationTracker;
