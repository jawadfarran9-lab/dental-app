# PHASE C — Clinics Discovery (Public Directory)

Date: 2025-12-15

## Scope Recap
- Public clinics directory fully separated from patients/sessions/auth.
- Public data stored in `clinics_public`; only `isPublished == true` visible to unauthenticated users.
- Owners can edit/publish their public profile; no changes to private clinic data or auth flows.
- Optional location for near-me; no location persistence.

## Deliverables
- C1 Data Model & Rules
  - Collection: `clinics_public` with safe fields (name, heroImage, phone, whatsapp, address, geo, geohash, country, city, isPublished, ownerId, clinicId, updatedAt).
  - Rules: Public read only when `isPublished == true`; owner read/write; safe-field validation; geohash allowed.
- C2 Clinics Explorer (Public, No Auth)
  - Screen: `app/public/clinics.tsx`.
  - Features: stories-style horizontal list, search (name + derived city), derived country filter chips, optional near-me with toggle and distance display, location fallback safe.
- C3 Clinic Profile (Public)
  - Screen: `app/public/clinic/[publicId].tsx`.
  - Hero with fallback; name, derived city/country, address; Call/WhatsApp/Maps buttons (when available).
  - Navigation from explorer stories items.
- C4 Owner Settings UI
  - Screen: `app/clinic/public-profile.tsx` (owner-only guard).
  - Edit fields + hero upload; geo input; auto-derive city/country; publish toggle; writes to `clinics_public/{clinicId}`.
- C5 Near Me Sorting (Geohash)
  - Geohash encoder: `src/utils/geohash.ts`; stored on save; allowed in rules.
  - `public` explorer ensures geohash present client-side; near-me sorting remains distance-based with graceful fallback.

## Files Changed (high level)
- `firebase/firestore.rules`
- `app/public/clinics.tsx`
- `app/public/clinic/[publicId].tsx`
- `app/clinic/public-profile.tsx`
- `src/services/publicClinics.ts`
- `src/utils/geohash.ts`
- Phase notes: `PHASE_C_C1_MODEL.md`, `PHASE_C_C2_NOTES.md`, `PHASE_C_C3_NOTES.md`, `PHASE_C_C4_NOTES.md`, `PHASE_C_C5_NOTES.md`, `PHASE_C_COMPLETE.md`

## QA Checklist
- Public read restrictions: Only `isPublished == true` visible publicly; owners can read unpublished. ✅
- Owner writes: Allowed with safe fields; geohash permitted. ✅
- Explorer: Public access, search/filter works; near-me toggle on after permission; distance shown when available; fallback ordering when denied. ✅
- Profile: Public view loads published clinic; actions gated by available data; navigation from explorer works. ✅
- Owner settings: Owner-only UI; saves hero, contact, geo, publish state; derives city/country and geohash; respects rules. ✅
- Privacy: No location persistence; public data isolated from patients/sessions/auth. ✅

## Notes
- No backend/auth/patient/session model changes beyond `clinics_public` public data and geohash addition.
- Location remains optional; app behavior unaffected when denied.

Status: PHASE C completed. Ready for final review.
