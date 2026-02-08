# PHASE D — D1: Clinics Stories (UI Only)

Date: 2025-12-15

## Summary
- Implemented public Clinics Stories screen (Instagram-style horizontal list) at `app/public/stories.tsx`.
- Uses `clinics_public` data (`isPublished == true`), with hero image covers, name, derived city, and distance when location is available.
- Tapping a story opens the public clinic profile.
- Optional location: dynamic `expo-location` require; nearest-first when granted; graceful fallback when denied.
- RTL/i18n supported for labels.

## Files
- `app/public/stories.tsx`

## Constraints Respected
- No backend/auth/patient/session changes.
- Public data only from `clinics_public`; public reads unaffected.
- Location is in-memory only; works when permission denied.

Status: D1 implemented. Paused for review.
