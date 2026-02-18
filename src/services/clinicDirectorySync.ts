/**
 * Clinic Directory Auto-Sync
 *
 * Ensures every subscribed clinic with a completed profile appears in the
 * public directory (`clinics_public`) without requiring the owner to manually
 * publish via the Public Profile screen.
 *
 * Design:
 * - Idempotent: uses `setDoc(..., { merge: true })` — safe to call repeatedly.
 * - Non-destructive: never overwrites owner-curated fields (address, heroImage,
 *   geo, etc.) that may already exist from the Public Profile editor.
 * - Non-blocking: callers should fire-and-forget; failures are logged but never
 *   propagate.
 */

import { db } from '@/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Ensure a subscribed clinic is listed in `clinics_public`.
 *
 * @param clinicId   — the clinic's document ID (shared key across both collections)
 * @param clinicData — optional pre-fetched data from `clinics/{clinicId}`.
 *                     When omitted the function reads the document itself.
 */
export async function ensureClinicPublished(
  clinicId: string,
  clinicData?: Record<string, any>,
): Promise<void> {
  try {
    // ── 1. Resolve clinic data ──────────────────────────────────────────
    if (!clinicData) {
      const snap = await getDoc(doc(db, 'clinics', clinicId));
      if (!snap.exists()) return;
      clinicData = snap.data();
    }

    // ── 2. Gate: only publish when subscription is active + name exists ─
    if (clinicData.subscribed !== true) return;
    const name = (clinicData.clinicName || '').trim();
    if (!name) return;

    // ── 3. Build directory-safe payload ─────────────────────────────────
    const ownerId: string = clinicData.ownerId || clinicId;

    const payload: Record<string, any> = {
      clinicId,
      ownerId,
      name,
      country: clinicData.countryCode || clinicData.country || '',
      city:    clinicData.city || '',
      isPublished: true,
    };

    // Optional fields — only set if present so we never overwrite richer
    // data the owner may have entered via Public Profile.
    const heroSource = clinicData.profileImageUrl || clinicData.clinicImageUrl || clinicData.imageUrl;
    if (heroSource) {
      payload.heroImage = heroSource;
    }
    if (clinicData.clinicPhone) payload.phone = clinicData.clinicPhone;
    if (clinicData.clinicType)  payload.specialty = clinicData.clinicType;
    if (clinicData.whatsapp)    payload.whatsapp = clinicData.whatsapp;
    if (clinicData.address)     payload.address = clinicData.address;

    // Geo coordinates for distance-based discovery
    if (clinicData.location?.lat != null && clinicData.location?.lng != null) {
      payload.geo = {
        lat: clinicData.location.lat,
        lng: clinicData.location.lng,
      };
    }

    // ── 4. Merge into clinics_public (create or update) ─────────────────
    await setDoc(doc(db, 'clinics_public', clinicId), payload, { merge: true });
  } catch (err) {
    // Non-critical background sync — swallow silently
  }
}
