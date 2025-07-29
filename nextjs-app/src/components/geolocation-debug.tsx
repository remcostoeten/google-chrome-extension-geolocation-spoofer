import { useState } from 'react';
import { Button } from '@/components/ui/button';

type TProps = {
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
};

function GeolocationDebug({ onLocationUpdate }: TProps) {
  const [status, setStatus] = useState<string>('Ready');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function testGeolocation() {
    setIsLoading(true);
    setStatus('Requesting location...');
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setStatus('Error');
      setIsLoading(false);
      return;
    }

    console.log('Testing geolocation API...');
    console.log('navigator.geolocation:', navigator.geolocation);
    console.log('getCurrentPosition method:', navigator.geolocation.getCurrentPosition);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Geolocation success:', position);
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        setLocation(newLocation);
        setStatus(`Location found: ${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}`);
        setIsLoading(false);
        
        if (onLocationUpdate) {
          onLocationUpdate(newLocation);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unknown geolocation error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setError(errorMessage);
        setStatus('Error');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  function checkPermissions() {
    if (!navigator.permissions) {
      setStatus('Permissions API not supported');
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      setStatus(`Permission status: ${result.state}`);
      console.log('Geolocation permission:', result.state);
    });
  }

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Geolocation Debug</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testGeolocation} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Getting Location...' : 'Test Geolocation'}
          </Button>
          
          <Button 
            onClick={checkPermissions}
            variant="outline"
          >
            Check Permissions
          </Button>
        </div>

        <div className="space-y-2">
          <div>
            <strong>Status:</strong> <span className={error ? 'text-red-500' : 'text-green-500'}>{status}</span>
          </div>
          
          {error && (
            <div className="text-red-500">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {location && (
            <div className="space-y-1">
              <div><strong>Latitude:</strong> {location.latitude.toFixed(6)}</div>
              <div><strong>Longitude:</strong> {location.longitude.toFixed(6)}</div>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p>This component tests the browser's geolocation API directly.</p>
          <p>If you have the extension enabled, it should return the overridden coordinates.</p>
        </div>
      </div>
    </div>
  );
}

export default GeolocationDebug;
