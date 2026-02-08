# PHASE C — C4: Owner Settings UI (Public Profile)

Date: 2025-12-15

## Summary
- Owner-only settings screen at `app/clinic/public-profile.tsx` to manage `clinics_public` profile.
- Fields: display name, address, phone, WhatsApp, optional geo (lat/lng), hero image upload, publish toggle.
- Country/City are derived automatically from lat/lng (reverse geocode) and saved; no manual country/city inputs.
- Actions:
  - Upload hero to Storage (`public/clinics/{clinicId}/hero_*.jpg`) and store URL.
  - Save updates via Firestore `clinics_public/{clinicId}` with `ownerId` and `clinicId` preserved; `isPublished` toggle.
- Owner-only enforcement in UI; save requires OWNER role and owner UID.

## Data/Rules
- `clinics_public` rules updated: reads allowed for isPublished==true or owner; writes owner-only with safe fields.
- No changes to auth flows or private clinic/patient/session data.

## Navigation
- Screen ready for routing under clinic area; not wired to tabs/menus here.

## Files
- `app/clinic/public-profile.tsx`
- `src/services/publicClinics.ts` (added owner fetch helper)
- `firebase/firestore.rules` (owner read for clinics_public)

## Next
Paused; awaiting review. After approval, proceed to C5 (Near-me sorting / geohash).