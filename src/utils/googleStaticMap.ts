/**
 * Google Static Maps URL builder.
 *
 * Generates a deterministic URL for a given lat/lng so
 * React Native <Image> can cache it properly.
 */

// Same key used elsewhere in the app (story/location-list.tsx)
const DEFAULT_API_KEY = 'AIzaSyB7aLO_UubjP3vw3xwc7xHb6mgGsQy5kWs';

export interface StaticMapOptions {
  lat: number;
  lng: number;
  /** Zoom level 1-20 (default 15) */
  zoom?: number;
  /** Image width in CSS pixels (default 400) */
  width?: number;
  /** Image height in CSS pixels (default 200) */
  height?: number;
  /** Retina scale factor 1 | 2 (default 2) */
  scale?: 1 | 2;
  /** Optional API key override */
  apiKey?: string;
}

/**
 * Returns a stable Google Static Maps image URL.
 * The URL includes a single red marker at the center point.
 *
 * Returns `null` if lat/lng are invalid (0,0 or NaN).
 */
export function getStaticMapUrl(opts: StaticMapOptions): string | null {
  const {
    lat,
    lng,
    zoom = 15,
    width = 400,
    height = 200,
    scale = 2,
    apiKey = DEFAULT_API_KEY,
  } = opts;

  if (!apiKey || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return null;
  }

  const center = `${lat},${lng}`;

  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${center}` +
    `&zoom=${zoom}` +
    `&size=${width}x${height}` +
    `&scale=${scale}` +
    `&maptype=roadmap` +
    `&markers=color:red%7C${center}` +
    `&key=${apiKey}`
  );
}
