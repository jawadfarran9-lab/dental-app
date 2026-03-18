/**
 * App Usage Tracking — Firestore persistence layer
 *
 * Document: clinics/{clinicId}/analytics/timeManagement
 * Shape:
 *   {
 *     dailyUsageSeconds: { "2026-03-12": 5040, "2026-03-13": 4020, ... },
 *     updatedAt: serverTimestamp()
 *   }
 */
import { db } from '@/firebaseConfig';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

const analyticsDoc = (clinicId: string) =>
  doc(db, `clinics/${clinicId}/analytics`, 'timeManagement');

/**
 * Flush accumulated seconds for a given day into Firestore.
 * Merges into the existing map — previous days are preserved.
 * Ignores zero or negative deltas.
 */
export async function flushUsageSeconds(
  clinicId: string,
  dateKey: string,
  deltaSeconds: number,
): Promise<void> {
  if (deltaSeconds <= 0) return;

  const ref = analyticsDoc(clinicId);

  // Read current value for today so we can increment
  const snap = await getDoc(ref);
  const existing =
    snap.exists() && snap.data()?.dailyUsageSeconds?.[dateKey]
      ? (snap.data().dailyUsageSeconds[dateKey] as number)
      : 0;

  await setDoc(
    ref,
    {
      dailyUsageSeconds: { [dateKey]: existing + deltaSeconds },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
