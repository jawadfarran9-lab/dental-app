# PHASE C — C3: Clinic Profile Screen

Date: 2025-12-15

## Summary
- Public clinic profile screen at `app/public/clinic/[publicId].tsx` (unauthenticated).
- Data source: `clinics_public` only; enforces `isPublished == true` via `fetchPublishedClinic`.
- Hero image (with placeholder fallback), clinic name, derived city/country, address.
- Actions: Call (tel), WhatsApp deeplink, Maps link (lat/lng to Google Maps). Buttons render only if data exists.
- Derivations: City/country from `geo` via reverse geocoding (Nominatim).
- Navigation: Explorer stories items now open the profile (router push).

## Files
- `app/public/clinic/[publicId].tsx`
- `app/public/clinics.tsx` (added navigation)
- `src/services/publicClinics.ts` (added `fetchPublishedClinic` helper)

## Privacy & Constraints
- No auth required; reads only published public docs.
- No location is stored; only used transiently for near-me sorting from C2.
- No changes to private clinic/patient/session models.

## Next
Paused; awaiting approval to proceed to C4 (Owner settings UI).
