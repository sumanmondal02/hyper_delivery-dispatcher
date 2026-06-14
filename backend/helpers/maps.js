import axios from 'axios';

const MAPS_BASE = 'https://maps.googleapis.com/maps/api';
const KEY       = () => process.env.GOOGLE_MAPS_API_KEY;

// ─── Shared: normalise a coordinate pair to "lat,lng" string ─────────────────
// Accepts either { lat, lng } or { coordinates: [lng, lat] } (GeoJSON order)
const toLatLng = (point) => {
  if (point.coordinates) {
    // GeoJSON stores [longitude, latitude]
    return `${point.coordinates[1]},${point.coordinates[0]}`;
  }
  return `${point.lat},${point.lng}`;
};

// ─── Shared: validate Google Maps API response status ────────────────────────
const assertStatus = (status, apiName) => {
  if (status !== 'OK') {
    const err = new Error(`${apiName} error: ${status}`);
    err.mapsStatus = status; // Lets callers distinguish ZERO_RESULTS, etc.
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. calculateDistance — Directions API
//    Returns distance (km), duration (min), AND an encoded polyline.
//    Use this when you need the route drawn on a map (order tracking page).
//
//    @param pickup  — { lat, lng } OR { coordinates: [lng, lat] }
//    @param dropoff — { lat, lng } OR { coordinates: [lng, lat] }
//    @returns { distance: Number, duration: Number, polyline: String }
// ─────────────────────────────────────────────────────────────────────────────
export const calculateDistance = async (pickup, dropoff) => {
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
    distance: parseFloat((leg.distance.value / 1000).toFixed(2)), // metres → km
    duration: Math.ceil(leg.duration.value / 60),                  // seconds → min
    polyline: data.routes[0].overview_polyline.points,             // encoded polyline for frontend
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. getDistanceMatrix — Distance Matrix API
//    Lightweight: distance + duration only, no polyline.
//    Use this for fee calculation and partner matching (no map rendering needed).
//
//    @param pickup  — { lat, lng } OR { coordinates: [lng, lat] }
//    @param dropoff — { lat, lng } OR { coordinates: [lng, lat] }
//    @returns { distance: Number, duration: Number }
// ─────────────────────────────────────────────────────────────────────────────
export const getDistanceMatrix = async (pickup, dropoff) => {
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
    distance: parseFloat((element.distance.value / 1000).toFixed(2)), // km
    duration: Math.ceil(element.duration.value / 60),                  // min
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. geocodeAddress — Geocoding API
//    Converts a text address into { lat, lng } coordinates.
//    Use this when a customer types a delivery address manually
//    instead of picking a saved one.
//
//    @param address — plain string e.g. "123 MG Road, Bangalore"
//    @returns { lat: Number, lng: Number, formattedAddress: String }
// ─────────────────────────────────────────────────────────────────────────────
export const geocodeAddress = async (address) => {
  const { data } = await axios.get(`${MAPS_BASE}/geocode/json`, {
    params: {
      address,
      key: KEY(),
    },
    timeout: 8000,
  });

  assertStatus(data.status, 'Geocoding API');

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;

  return {
    lat,
    lng,
    formattedAddress: result.formatted_address,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. reverseGeocode — Geocoding API (reverse)
//    Converts { lat, lng } coordinates into a human-readable address string.
//    Use this when a partner shares GPS coordinates and you want
//    a readable address for display.
//
//    @param lat — latitude
//    @param lng — longitude
//    @returns { formattedAddress: String, city: String, pincode: String }
// ─────────────────────────────────────────────────────────────────────────────
export const reverseGeocode = async (lat, lng) => {
  const { data } = await axios.get(`${MAPS_BASE}/geocode/json`, {
    params: {
      latlng: `${lat},${lng}`,
      key:    KEY(),
    },
    timeout: 8000,
  });

  assertStatus(data.status, 'Reverse Geocoding API');

  const result = data.results[0];

  // Extract city and pincode from address components
  const components = result.address_components;

  const get = (type) =>
    components.find((c) => c.types.includes(type))?.long_name || '';

  return {
    formattedAddress: result.formatted_address,
    city:    get('locality') || get('administrative_area_level_2'),
    pincode: get('postal_code'),
  };
};