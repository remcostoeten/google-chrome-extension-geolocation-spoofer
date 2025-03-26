import React, { Suspense, lazy } from 'react';

const LocationTracker = lazy(() =>
  import('../modules/location-tracker/location-tracker')
);

const Index = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LocationTracker />
    </Suspense>
  );
};

export default Index;
