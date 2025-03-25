import mapboxgl from 'mapbox-gl';
import type { Location } from './types';
import { throttle } from 'lodash-es';

export const createMapMarker = (map: mapboxgl.Map, location: Location) => {
  const el = document.createElement('div');
  el.className = 'marker';

  new mapboxgl.Marker(el)
    .setLngLat([location.longitude, location.latitude])
    .setPopup(
      new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<h3>${location.name}</h3><p>${location.description}</p>`)
    )
    .addTo(map);
};

export const setupMapControls = (map: mapboxgl.Map) => {
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true
    }),
    'top-right'
  );
};

export const throttledMapUpdate = throttle((map: mapboxgl.Map) => {
  map.triggerRepaint();
}, 16); // ~60fps
