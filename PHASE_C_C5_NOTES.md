# PHASE C — C5: Near Me Sorting (Geohash/Safe Alternative)

Date: 2025-12-15

## Summary
- Added geohash support for `clinics_public` to enable efficient near-me sorting without breaking Firestore querying.
- Client still respects optional location; falls back gracefully when denied.

## Changes
- `firebase/firestore.rules`: Allowed `geohash` string in `clinics_public` safe fields; public reads still `isPublished == true`; owner read/write unchanged.
- `src/utils/geohash.ts`: Minimal geohash encoder (default precision 5; we use 7 for finer buckets) to avoid extra deps.
- `app/clinic/public-profile.tsx`: On save, derives geohash when lat/lng provided; stores alongside geo, city, country.
- `src/services/publicClinics.ts`: Added `geohash` to model + `ensureGeohash()` helper; owner fetch unchanged.
- `app/public/clinics.tsx`: Ensures fetched clinics have geohash populated client-side (via ensureGeohash) while keeping existing near-me distance sorting.

## Behavior
- Near-me sorting remains client-side distance-based when location is available; geohash now stored for future queryable sorting while keeping current UX intact.
- No impact when location is denied/unavailable; falls back to prior ordering.
- Privacy: location remains in-memory only.

## Next
Paused after C5; ready for review before proceeding to C6 (QA + docs).
