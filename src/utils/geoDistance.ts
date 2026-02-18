/**
 * Geo Distance Utility — Pure Haversine implementation.
 *
 * No external dependencies. No side effects.
 * Designed for client-side distance sorting of clinic lists.
 *
 * Future extensions:
 * - Radius filter (isWithinKm)
 * - Map clustering helpers
 * - Nearby-first feed scoring
 */

const EARTH_RADIUS_KM = 6371;

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate the great-circle distance between two points using the
 * Haversine formula.
 *
 * @returns Distance in kilometres, rounded to 1 decimal place.
 *          Returns Infinity if any coordinate is invalid.
 */
export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  if (
    !isFinite(lat1) || !isFinite(lng1) ||
    !isFinite(lat2) || !isFinite(lng2)
  ) {
    return Infinity;
  }

  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.asin(Math.sqrt(a));
  const km = EARTH_RADIUS_KM * c;

  return Math.round(km * 10) / 10; // 1 decimal
}

/**
 * Convenience overload accepting point objects.
 */
export function getDistanceBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  return getDistanceKm(a.lat, a.lng, b.lat, b.lng);
}

/**
 * Check whether a point is within a given radius.
 * Useful for future radius-filter UI.
 */
export function isWithinKm(
  center: { lat: number; lng: number },
  point: { lat: number; lng: number },
  radiusKm: number,
): boolean {
  return getDistanceBetween(center, point) <= radiusKm;
}
