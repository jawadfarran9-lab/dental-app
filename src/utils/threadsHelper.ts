import { db } from '@/firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { collection, deleteField, doc, getCountFromServer, getDoc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

async function countThreadMessages(patientId: string, dbInstance: Firestore = db): Promise<number> {
  try {
    const snap = await getCountFromServer(collection(dbInstance, `patients/${patientId}/messages`));
    return snap.data().count;
  } catch {
    return 0;
  }
}

/**
 * Update thread when a message is sent
 * Called from both clinic and patient sides
 */
export async function updateThreadOnMessage(
  clinicId: string,
  patientId: string,
  patientName: string,
  messageText: string,
  senderType: 'clinic' | 'patient',
  dbInstance: Firestore = db,
) {
  try {
    const threadId = `${clinicId}_${patientId}`;
    const threadRef = doc(dbInstance, 'threads', threadId);

    // Check if thread exists
    const threadSnap = await getDoc(threadRef);

    if (threadSnap.exists()) {
      // Update existing thread
      await updateDoc(threadRef, {
        lastMessageText: messageText,
        lastMessageSender: senderType,
        lastMessageAt: serverTimestamp(),
        messageCount: increment(1),
        [senderType === 'clinic' ? 'unreadForPatient' : 'unreadForClinic']: increment(1),
        deletedForClinic: deleteField(),
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
        messageCount: 1,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    // Error logging disabled for production
  }
}

export async function ensureThread(
  clinicId: string,
  patientId: string,
  patientName: string,
  dbInstance: Firestore = db,
): Promise<void> {
  try {
    const threadId = `${clinicId}_${patientId}`;
    const threadRef = doc(dbInstance, 'threads', threadId);
    const snap = await getDoc(threadRef);
    const cleanName = patientName && patientName.trim() ? patientName.trim() : 'Patient';
    if (!snap.exists()) {
      const count = await countThreadMessages(patientId, dbInstance);
      await setDoc(threadRef, {
        clinicId,
        patientId,
        patientName: cleanName,
        lastMessageText: '',
        lastMessageSender: '',
        lastMessageAt: serverTimestamp(),
        unreadForClinic: 0,
        unreadForPatient: 0,
        messageCount: count,
        createdAt: serverTimestamp(),
      });
      return;
    }
    // Heal an incomplete/stub thread so it appears in the clinic list.
    const data = snap.data() as any;
    const patch: Record<string, any> = {};
    if (!data.clinicId) patch.clinicId = clinicId;
    if (!data.patientId) patch.patientId = patientId;
    if (data.lastMessageAt == null) patch.lastMessageAt = serverTimestamp();
    if ((!data.patientName || String(data.patientName).trim() === '') && cleanName !== 'Patient') {
      patch.patientName = cleanName;
    }
    if (data.messageCount == null) {
      patch.messageCount = await countThreadMessages(patientId, dbInstance);
    }
    if (Object.keys(patch).length > 0) {
      await updateDoc(threadRef, patch);
    }
  } catch (e) {
    console.error('[threadsHelper] ensureThread error', e);
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
export async function markThreadReadForPatient(clinicId: string, patientId: string, dbInstance: Firestore = db) {
  try {
    const threadId = `${clinicId}_${patientId}`;
    const threadRef = doc(dbInstance, 'threads', threadId);

    // Merge ensures we don't crash if the thread doc has not been created yet
    await setDoc(threadRef, { unreadForPatient: 0 }, { merge: true });
  } catch (err) {
    // Error logging disabled for production
  }
}
