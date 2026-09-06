import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { updateThreadOnMessage } from '@/src/utils/threadsHelper';

export type SessionSummaryPayload = {
  clinicId: string;
  patientId: string;
  patientName?: string;
  sessionId: string;
  title: string;
  aftercare: string;
  nextAppointmentAt: number | null;
  sessionDate?: number | null;
  clinicName?: string | null;
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

export async function sendSessionSummary(p: SessionSummaryPayload): Promise<void> {
  const parts: string[] = ['📋 Session summary', '', p.title];
  if (p.aftercare && p.aftercare.trim()) {
    parts.push('', 'Aftercare:', p.aftercare.trim());
  }
  parts.push('', 'Next appointment: ' + formatWhen(p.nextAppointmentAt));
  const text = parts.join('\n');

  await addDoc(collection(db, `patients/${p.patientId}/messages`), {
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
      sessionId: p.sessionId,
    },
  });

  await updateThreadOnMessage(p.clinicId, p.patientId, p.patientName ?? '', '📋 Session summary', 'clinic');

  await updateDoc(
    doc(db, `clinics/${p.clinicId}/patients/${p.patientId}/sessions/${p.sessionId}`),
    { patientSummarySentAt: Date.now() }
  );
}
