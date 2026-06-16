import axios from 'axios';

const MAPS_BASE = 'https://maps.googleapis.com/maps/api';
const KEY       = () => process.env.GOOGLE_MAPS_API_KEY;

// ─── Shared: normalise a coordinate pair to "lat,lng" string ─────────────────
const toLatLng = (point) => {
  if (point.coordinates) {
    return `${point.coordinates[1]},${point.coordinates[0]}`;
  }
  return `${point.lat},${point.lng}`;
};

const assertStatus = (status, apiName) => {
  if (status !== 'OK') {
    const err = new Error(`${apiName} error: ${status}`);
    err.mapsStatus = status;
    throw err;
  }
};

// ─── Fallback: Haversine formula when Google Maps API is unavailable ──────────
// Returns straight-line distance in km. Multiply by 1.3 to approximate road distance.
const haversineDistance = (point1, point2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;

  let lat1, lng1, lat2, lng2;

  if (point1.coordinates) {
    [lng1, lat1] = point1.coordinates;
  } else {
    lat1 = point1.lat; lng1 = point1.lng;
  }
  if (point2.coordinates) {
    [lng2, lat2] = point2.coordinates;
  } else {
    lat2 = point2.lat; lng2 = point2.lng;
  }

  const R    = 6371; // Earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const straightLine = R * c;
  // Road distance ≈ straight-line × 1.3 (urban approximation)
  const roadDistance = parseFloat((straightLine * 1.3).toFixed(2));
  // Assume 25 km/h average urban speed
  const durationMin  = Math.ceil((roadDistance / 25) * 60);

  return { distance: roadDistance, duration: durationMin };
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. calculateDistance — Directions API (with Haversine fallback)
// ─────────────────────────────────────────────────────────────────────────────
export const calculateDistance = async (pickup, dropoff) => {
  try {
    const { data } = await axios.get(`${MAPS_BASE}/directions/json`, {
      params: {
        origin:      toLatLng(pickup),
        destination: toLatLng(dropoff),
        mode:        'driving',
        key:         KEY(),
      },
      timeout: 8000,
    });

    assertStatus(data.status, 'Directions API');

    const leg = data.routes[0].legs[0];
    return {
      distance: parseFloat((leg.distance.value / 1000).toFixed(2)),
      duration: Math.ceil(leg.duration.value / 60),
      polyline: data.routes[0].overview_polyline.points,
    };
  } catch (err) {
    // ✅ FALLBACK: if Maps API fails (REQUEST_DENIED, quota, network), use Haversine
    console.warn('Directions API failed, using Haversine fallback:', err.message);
    const { distance, duration } = haversineDistance(pickup, dropoff);
    return { distance, duration, polyline: null };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. getDistanceMatrix — Distance Matrix API (with Haversine fallback)
// ─────────────────────────────────────────────────────────────────────────────
export const getDistanceMatrix = async (pickup, dropoff) => {
  try {
    const { data } = await axios.get(`${MAPS_BASE}/distancematrix/json`, {
      params: {
        origins:      toLatLng(pickup),
        destinations: toLatLng(dropoff),
        mode:         'driving',
        key:          KEY(),
      },
      timeout: 8000,
    });

    assertStatus(data.status, 'Distance Matrix API');

    const element = data.rows[0].elements[0];
    assertStatus(element.status, 'Distance Matrix element');

    return {
      distance: parseFloat((element.distance.value / 1000).toFixed(2)),
      duration: Math.ceil(element.duration.value / 60),
    };
  } catch (err) {
    // ✅ FALLBACK: Haversine when API is denied or unavailable
    console.warn('Distance Matrix API failed, using Haversine fallback:', err.message);
    return haversineDistance(pickup, dropoff);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. geocodeAddress — Geocoding API
// ─────────────────────────────────────────────────────────────────────────────
export const geocodeAddress = async (address) => {
  const { data } = await axios.get(`${MAPS_BASE}/geocode/json`, {
    params: { address, key: KEY() },
    timeout: 8000,
  });

  assertStatus(data.status, 'Geocoding API');

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;
  return { lat, lng, formattedAddress: result.formatted_address };
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. reverseGeocode — Reverse Geocoding API
// ─────────────────────────────────────────────────────────────────────────────
export const reverseGeocode = async (lat, lng) => {
  const { data } = await axios.get(`${MAPS_BASE}/geocode/json`, {
    params: { latlng: `${lat},${lng}`, key: KEY() },
    timeout: 8000,
  });

  assertStatus(data.status, 'Reverse Geocoding API');

  const result     = data.results[0];
  const components = result.address_components;
  const get        = (type) => components.find((c) => c.types.includes(type))?.long_name || '';

  return {
    formattedAddress: result.formatted_address,
    city:    get('locality') || get('administrative_area_level_2'),
    pincode: get('postal_code'),
  };
};