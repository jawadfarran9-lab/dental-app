# PHASE C — C2: Clinics Explorer (Public)

Date: 2025-12-15

## Summary
- Public, unauthenticated explorer screen at `app/public/clinics.tsx`.
- Data source: `clinics_public` only; filters/read respect `isPublished == true`.
- UI: Instagram-style horizontal stories row (equal-size circular images), clinic name below, optional derived city.
- Search: Name + derived city matches.
- Filters: Derived `countryCode` chips (from reverse geocode of `geo`).
- Near Me: Optional device location; works if denied (no crash, no dependency). When granted, default ordering is nearest-first with a visible toggle (on after permission). If denied/unavailable, falls back to original ordering.
- Distance: When location + geo available, shows approximate distance (km) next to clinic item.

## Derivations
- City & countryCode derived client-side via OpenStreetMap Nominatim reverse geocoding from `geo.lat/lng`.
- If geocode fails/missing, clinic still appears without city/country filters.

## Files
- `app/public/clinics.tsx` — explorer UI
- `src/services/publicClinics.ts` — Firestore fetch + reverse geocoding + distance

## Notes
- `expo-location` is optional: dynamically required; if not installed or permission denied, the screen continues to work (Near Me disabled).
- No changes to private clinic/patient/session models or auth.
- Location is in-memory only; not stored.

## Next
Await approval to proceed to C3 (Clinic Profile screen).
