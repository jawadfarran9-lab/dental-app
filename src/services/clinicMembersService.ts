import { db } from '@/firebaseConfig';
import { ClinicMember, UserClinicProfile } from '@/src/types/members';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';
import { writeAuditLog } from './auditLogService';

const usersCollection = collection(db, 'users');

function membersCollection(clinicId: string) {
  return collection(db, `clinics/${clinicId}/members`);
}

const OWNER_ONLY_ERROR = 'Only owner can perform this action';

function assertOwner(actingRole: string) {
  if (actingRole !== 'owner') {
    throw new Error(OWNER_ONLY_ERROR);
  }
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

export async function fetchMemberProfile(clinicId: string, memberId: string): Promise<ClinicMember | null> {
  const memberRef = doc(db, `clinics/${clinicId}/members`, memberId);
  const snap = await getDoc(memberRef);

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data() as ClinicMember;
  return { ...data, id: snap.id };
}

export async function ensureOwnerMembership(clinicId: string, email?: string): Promise<ClinicMember> {
  const memberRef = doc(db, `clinics/${clinicId}/members`, clinicId);
  const memberSnap = await getDoc(memberRef);
  const now = serverTimestamp();

  const baseMember: ClinicMember = {
    id: clinicId,
    clinicId,
    displayName: 'Owner',
    email: (memberSnap.data() as ClinicMember | undefined)?.email || email || '',
    role: 'owner',
    status: 'ACTIVE',
    createdAt: memberSnap.exists() ? (memberSnap.data() as ClinicMember).createdAt : now,
    updatedAt: now,
    lastLoginAt: memberSnap.exists() ? (memberSnap.data() as ClinicMember).lastLoginAt : now,
  };

  await setDoc(memberRef, baseMember, { merge: true });

  const userRef = doc(usersCollection, clinicId);
  const userProfile: UserClinicProfile = {
    clinicId,
    role: 'owner',
    status: 'ACTIVE',
    email: baseMember.email,
    displayName: baseMember.displayName,
    lastLoginAt: now,
  };

  await setDoc(userRef, userProfile, { merge: true });

  return baseMember;
}

export async function findUserByEmailAndPassword(
  email: string,
  password: string
): Promise<{ memberId: string; profile: UserClinicProfile } | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const q = query(usersCollection, where('email', '==', normalizedEmail), where('password', '==', password));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  return { memberId: docSnap.id, profile: docSnap.data() as UserClinicProfile };
}

export async function recordMemberLogin(clinicId: string, memberId: string): Promise<void> {
  const now = serverTimestamp();
  const memberRef = doc(membersCollection(clinicId), memberId);
  const userRef = doc(usersCollection, memberId);

  // Fetch member name for audit log
  const memberSnap = await getDoc(memberRef);
  const memberData = memberSnap.exists() ? memberSnap.data() : null;
  const memberName = memberData?.displayName || 'Unknown';

  await Promise.all([
    setDoc(memberRef, { lastLoginAt: now }, { merge: true }),
    setDoc(userRef, { lastLoginAt: now }, { merge: true }),
  ]);

  // Log the login event
  await writeAuditLog({
    clinicId,
    actorId: memberId,
    actorName: memberName,
    action: 'LOGIN',
    targetId: memberId,
    targetName: memberName,
  });
}

export async function upsertUserProfile(memberId: string, profile: Partial<UserClinicProfile>): Promise<void> {
  const userRef = doc(usersCollection, memberId);
  await setDoc(userRef, profile, { merge: true });
}

export async function listClinicMembers(clinicId: string): Promise<ClinicMember[]> {
  const snapshot = await getDocs(membersCollection(clinicId));
  return snapshot.docs
    .map((d) => {
      const data = d.data() as ClinicMember;
      return { ...data, id: d.id };
    })
    // PHASE T: Filter out REMOVED members (soft delete)
    .filter((member) => member.status !== 'REMOVED');
}

export async function addClinicMember(params: {
  clinicId: string;
  actingRole: string;
  member: Pick<ClinicMember, 'displayName' | 'email' | 'role'> & {
    password?: string;
    phoneNumber?: string;
  };
  invitedBy?: string;
}): Promise<ClinicMember> {
  const { clinicId, actingRole, member, invitedBy } = params;
  assertOwner(actingRole);

  return addClinicMemberInternal({
    clinicId,
    member,
    invitedBy,
  });
}

