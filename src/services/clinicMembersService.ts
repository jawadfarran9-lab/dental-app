import { auth, db, functions } from '@/firebaseConfig';
import { ClinicMember, UserClinicProfile } from '@/src/types/members';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
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

/**
 * F1 — resolve the owner's clinicId via the users/{uid}.clinicId mirror.
 * The legacy `where('ownerUid'==uid)` fallback has been removed; if the
 * mirror is missing, callers get null and should re-authenticate so the
 * server-side assignOwnerClaims writes the mirror.
 */
export async function resolveClinicIdForUid(uid: string): Promise<string | null> {
  try {
    const mirrorSnap = await getDoc(doc(db, 'users', uid));
    if (mirrorSnap.exists()) {
      const cid = (mirrorSnap.data() as { clinicId?: unknown } | undefined)?.clinicId;
      if (typeof cid === 'string' && cid.length > 0) return cid;
    }
  } catch {
    // Non-blocking read failure.
  }
  return null;
}

export async function ensureOwnerClaims(expectedClinicId?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const tr = await user.getIdTokenResult();
    if (tr.claims.role === 'owner' && (!expectedClinicId || tr.claims.clinicId === expectedClinicId)) {
      return; // claims already present and correct — cheap cached path
    }
    await httpsCallable(functions, 'assignOwnerClaims')();
    await user.getIdToken(true); // force refresh so Firestore sees the new claims
  } catch (e) {
    console.warn('[ensureOwnerClaims] failed (non-fatal):', e);
  }
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

  return baseMember;
}

export async function recordMemberLogin(clinicId: string, memberId: string): Promise<void> {
  const now = serverTimestamp();
  const memberRef = doc(membersCollection(clinicId), memberId);

  // Fetch member name for audit log
  const memberSnap = await getDoc(memberRef);
  const memberData = memberSnap.exists() ? memberSnap.data() : null;
  const memberName = memberData?.displayName || 'Unknown';

  const writes: Promise<void>[] = [
    setDoc(memberRef, { lastLoginAt: now }, { merge: true }),
  ];
  // Only mirror to users/{memberId} when memberId matches the auth uid
  // (doctor path). Owners use memberId=clinicId which does NOT match uid,
  // and the users/{uid} rule requires request.auth.uid == uid; the F1
  // mirror at users/{ownerUid} is written server-side by assignOwnerClaims.
  if (auth.currentUser && memberId === auth.currentUser.uid) {
    writes.push(setDoc(doc(usersCollection, memberId), { lastLoginAt: now }, { merge: true }));
  }
  await Promise.all(writes);

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
  };

  await setDoc(memberRef, newMember, { merge: true });

  const userProfile: UserClinicProfile = {
    clinicId: params.clinicId,
    role: params.member.role,
    status: 'ACTIVE',
    email,
    displayName: params.member.displayName,
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
    ...(params.actorName !== undefined && { actorName: params.actorName }),
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
