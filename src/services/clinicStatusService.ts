import { db } from '@/firebaseConfig';
import { WeeklySchedule } from '@/src/types/clinicSchedule';
import { getClinicOpenStatus } from '@/src/utils/workingHoursStatus';
import { doc, setDoc } from 'firebase/firestore';

export type StatusMode = 'open' | 'close' | 'schedule';

export interface StatusFlags {
  manualClose: boolean;
  manualOpen: boolean;
}

/**
 * Single shared write path for clinic open/closed status.
 *
 * Computes the manual-override flags and a derived `status` field
 * (lightweight cache for map markers / list cards), then merges them
 * into `clinics_public/{clinicId}`.
 *
 * Returns the new flags so the caller can apply them optimistically.
 * Throws on Firestore write failure so the caller can roll back.
 */
export async function updateClinicStatus(
  clinicId: string,
  mode: StatusMode,
  workingHours?: WeeklySchedule | null,
): Promise<StatusFlags> {
  const next: StatusFlags =
    mode === 'open'     ? { manualClose: false, manualOpen: true } :
    mode === 'close'    ? { manualClose: true,  manualOpen: false } :
    /* schedule */        { manualClose: false, manualOpen: false };

  let derivedStatus: 'open' | 'closed' = 'closed';
  if (next.manualClose) {
    derivedStatus = 'closed';
  } else if (next.manualOpen) {
    derivedStatus = 'open';
  } else if (workingHours) {
    derivedStatus = getClinicOpenStatus(workingHours).status === 'open' ? 'open' : 'closed';
  }

  await setDoc(
    doc(db, 'clinics_public', clinicId),
    { ...next, status: derivedStatus },
    { merge: true },
  );

  return next;
}
