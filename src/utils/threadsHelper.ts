import { db } from '@/firebaseConfig';
import { doc, getDoc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Update thread when a message is sent
 * Called from both clinic and patient sides
 */
export async function updateThreadOnMessage(
  clinicId: string,
  patientId: string,
  patientName: string,
  messageText: string,
  senderType: 'clinic' | 'patient'
) {
  try {
    const threadId = `${clinicId}_${patientId}`;
    const threadRef = doc(db, 'threads', threadId);

    // Check if thread exists
    const threadSnap = await getDoc(threadRef);

    if (threadSnap.exists()) {
      // Update existing thread
      await updateDoc(threadRef, {
        lastMessageText: messageText,
        lastMessageSender: senderType,
        lastMessageAt: serverTimestamp(),
        [senderType === 'clinic' ? 'unreadForPatient' : 'unreadForClinic']: increment(1),
      });
    } else {
      // Create new thread
      await setDoc(threadRef, {
        clinicId,
        patientId,
        patientName,
        lastMessageText: messageText,
        lastMessageSender: senderType,
        lastMessageAt: serverTimestamp(),
        unreadForClinic: senderType === 'patient' ? 1 : 0,
        unreadForPatient: senderType === 'clinic' ? 1 : 0,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    // Error logging disabled for production
  }
}

/**
 * Mark thread as read for clinic
 * Uses setDoc with merge to safely handle non-existent threads
 */
export async function markThreadReadForClinic(clinicId: string, patientId: string) {
  try {
    const threadId = `${clinicId}_${patientId}`;
    const threadRef = doc(db, 'threads', threadId);

    // Merge ensures we don't crash if the thread doc has not been created yet
    await setDoc(threadRef, { unreadForClinic: 0 }, { merge: true });
  } catch (err) {
    // Error logging disabled for production
  }
}

/**
 * Mark thread as read for patient
 * Uses setDoc with merge to safely handle non-existent threads
 */
export async function markThreadReadForPatient(clinicId: string, patientId: string) {
  try {
    const threadId = `${clinicId}_${patientId}`;
    const threadRef = doc(db, 'threads', threadId);

    // Merge ensures we don't crash if the thread doc has not been created yet
    await setDoc(threadRef, { unreadForPatient: 0 }, { merge: true });
  } catch (err) {
    // Error logging disabled for production
  }
}
