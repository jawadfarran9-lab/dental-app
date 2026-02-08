import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { AuditAction, AuditLogEntry } from '@/src/types/auditLog';

const logsCollection = (clinicId: string) => collection(db, `clinics/${clinicId}/auditLogs`);

export async function writeAuditLog(entry: Omit<AuditLogEntry, 'createdAt' | 'id'>) {
  const { clinicId, ...rest } = entry;
  await addDoc(logsCollection(clinicId), {
    ...rest,
    clinicId,
    createdAt: serverTimestamp(),
  });
}

export async function fetchRecentAuditLogs(clinicId: string, take: number = 50): Promise<AuditLogEntry[]> {
  const q = query(logsCollection(clinicId), orderBy('createdAt', 'desc'), limit(take));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as AuditLogEntry) }));
}
