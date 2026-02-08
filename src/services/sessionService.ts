import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { deriveKey, encryptText } from '@/src/utils/secure';
import { SessionEditParams } from '@/src/types/session';
import { writeAuditLog } from './auditLogService';

/**
 * PHASE U: Edit a session/exam
 * Updates the session and logs the change in audit log
 */
export async function editSession(params: SessionEditParams): Promise<void> {
  const { patientId, sessionId, updates, editedBy, editedByName } = params;
  
  const sessionRef = doc(db, `patients/${patientId}/sessions`, sessionId);
  
  // Add edit tracking fields
  const updateData: any = {
    ...updates,
    lastEditedAt: serverTimestamp(),
    lastEditedBy: editedBy,
    lastEditedByName: editedByName,
  };

  // PHASE Z3: Encrypt sensitive fields if present
  try {
    const salt = process.env.EXPO_PUBLIC_SECURITY_SALT || 'public-salt';
    const key = deriveKey(editedBy, String(updates.clinicId || ''), salt);
    if (updateData.privateNotes) {
      updateData.privateNotes = encryptText(String(updateData.privateNotes), key);
      updateData.privateNotesEncrypted = true;
    }
    if (updateData.medicalNotesSensitive) {
      updateData.medicalNotesSensitive = encryptText(String(updateData.medicalNotesSensitive), key);
      updateData.medicalNotesSensitiveEncrypted = true;
    }
  } catch {}
  
  await updateDoc(sessionRef, updateData);
  
  // PHASE U: Log session edit in audit log
  // We need clinicId from the updates or fetch it
  if (updates.clinicId) {
    await writeAuditLog({
      clinicId: updates.clinicId,
      actorId: editedBy,
      actorName: editedByName,
      action: 'SESSION_EDITED' as any,
      targetId: sessionId,
      targetName: `Session: ${updates.type || 'Unknown'}`,
      details: { 
        patientId,
        changes: Object.keys(updates),
      },
    });
  }
}

/**
 * PHASE AA-4.1: Update session status (PENDING → IN_PROGRESS → COMPLETED)
 * Changes status and logs the change in audit log
 */
export async function updateSessionStatus(
  patientId: string,
  sessionId: string,
  newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
  clinicId: string,
  doctorId: string,
  doctorName: string
): Promise<void> {
  const sessionRef = doc(db, `patients/${patientId}/sessions`, sessionId);
  
  const updateData = {
    status: newStatus,
    statusUpdatedAt: serverTimestamp(),
    statusUpdatedBy: doctorId,
  };
  
  await updateDoc(sessionRef, updateData);
  
  // Log status change in audit log
  await writeAuditLog({
    clinicId,
    actorId: doctorId,
    actorName: doctorName,
    action: 'SESSION_STATUS_CHANGED' as any,
    targetId: sessionId,
    targetName: `Session: ${sessionId}`,
    details: {
      patientId,
      newStatus,
      sessionId,
    },
  });
}
