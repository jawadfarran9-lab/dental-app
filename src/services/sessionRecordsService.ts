import { db } from '@/firebaseConfig';
import { collection, doc, writeBatch } from 'firebase/firestore';

export interface CreateSessionRecordInput {
  clinicId: string;
  patientId: string;
  memberId: string;
  templateSlug: string;
  templateName: string;
  title: string;
  date: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  toothAreas: string[];
  patientSummary: string;
  aftercare: string;
  nextAppointmentAt: number | null;
  materialsUsed: string;
}

export async function createSessionRecord(
  input: CreateSessionRecordInput
): Promise<{ sessionId: string }> {
  const {
    clinicId,
    patientId,
    memberId,
    templateSlug,
    templateName,
    title,
    date,
    status,
    toothAreas,
    patientSummary,
    aftercare,
    nextAppointmentAt,
    materialsUsed,
  } = input;

  const now = Date.now();

  const sessionsCol = collection(
    db,
    `clinics/${clinicId}/patients/${patientId}/sessions`
  );
  const mainRef = doc(sessionsCol);
  const sessionId = mainRef.id;

  const privateRef = doc(
    db,
    `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}/private`,
    'main'
  );

  const timelineRef = doc(
    collection(db, `clinics/${clinicId}/patients/${patientId}/timeline`)
  );
  const timelineId = timelineRef.id;

  const mainData = {
    id: sessionId,
    clinicId,
    patientId,
    title,
    date,
    createdAt: now,
    updatedAt: now,
    status,
    templateSlug,
    templateName,
    patientSummary,
    aftercare,
    nextAppointmentAt,
    toothAreas,
    mediaIds: [] as string[],
  };

  const privateData = {
    sessionId,
    clinicId,
    materialsUsed,
    internalNotes: '',
    doctorId: memberId,
    createdBy: memberId,
    createdAt: now,
    updatedAt: now,
    statusUpdatedAt: now,
    statusUpdatedBy: memberId,
  };

  const timelineData = {
    id: timelineId,
    type: 'session' as const,
    patientId,
    clinicId,
    timestamp: now,
    relatedSessionId: sessionId,
    title: `Session: ${title}`,
    sortKey: Number.MAX_VALUE - now,
  };

  const batch = writeBatch(db);
  batch.set(mainRef, mainData);
  batch.set(privateRef, privateData);
  batch.set(timelineRef, timelineData);
  await batch.commit();

  return { sessionId };
}
