import type { LatLng } from '../types';

/** Haversine distance between two WGS84 points, returns km */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDlat = Math.sin(dLat / 2);
  const sinDlng = Math.sin(dLng / 2);
  const h = sinDlat * sinDlat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDlng * sinDlng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Bearing from a → b in degrees (0=N, 90=E) */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/** Format a LatLng as a human-readable string */
export function formatLatLng(pos: LatLng, decimals = 5): string {
  const lat = pos.lat >= 0 ? `${pos.lat.toFixed(decimals)}°N` : `${Math.abs(pos.lat).toFixed(decimals)}°S`;
  const lng = pos.lng >= 0 ? `${pos.lng.toFixed(decimals)}°E` : `${Math.abs(pos.lng).toFixed(decimals)}°W`;
  return `${lat}, ${lng}`;
}

/** Mid-point between two positions */
export function midPoint(a: LatLng, b: LatLng): LatLng {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
}

/** Generate a point at given bearing (deg) and distance (km) from origin */
export function destPoint(origin: LatLng, bearingDegParam: number, distKm: number): LatLng {
  const R = 6371;
  const δ = distKm / R;
  const θ = toRad(bearingDegParam);
  const φ1 = toRad(origin.lat);
  const λ1 = toRad(origin.lng);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: φ2 * 180 / Math.PI, lng: λ2 * 180 / Math.PI };
}
