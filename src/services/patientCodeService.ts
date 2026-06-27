import { db } from '@/firebaseConfig';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

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

/**
 * Regenerate a globally-unique patient code and persist it everywhere it must
 * be consistent: reserve the new code, update the patient doc's `code` field,
 * then release the old code. Ordering ensures the patient is never locked out
 * mid-operation; the old code stays valid until the patient doc is updated.
 * Returns the new code on success; throws on failure (after best-effort
 * rollback of the new-code reservation).
 */
export async function changePatientCode(
  clinicId: string,
  patientId: string,
  oldCode: string,
): Promise<string> {
  const newCode = await generateUniquePatientCode();

  await reservePatientCode(newCode, clinicId, patientId);

  try {
    await updateDoc(doc(db, 'clinics', clinicId, 'patients', patientId), { code: newCode });
  } catch (err) {
    try {
      await releasePatientCode(newCode);
    } catch (rollbackErr) {
      console.warn('[changePatientCode] failed to roll back new code', newCode, rollbackErr);
    }
    throw err;
  }

  if (oldCode && oldCode !== newCode) {
    try {
      await releasePatientCode(oldCode);
    } catch (cleanupErr) {
      console.warn('[changePatientCode] stale old code not released', oldCode, cleanupErr);
    }
  }

  return newCode;
}
