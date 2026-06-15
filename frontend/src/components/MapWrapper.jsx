import { GoogleMap, Marker, Polyline, DirectionsRenderer } from '@react-google-maps/api';

const DEFAULT_CENTER = { lat: 17.385, lng: 78.486 }; // Hyderabad

export function TrackingMap({ partnerLocation, pickupCoords, dropoffCoords, routePolyline }) {
  const center = partnerLocation || pickupCoords || DEFAULT_CENTER;

  const decodePath = (polyline) => {
    if (!window.google?.maps?.geometry) return [];
    return window.google.maps.geometry.encoding.decodePath(polyline);
  };

  return (
    <GoogleMap
      zoom={14}
      center={center}
      mapContainerClassName="w-full h-full"
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        styles: DARK_MAP_STYLE,
      }}
    >
      {pickupCoords && (
        <Marker position={pickupCoords}
          icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png' }}
        />
      )}
      {dropoffCoords && (
        <Marker position={dropoffCoords}
          icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
        />
      )}
      {partnerLocation && (
        <Marker position={partnerLocation}
          icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
        />
      )}
      {routePolyline && (
        <Polyline
          path={decodePath(routePolyline)}
          options={{ strokeColor: '#ff6b00', strokeWeight: 4, strokeOpacity: 0.8 }}
        />
      )}
    </GoogleMap>
  );
}

export function RouteMap({ pickup, dropoff, directions, onDirectionsLoad }) {
  return (
    <GoogleMap
      zoom={13}
      center={pickup || DEFAULT_CENTER}
      mapContainerClassName="w-full h-full"
      options={{ disableDefaultUI: true, zoomControl: true, styles: DARK_MAP_STYLE }}
    >
      {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
    </GoogleMap>
  );
}

export function SimpleMap({ center, zoom = 14, children }) {
  return (
    <GoogleMap
      zoom={zoom}
      center={center || DEFAULT_CENTER}
      mapContainerClassName="w-full h-full"
      options={{ disableDefaultUI: true, zoomControl: true, styles: DARK_MAP_STYLE }}
    >
      {children}
    </GoogleMap>
  );
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f0f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f0f' }] },
];