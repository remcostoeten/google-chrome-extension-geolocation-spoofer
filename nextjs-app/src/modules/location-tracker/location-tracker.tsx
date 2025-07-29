import React, { Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import Footer from '@/components/footer-component';
import useLocationTracker from './hooks/use-location-tracker';
import GeolocationDebug from '@/components/geolocation-debug';
import ErrorBoundary from '@/components/error-boundary';
import { IntroSection } from './components/intro-section';
import { InstallationGuide } from './components/installation-guide';

// Lazy load components
const LazyDarkMap = lazy(() => import('./components/dark-map'));
const LazyLocationDisplay = lazy(() => import('./components/location-display'));
const LazyHistoryList = lazy(() => import('./components/history-list'));

// Always use this token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Debug logging for token
console.log('Environment variables:', {
  VITE_MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN,
  tokenLength: MAPBOX_TOKEN.length,
  hasToken: !!MAPBOX_TOKEN && MAPBOX_TOKEN !== '',
});

function LocationTracker() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('LocationTracker crashed:', error, errorInfo);
      }}
    >
      <LocationTrackerContent mapboxToken={MAPBOX_TOKEN} />
    </ErrorBoundary>
  );
}

interface LocationTrackerContentProps {
  mapboxToken: string;
}

function LocationTrackerContent({ mapboxToken }: LocationTrackerContentProps) {
  const {
    locations,
    currentLocation,
    isLoading,
    status,
    error,
    isWatching,
    retryCount,
    updateCurrentPosition,
    clearHistory,
    selectLocation,
    toggleWatching,
  } = useLocationTracker({ mapboxToken, autoStart: true, watchLocation: true });

  function handleRefresh() {
    updateCurrentPosition();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-6 animate-fade-in">
    </header>

        <div className="animate-fade-in mb-6">
          <IntroSection />
        </div>

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
            <div className="flex gap-4 flex-wrap">
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="border-border hover:bg-secondary/80 transition-all duration-300"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="ml-2">Get Current Location</span>
              </Button>
              
              <Button
                variant={isWatching ? "default" : "outline"}
                onClick={toggleWatching}
                className="border-border hover:bg-secondary/80 transition-all duration-300"
                disabled={isLoading}
              >
                {isWatching ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span className="ml-2">
                  {isWatching ? 'Stop Watching' : 'Start Watching'}
                  {retryCount > 0 && ` (${retryCount})`}
                </span>
              </Button>
            </div>
            
            {/* Status Information */}
            {(error || isWatching) && (
              <div className="bg-card border border-border p-3 rounded-md">
                {isWatching && (
                  <div className="text-sm text-green-600 mb-1">
                    📡 Actively watching for location changes
                    {retryCount > 0 && ` (retry attempt: ${retryCount})`}
                  </div>
                )}
                {error && (
                  <div className="text-sm text-destructive">
                    ⚠️ {error}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {/* Debug Component */}
            <GeolocationDebug onLocationUpdate={(location) => {
              console.log('Debug location update:', location);
            }} />
            
            {/* Current Location */}
            <Suspense fallback={<div className="bg-card border border-border p-4 animate-pulse" />}>
              {currentLocation ? (
                <LazyLocationDisplay
                  location={currentLocation}
                  isLoading={isLoading}
                />
              ) : (
                <div className="bg-card border border-border p-4 text-center">
                  <p className="text-muted-foreground">No location data available</p>
                </div>
              )}
            </Suspense>

            {/* Location History */}
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
        
        {/* Installation Guide */}
        <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <InstallationGuide />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LocationTracker;
