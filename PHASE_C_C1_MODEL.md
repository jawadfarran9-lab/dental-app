# PHASE C — C1: Public Clinics Directory Model & Rules

Date: 2025-12-15

## Collection: clinics_public
Public directory entries, strictly separated from private clinic/patient/session data.

Fields (safe only):
- clinicId: string (reference to private clinic doc ID; not auto-joined in client)
- ownerId: string (clinic owner UID; used for write authorization)
- name: string (clinic display name)
- country: string (ISO country or plain text)
- city: string
- address?: string
- phone?: string
- whatsapp?: string
- heroImage?: string (public, non-sensitive image URL)
- geo?: {
  - lat: number
  - lng: number
}
- isPublished: boolean (only when true is publicly readable)
- updatedAt: timestamp (server-side when published/changed)

## Security Rules
Updated at: `firebase/firestore.rules`

- Read: Allowed to ANYONE only when `isPublished == true`.
- Write: Owner-only. Requires `isOwner()` and `ownerId == request.auth.uid`.
- Safe-field validation enforced (types checked, no extra sensitive fields).
- No changes to existing private collections or auth flows.

## Ownership & Publishing
- Owner creates/updates `clinics_public/{publicId}` tied to their `clinicId`.
- Publish/unpublish toggled via `isPublished` boolean.
- `updatedAt` should be set server-side (to be implemented in subphase C4 via UI or Cloud Function).

## Next
Proceed to C2 (Clinics Explorer screen) after approval.
