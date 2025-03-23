
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MapboxTokenInputProps {
  onTokenSubmit: (token: string) => void;
}

// Default token to use if user doesn't enter their own
const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoicmVtY29zdG9ldGVuIiwiYSI6ImNtNDM2NzhleDA4c2MybHF4bGRhYXU2bjUifQ.sjFSU2RR7pYPXPhRX_dveQ';

const MapboxTokenInput: React.FC<MapboxTokenInputProps> = ({ onTokenSubmit }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If empty token, use the default token
    if (!token.trim()) {
      onTokenSubmit(DEFAULT_MAPBOX_TOKEN);
      return;
    }
    
    if (!token.startsWith('pk.')) {
      setError('Please enter a valid public Mapbox access token (starts with "pk.")');
      return;
    }
    
    onTokenSubmit(token);
    setError('');
  };

  const useDefaultToken = () => {
    onTokenSubmit(DEFAULT_MAPBOX_TOKEN);
  };

  return (
    <div className="bg-card border border-border p-6 max-w-md mx-auto animate-fade-in">
      <h2 className="text-xl font-medium mb-2">Enter Mapbox Access Token</h2>
      <p className="text-muted-foreground text-sm mb-4">
        A Mapbox token is required to display maps. You can get a free token by signing up at{' '}
        <a 
          href="https://mapbox.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-accent underline hover:text-accent/80"
        >
          mapbox.com
        </a>
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="pk.eyJ1Ijoi..."
            className="bg-background border-border transition-all duration-300"
          />
          {error && <p className="text-destructive text-sm mt-1">{error}</p>}
          <p className="text-xs text-muted-foreground mt-2">
            Your token will be stored in your browser's local storage.
          </p>
        </div>
        
        <div className="space-y-2">
          <Button type="submit" className="w-full bg-accent text-black hover:bg-accent/90 transition-all duration-300">
            Save Token
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-border hover:bg-secondary/80 transition-all duration-300"
            onClick={useDefaultToken}
          >
            Use Default Token
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MapboxTokenInput;
