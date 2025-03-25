import React, { Suspense } from 'react';

const DarkMap = React.lazy(() => import('./components/dark-map'));

export default function App() {
  return (
    <Suspense fallback={<div className="h-[500px] bg-gray-900" />}>
      <DarkMap mapboxToken={import.meta.env.VITE_MAPBOX_TOKEN} />
    </Suspense>
  );
}
