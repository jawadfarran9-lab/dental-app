import { functions } from '@/firebaseConfig';
import { httpsCallable } from 'firebase/functions';

/**
 * Reserve a globally-unique patient code server-side (Cloud Function).
 * New patient: pass patientId only.
 * Change an existing patient's code: also pass releaseCode (the old code) — the
 * function atomically reserves the new code, updates the patient doc's `code`,
 * and deletes the old code. Returns the new code.
 */
export async function reservePatientCode(patientId: string, releaseCode?: string): Promise<string> {
  const res: any = await httpsCallable(functions, 'reservePatientCode')({
    patientId,
    releaseCode: releaseCode ?? null,
  });
  return res.data.code as string;
}
