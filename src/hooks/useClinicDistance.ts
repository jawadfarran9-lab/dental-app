import { getDrivingDistance } from '@/src/services/googleMapsService';
import { getDistanceBetween } from '@/src/utils/geoDistance';
import { useEffect, useState } from 'react';

type Coord = { lat: number; lng: number };

interface ClinicDistanceResult {
  /** Haversine straight-line distance in km (available immediately). */
  distanceKm: number | null;
  /** Human-readable distance label — Google driving text when available, formatted Haversine otherwise. */
  distanceText: string | null;
  /** Google Directions drive duration in minutes (null until resolved). */
  durationMinutes: number | null;
}

/**
 * Shared hook that unifies the Haversine → Google Directions upgrade pattern.
 *
 * 1. Computes Haversine distance synchronously (immediate render).
 * 2. Fires an async Google Directions request.
 * 3. When the response arrives, upgrades `distanceText` to the driving distance.
 * 4. Properly cancels stale requests on dep change / unmount.
 */
export function useClinicDistance(
  userLocation: Coord | null,
  clinicGeo: Coord | null,
): ClinicDistanceResult {
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [distanceText, setDistanceText] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!userLocation || !clinicGeo?.lat || !clinicGeo?.lng) {
      setDistanceKm(null);
      setDistanceText(null);
      setDurationMinutes(null);
      return;
    }

    let cancelled = false;

    // 1. Immediate Haversine
    const km = getDistanceBetween(userLocation, clinicGeo);
    if (isFinite(km)) {
      setDistanceKm(km);
      setDistanceText(km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
    } else {
      setDistanceKm(null);
      setDistanceText(null);
    }

    // 2. Async Google Directions upgrade
    getDrivingDistance(
      userLocation.lat,
      userLocation.lng,
      clinicGeo.lat,
      clinicGeo.lng,
    ).then((result) => {
      if (cancelled || !result?.distanceText) return;
      setDistanceText(result.distanceText);
      setDurationMinutes(result.durationMinutes);
    });

    return () => {
      cancelled = true;
    };
  }, [userLocation?.lat, userLocation?.lng, clinicGeo?.lat, clinicGeo?.lng]);

  return { distanceKm, distanceText, durationMinutes };
}
