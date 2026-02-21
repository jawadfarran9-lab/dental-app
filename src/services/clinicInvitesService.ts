import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { ClinicRole } from '@/src/types/members';
import { writeAuditLog } from './auditLogService';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface ClinicInvite {
  id?: string;
  clinicId: string;
  email: string;
  role: ClinicRole;
  status: InviteStatus;
  invitedBy?: string;
  invitedByName?: string;
  createdAt?: any;
  updatedAt?: any;
  acceptedBy?: string;
  acceptedAt?: any;
}

const invitesCollection = (clinicId: string) => collection(db, `clinics/${clinicId}/invites`);

export async function createInvite(params: {
  clinicId: string;
  email: string;
  role: ClinicRole;
  invitedBy: string;
  invitedByName?: string;
}): Promise<ClinicInvite> {
  const payload: ClinicInvite = {
    clinicId: params.clinicId,
    email: params.email.toLowerCase().trim(),
    role: params.role,
    status: 'PENDING',
    invitedBy: params.invitedBy,
    invitedByName: params.invitedByName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(invitesCollection(params.clinicId), payload);

  await writeAuditLog({
    clinicId: params.clinicId,
    actorId: params.invitedBy,
    actorName: params.invitedByName,
    action: 'INVITE_CREATED',
    targetId: docRef.id,
    targetName: params.email,
    details: { role: params.role },
  });

  return { ...payload, id: docRef.id };
}

export async function listInvites(clinicId: string, max: number = 50): Promise<ClinicInvite[]> {
  const q = query(invitesCollection(clinicId), orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClinicInvite) }));
}

export async function revokeInvite(params: {
  clinicId: string;
  inviteId: string;
  actorId: string;
  actorName?: string;
}): Promise<void> {
  const { clinicId, inviteId, actorId, actorName } = params;
  const inviteRef = doc(invitesCollection(clinicId), inviteId);
  const snap = await getDoc(inviteRef);
  if (!snap.exists()) throw new Error('Invite not found');

  await setDoc(inviteRef, { status: 'REVOKED', updatedAt: serverTimestamp() }, { merge: true });

  await writeAuditLog({
    clinicId,
    actorId,
    actorName,
    action: 'INVITE_REVOKED',
    targetId: inviteId,
    targetName: (snap.data() as ClinicInvite).email,
  });
}

export async function findPendingInvite(clinicId: string, inviteId: string, email: string): Promise<ClinicInvite | null> {
  const inviteRef = doc(invitesCollection(clinicId), inviteId);
  const snap = await getDoc(inviteRef);
  if (!snap.exists()) return null;
  const invite = snap.data() as ClinicInvite;
  if (invite.status !== 'PENDING') return null;
  if (invite.email !== email.toLowerCase().trim()) return null;
  return { id: snap.id, ...invite };
}

export async function acceptInvite(params: {
  clinicId: string;
  inviteId: string;
  email: string;
  memberId: string;
  memberName: string;
}): Promise<ClinicInvite> {
  const invite = await findPendingInvite(params.clinicId, params.inviteId, params.email);
  if (!invite) {
    throw new Error('No pending invite found for this email');
  }

  const inviteRef = doc(invitesCollection(params.clinicId), params.inviteId);
  const accepted: Partial<ClinicInvite> = {
    status: 'ACCEPTED',
    acceptedBy: params.memberId,
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(inviteRef, accepted, { merge: true });

  await writeAuditLog({
    clinicId: params.clinicId,
    actorId: params.memberId,
    actorName: params.memberName,
    action: 'INVITE_ACCEPTED',
    targetId: params.inviteId,
    targetName: invite.email,
    details: { role: invite.role },
  });

  return { ...invite, ...accepted } as ClinicInvite;
}

export async function findPendingInviteByEmail(clinicId: string, email: string): Promise<ClinicInvite | null> {
  const q = query(
    invitesCollection(clinicId),
    where('email', '==', email.toLowerCase().trim()),
    where('status', '==', 'PENDING')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as ClinicInvite) };
}

/**
 * Search for a pending invite globally across all clinics by email.
 * Uses collectionGroup to query all invites subcollections.
 */
export async function findPendingInviteGloballyByEmail(email: string): Promise<ClinicInvite | null> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Use collectionGroup to search across all clinics
  const q = query(
    collection(db, 'clinics'),
  );
  
  const clinicsSnap = await getDocs(q);
  
  // Search each clinic's invites subcollection
  for (const clinicDoc of clinicsSnap.docs) {
    const inviteQuery = query(
      invitesCollection(clinicDoc.id),
      where('email', '==', normalizedEmail),
      where('status', '==', 'PENDING')
    );
    
    const inviteSnap = await getDocs(inviteQuery);
    if (!inviteSnap.empty) {
      const d = inviteSnap.docs[0];
      const data = d.data() as ClinicInvite;
      return { ...data, id: d.id, clinicId: clinicDoc.id };
    }
  }
  
  return null;
}
