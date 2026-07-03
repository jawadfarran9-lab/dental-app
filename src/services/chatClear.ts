import { db } from '@/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export async function clearChatForClinic(params: {
  clinicId: string;
  patientId: string;
}): Promise<void> {
  const { clinicId, patientId } = params;
  const threadRef = doc(db, 'threads', `${clinicId}_${patientId}`);
  await setDoc(threadRef, { clearedForClinicAt: Date.now() }, { merge: true });
}
