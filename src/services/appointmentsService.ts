import { addDoc, collection, collectionGroup, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

export type AppointmentStatus = 'proposed' | 'confirmed' | 'requested' | 'cancelled' | 'completed';
export type AppointmentSource = 'clinic' | 'chat';

export type AppointmentDoc = {
  id: string;
  clinicId: string;
  patientId: string;
  patientName?: string;
  dateTime: number;
  durationMins?: number;
  title?: string;
  sessionTemplateSlug?: string | null;
  status: AppointmentStatus;
  source: AppointmentSource;
  requestedBy?: 'patient' | null;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  confirmedAt?: number | null;
  sessionId?: string | null;
};

export type CreateAppointmentInput = {
  clinicId: string;
  patientId: string;
  patientName?: string;
  dateTime: number;
  durationMins?: number;
  title?: string;
  sessionTemplateSlug?: string | null;
  status?: AppointmentStatus;
  source?: AppointmentSource;
  requestedBy?: 'patient' | null;
  createdBy: string;
  sessionId?: string | null;
};

export async function createAppointment(input: CreateAppointmentInput): Promise<string> {
  const now = Date.now();
  const status: AppointmentStatus = input.status ?? 'confirmed';
  const ref = await addDoc(collection(db, `patients/${input.patientId}/appointments`), {
    clinicId: input.clinicId,
    patientId: input.patientId,
    patientName: input.patientName ?? '',
    dateTime: input.dateTime,
    durationMins: input.durationMins ?? 30,
    title: input.title ?? '',
    sessionTemplateSlug: input.sessionTemplateSlug ?? null,
    status,
    source: input.source ?? 'clinic',
    requestedBy: input.requestedBy ?? null,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    confirmedAt: status === 'confirmed' ? now : null,
    sessionId: input.sessionId ?? null,
  });
  return ref.id;
}

export function subscribeClinicAppointments(
  clinicId: string,
  fromMs: number,
  toMs: number,
  cb: (rows: AppointmentDoc[]) => void,
  onErr?: (e: unknown) => void,
) {
  const qy = query(
    collectionGroup(db, 'appointments'),
    where('clinicId', '==', clinicId),
    where('dateTime', '>=', fromMs),
    where('dateTime', '<', toMs),
    orderBy('dateTime', 'asc'),
  );
  return onSnapshot(qy, (snap) => {
    const rows: AppointmentDoc[] = [];
    snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
    cb(rows);
  }, (e) => onErr?.(e));
}

export async function updateAppointment(patientId: string, apptId: string, patch: Partial<AppointmentDoc>): Promise<void> {
  await updateDoc(doc(db, `patients/${patientId}/appointments/${apptId}`), { ...patch, updatedAt: Date.now() });
}
