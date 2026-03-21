/**
 * Clinic Profile Media Service
 *
 * CRUD for clinic profile media grid items.
 * Collection: clinics/{clinicId}/media
 */
import { db } from '@/firebaseConfig';
import { ClinicMedia } from '@/src/types/clinicMedia';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
} from 'firebase/firestore';

/** Reference helper */
const mediaCol = (clinicId: string) =>
  collection(db, `clinics/${clinicId}/media`);

function normalizeTimestamp(val: unknown): number {
  if (typeof val === 'number') return val;
  if (val && typeof (val as any).toMillis === 'function') return (val as any).toMillis();
  return 0;
}

/**
 * Fetch all media for a clinic, sorted newest-first.
 */
export async function fetchClinicMedia(clinicId: string): Promise<ClinicMedia[]> {
  try {
    const q = query(mediaCol(clinicId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const raw = d.data();
      return { ...raw, id: d.id, createdAt: normalizeTimestamp(raw.createdAt) } as ClinicMedia;
    });
  } catch (error) {
    console.error('[CLINIC_MEDIA] Error fetching media:', error);
    return [];
  }
}

/**
 * Fetch a single media item by ID.
 */
export async function fetchClinicMediaById(
  clinicId: string,
  mediaId: string,
): Promise<ClinicMedia | null> {
  try {
    const ref = doc(db, `clinics/${clinicId}/media`, mediaId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const raw = snap.data();
    return { ...raw, id: snap.id, createdAt: normalizeTimestamp(raw.createdAt) } as ClinicMedia;
  } catch (error) {
    console.error('[CLINIC_MEDIA] Error fetching media by id:', error);
    return null;
  }
}
