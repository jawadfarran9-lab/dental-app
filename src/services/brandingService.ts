import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { ClinicBranding } from '@/src/types/branding';
import { writeAuditLog } from './auditLogService';

const OWNER_ONLY_ERROR = 'Only OWNER_ADMIN can update branding';

function assertOwner(role?: string) {
  if (role !== 'OWNER_ADMIN') {
    throw new Error(OWNER_ONLY_ERROR);
  }
}

export async function getClinicBranding(clinicId: string): Promise<ClinicBranding> {
  const clinicRef = doc(db, 'clinics', clinicId);
  const snap = await getDoc(clinicRef);
  if (!snap.exists()) return {};
  const data = snap.data() as ClinicBranding;
  return {
    heroImageUrl: data.heroImageUrl,
    updatedAt: data.updatedAt,
    updatedBy: data.updatedBy,
  };
}

export async function updateClinicBranding(params: {
  clinicId: string;
  actingRole?: string;
  heroImageUrl?: string;
  actorId?: string;
  actorName?: string;
}): Promise<void> {
  assertOwner(params.actingRole);

  const clinicRef = doc(db, 'clinics', params.clinicId);
  const payload: ClinicBranding = {
    heroImageUrl: params.heroImageUrl?.trim() || undefined,
    updatedAt: serverTimestamp(),
    updatedBy: params.actorId,
  };

  await setDoc(clinicRef, payload, { merge: true });

  await writeAuditLog({
    clinicId: params.clinicId,
    actorId: params.actorId || 'owner',
    actorName: params.actorName,
    action: 'BRANDING_UPDATED',
    targetId: params.clinicId,
    details: { heroImageUrl: params.heroImageUrl ? 'set' : 'cleared' },
  });
}
