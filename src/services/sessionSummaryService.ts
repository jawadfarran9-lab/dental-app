import { addDoc, collection, doc, getDocs, limit, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { updateThreadOnMessage } from '@/src/utils/threadsHelper';

export type SessionSummaryPayload = {
  clinicId: string;
  patientId: string;
  patientName?: string;
  sessionId?: string | null;
  title: string;
  aftercare: string;
  nextAppointmentAt: number | null;
  sessionDate?: number | null;
  clinicName?: string | null;
  appointmentId?: string | null;
};

function formatWhen(ms: number | null | undefined): string {
  if (!ms) return 'Not scheduled yet';
  const d = new Date(ms);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const mm = m < 10 ? '0' + m : '' + m;
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} · ${h}:${mm} ${ampm}`;
}

export async function sendSessionSummary(p: SessionSummaryPayload): Promise<string> {
  const parts: string[] = ['📋 Session summary', '', p.title];
  if (p.aftercare && p.aftercare.trim()) {
    parts.push('', 'Aftercare:', p.aftercare.trim());
  }
  parts.push('', 'Next appointment: ' + formatWhen(p.nextAppointmentAt));
  const text = parts.join('\n');

  const msgRef = await addDoc(collection(db, `patients/${p.patientId}/messages`), {
    from: 'clinic',
    type: 'session_summary',
    text,
    senderName: 'Clinic',
    createdAt: Date.now(),
    summary: {
      title: p.title,
      aftercare: p.aftercare ? p.aftercare.trim() : '',
      nextAppointmentAt: p.nextAppointmentAt ?? null,
      sessionDate: p.sessionDate ?? null,
      clinicName: p.clinicName ?? null,
      sessionId: p.sessionId ?? null,
      appointmentId: p.appointmentId ?? null,
    },
  });

  await updateThreadOnMessage(p.clinicId, p.patientId, p.patientName ?? '', '📋 Session summary', 'clinic');

  if (p.sessionId) {
    await updateDoc(
      doc(db, `clinics/${p.clinicId}/patients/${p.patientId}/sessions/${p.sessionId}`),
      { patientSummarySentAt: Date.now(), patientSummaryMessageId: msgRef.id }
    );
  }

  return msgRef.id;
}

export async function updateSessionSummaryMessage(p: {
  patientId: string;
  messageId: string;
  title: string;
  aftercare?: string | null;
  nextAppointmentAt?: number | null;
  sessionDate?: number | null;
  clinicName?: string | null;
  appointmentId?: string | null;
}): Promise<void> {
  const parts: string[] = ['📋 Session summary', '', p.title];
  if (p.aftercare && p.aftercare.trim()) {
    parts.push('', 'Aftercare:', p.aftercare.trim());
  }
  parts.push('', 'Next appointment: ' + formatWhen(p.nextAppointmentAt));
  const text = parts.join('\n');

  const patch: Record<string, any> = {
    'summary.title': p.title,
    'summary.aftercare': p.aftercare ? p.aftercare.trim() : '',
    'summary.nextAppointmentAt': p.nextAppointmentAt ?? null,
    'summary.sessionDate': p.sessionDate ?? null,
    'summary.clinicName': p.clinicName ?? null,
    text,
  };
  if (p.appointmentId !== undefined) {
    patch['summary.appointmentId'] = p.appointmentId ?? null;
  }

  await updateDoc(doc(db, `patients/${p.patientId}/messages/${p.messageId}`), patch);
}

export async function findSummaryMessageId(patientId: string, sessionId: string): Promise<string | null> {
  const qy = query(
    collection(db, `patients/${patientId}/messages`),
    orderBy('createdAt', 'desc'),
    limit(30),
  );
  const snap = await getDocs(qy);
  for (const d of snap.docs) {
    const data = d.data() as any;
    if (data?.type === 'session_summary' && data?.summary?.sessionId === sessionId) {
      return d.id;
    }
  }
  return null;
}
