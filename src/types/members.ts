// Simplified roles: owner (clinic owner) and doctor (staff/employee)
export type ClinicRole = 'owner' | 'doctor';

// PHASE T: Added REMOVED for soft delete
export type MemberStatus = 'ACTIVE' | 'DISABLED' | 'REMOVED';

export interface ClinicMember {
  id: string;
  clinicId: string;
  displayName: string;
  email: string;
  role: ClinicRole;
  status: MemberStatus;
  invitedBy?: string;
  phoneNumber?: string;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
  disabledReason?: string;
  password?: string;
}

export interface UserClinicProfile {
  clinicId: string;
  role: ClinicRole;
  status: MemberStatus;
  email: string;
  displayName: string;
  password?: string;
  lastLoginAt?: any;
}
