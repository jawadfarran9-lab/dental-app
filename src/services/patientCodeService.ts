import { db } from '@/firebaseConfig';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

const MAX_ATTEMPTS = 10;

/**
 * Generate a 6-digit numeric code not already present in patientCodes.
 * Retries up to MAX_ATTEMPTS times before throwing.
 */
export async function generateUniquePatientCode(): Promise<string> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    const snap = await getDoc(doc(db, 'patientCodes', candidate));
    if (!snap.exists()) return candidate;
  }
  throw new Error(
    'patientCodeService: could not generate a unique code after 10 attempts',
  );
}

/**
 * Reserve patientCodes/{code} -> { clinicId, patientId, createdAt }.
 * Throws if the code is already reserved (race-condition guard).
 */
export async function reservePatientCode(
  code: string,
  clinicId: string,
  patientId: string,
): Promise<void> {
  const ref = doc(db, 'patientCodes', code);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error(`patientCodeService: code ${code} already reserved`);
  }
  await setDoc(ref, { clinicId, patientId, createdAt: serverTimestamp() });
}

/**
 * Look up patientCodes/{code}. Returns { clinicId, patientId } or null.
 */
export async function lookupPatientByCode(
  code: string,
): Promise<{ clinicId: string; patientId: string } | null> {
  const snap = await getDoc(doc(db, 'patientCodes', code));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { clinicId: data.clinicId, patientId: data.patientId };
}

/**
 * Delete patientCodes/{code}. For future edit/delete patient flows.
 */
export async function releasePatientCode(code: string): Promise<void> {
  await deleteDoc(doc(db, 'patientCodes', code));
}
