/**
 * Google Maps Directions API service.
 *
 * - Reads API key from EXPO_PUBLIC_GOOGLE_MAPS_API_KEY env variable.
 * - Never logs or exposes the key.
 * - Includes in-memory cache + request deduplication.
 */

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const DIRECTIONS_BASE = 'https://maps.googleapis.com/maps/api/directions/json';

export type DirectionsResult = {
  distanceText: string;   // e.g. "35.7 km"
  durationText: string;   // e.g. "43 mins"
  durationMinutes: number;
};

// ─── In-memory cache (cleared when process restarts) ───
const cache = new Map<string, { data: DirectionsResult; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(oLat: number, oLng: number, dLat: number, dLng: number) {
  return `${oLat.toFixed(4)},${oLng.toFixed(4)}->${dLat.toFixed(4)},${dLng.toFixed(4)}`;
}

// ─── Deduplication: in-flight requests ───
const inflight = new Map<string, Promise<DirectionsResult | null>>();

/**
 * Fetch driving distance & duration from Google Directions API.
 *
 * Returns `null` on error or missing API key so callers can gracefully
 * fall back to the Haversine estimation.
 */
export async function getDrivingDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<DirectionsResult | null> {
  if (!API_KEY) return null;

  const key = cacheKey(originLat, originLng, destLat, destLng);

  // Check cache
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  // Deduplicate concurrent requests for the same route
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = fetchDirections(originLat, originLng, destLat, destLng, key);
  inflight.set(key, promise);

  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

async function fetchDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  key: string,
): Promise<DirectionsResult | null> {
  try {
    const url =
      `${DIRECTIONS_BASE}?origin=${originLat},${originLng}` +
      `&destination=${destLat},${destLng}` +
      `&mode=driving` +
      `&key=${API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    if (json.status !== 'OK' || !json.routes?.length) return null;

    const leg = json.routes[0].legs?.[0];
    if (!leg) return null;

    const result: DirectionsResult = {
      distanceText: leg.distance?.text ?? '',
      durationText: leg.duration?.text ?? '',
      durationMinutes: Math.round((leg.duration?.value ?? 0) / 60),
    };

    cache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch {
    return null;
  }
}
