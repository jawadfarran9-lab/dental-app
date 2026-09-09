import { addDoc, collection, collectionGroup, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db, patientDb } from '@/firebaseConfig';
import { updateThreadOnMessage } from '@/src/utils/threadsHelper';

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
  chatMessageId?: string | null;
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

export async function deleteAppointment(patientId: string, apptId: string): Promise<void> {
  await deleteDoc(doc(db, `patients/${patientId}/appointments/${apptId}`));
}

function fmtWhenText(ms: number): string {
  const d = new Date(ms);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = d.getHours(); const m = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12;
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} · ${h}:${m < 10 ? '0' + m : m} ${ap}`;
}

export async function proposeAppointmentViaChat(p: {
  clinicId: string; patientId: string; patientName?: string; dateTime: number; title?: string; clinicName?: string | null; createdBy: string;
}): Promise<void> {
  const apptId = await createAppointment({
    clinicId: p.clinicId, patientId: p.patientId, patientName: p.patientName,
    dateTime: p.dateTime, title: p.title, status: 'proposed', source: 'chat', createdBy: p.createdBy,
  });
  const text = `📅 Appointment · ${fmtWhenText(p.dateTime)}${p.title ? ' · ' + p.title : ''} · tap to confirm`;
  const msgRef = await addDoc(collection(db, `patients/${p.patientId}/messages`), {
    from: 'clinic', type: 'appointment', text, senderName: 'Clinic', createdAt: Date.now(),
    appointment: { appointmentId: apptId, patientId: p.patientId, clinicId: p.clinicId, dateTime: p.dateTime, title: p.title || '', status: 'proposed', clinicName: p.clinicName ?? null },
  });
  await updateDoc(doc(db, `patients/${p.patientId}/appointments/${apptId}`), { chatMessageId: msgRef.id, updatedAt: Date.now() });
  await updateThreadOnMessage(p.clinicId, p.patientId, p.patientName ?? '', '📅 Appointment', 'clinic');
}

export async function requestAppointmentAsPatient(input: {
  clinicId: string;
  patientId: string;
  patientName: string;
  dateTime: number;
  title: string;
  clinicName?: string;
}): Promise<string> {
  const now = Date.now();
  const apptRef = await addDoc(collection(patientDb, `patients/${input.patientId}/appointments`), {
    clinicId: input.clinicId,
    patientId: input.patientId,
    patientName: input.patientName,
    dateTime: input.dateTime,
    title: input.title,
    status: 'requested',
    source: 'chat',
    requestedBy: 'patient',
    createdBy: input.patientId,
    createdAt: now,
    updatedAt: now,
    confirmedAt: null,
  });
  const msgRef = await addDoc(collection(patientDb, `patients/${input.patientId}/messages`), {
    from: 'patient',
    type: 'appointment',
    text: '📅 Appointment request · waiting for clinic',
    senderName: input.patientName,
    createdAt: Date.now(),
    appointment: {
      appointmentId: apptRef.id,
      patientId: input.patientId,
      clinicId: input.clinicId,
      dateTime: input.dateTime,
      title: input.title,
      status: 'requested',
      source: 'chat',
      requestedBy: 'patient',
      clinicName: input.clinicName ?? null,
    },
  });
  await updateDoc(doc(patientDb, `patients/${input.patientId}/appointments/${apptRef.id}`), { chatMessageId: msgRef.id, updatedAt: Date.now() });
  await updateThreadOnMessage(input.clinicId, input.patientId, input.patientName, '📅 Appointment request', 'patient', patientDb);
  return apptRef.id;
}

export async function approveAppointment(patientId: string, appointmentId: string, chatMessageId?: string | null): Promise<void> {
  await updateAppointment(patientId, appointmentId, { status: 'confirmed', confirmedAt: Date.now() });
  if (chatMessageId) {
    await updateDoc(doc(db, `patients/${patientId}/messages/${chatMessageId}`), { 'appointment.status': 'confirmed' });
  }
}

export async function declineAppointment(patientId: string, appointmentId: string, chatMessageId?: string | null): Promise<void> {
  await updateAppointment(patientId, appointmentId, { status: 'cancelled' });
  if (chatMessageId) {
    await updateDoc(doc(db, `patients/${patientId}/messages/${chatMessageId}`), { 'appointment.status': 'cancelled' });
  }
}