export async function addMemberFromInvite(params: {
  clinicId: string;
  inviteId: string;
  memberId: string;
  member: Pick<ClinicMember, 'displayName' | 'email' | 'role'> & {
    password?: string;
  };
}): Promise<ClinicMember> {
  return addClinicMemberInternal({
    clinicId: params.clinicId,
    member: params.member,
    invitedBy: params.inviteId,
    memberIdOverride: params.memberId,
  });
}

async function addClinicMemberInternal(params: {
  clinicId: string;
  member: Pick<ClinicMember, 'displayName' | 'email' | 'role'> & {
    password?: string;
    phoneNumber?: string;
  };
  invitedBy?: string;
  memberIdOverride?: string;
}): Promise<ClinicMember> {
  const email = normalizeEmail(params.member.email);
  const now = serverTimestamp();

  const memberRef = params.memberIdOverride
    ? doc(membersCollection(params.clinicId), params.memberIdOverride)
    : doc(membersCollection(params.clinicId));
  const memberId = memberRef.id;

  const newMember: ClinicMember = {
    id: memberId,
    clinicId: params.clinicId,
    displayName: params.member.displayName,
    email,
    role: params.member.role,
    status: 'ACTIVE',
    invitedBy: params.invitedBy,
    phoneNumber: params.member.phoneNumber,
    createdAt: now,
    updatedAt: now,
    password: params.member.password,
  };

  await setDoc(memberRef, newMember, { merge: true });

  const userProfile: UserClinicProfile = {
    clinicId: params.clinicId,
    role: params.member.role,
    status: 'ACTIVE',
    email,
    displayName: params.member.displayName,
    password: params.member.password,
    lastLoginAt: null,
  };

  await setDoc(doc(usersCollection, memberId), userProfile, { merge: true });

  return newMember;
}

export async function changeMemberRole(params: {
  clinicId: string;
  actingRole: string;
  memberId: string;
  newRole: ClinicMember['role'];
  actorId?: string;
  actorName?: string;
}): Promise<void> {
  const { clinicId, actingRole, memberId, newRole } = params;
  assertOwner(actingRole);

  if (memberId === clinicId) {
    throw new Error('Cannot change role of OWNER_ADMIN');
  }

  const update = { role: newRole, updatedAt: serverTimestamp() };

  await Promise.all([
    setDoc(doc(membersCollection(clinicId), memberId), update, { merge: true }),
    setDoc(doc(usersCollection, memberId), update, { merge: true }),
  ]);

  await writeAuditLog({
    clinicId,
    actorId: params.actorId || 'owner',
    actorName: params.actorName,
    action: 'ROLE_CHANGED',
    targetId: memberId,
    details: { newRole },
  });
}

export async function setMemberStatus(params: {
  clinicId: string;
  actingRole: string;
  memberId: string;
  status: 'ACTIVE' | 'DISABLED' | 'REMOVED';  // PHASE T: Added REMOVED
  disabledReason?: string;
  actorId?: string;
  actorName?: string;
}): Promise<void> {
  const { clinicId, actingRole, memberId, status, disabledReason } = params;
  assertOwner(actingRole);

  if (memberId === clinicId) {
    throw new Error('Cannot disable the owner account');
  }

  const update: Partial<ClinicMember & UserClinicProfile> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'DISABLED' && disabledReason) {
    (update as ClinicMember).disabledReason = disabledReason;
  }

  await Promise.all([
    setDoc(doc(membersCollection(clinicId), memberId), update, { merge: true }),
    setDoc(doc(usersCollection, memberId), update, { merge: true }),
  ]);

  // PHASE T: Log MEMBER_REMOVED for soft delete
  const auditAction = status === 'REMOVED' ? 'MEMBER_REMOVED' : 'MEMBER_STATUS_CHANGED';

  await writeAuditLog({
    clinicId,
    actorId: params.actorId || 'owner',
    actorName: params.actorName,
    action: auditAction as any,
    targetId: memberId,
    details: { status },
  });
}

// PHASE T: Helper function to remove (soft delete) a member
export async function removeMember(params: {
  clinicId: string;
  actingRole: string;
  memberId: string;
  actorId?: string;
  actorName?: string;
}): Promise<void> {
  return setMemberStatus({
    ...params,
    status: 'REMOVED',
  });
}
