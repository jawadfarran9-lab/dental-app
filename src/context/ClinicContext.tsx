import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClinicRole, MemberStatus } from '@/src/types/members';

type ClinicUser = {
  id: string;
  memberId?: string;
  role?: ClinicRole;
  status?: MemberStatus;
};

type ClinicContextType = {
  clinicUser: ClinicUser | null;
  clinicId: string | null;
  memberId: string | null;
  role: ClinicRole | null;
  status: MemberStatus | null;
  loading: boolean;
  logout: () => Promise<void>;
  setClinicSession: (id: string, memberId?: string, role?: ClinicRole, status?: MemberStatus) => Promise<void>;
};

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [clinicUser, setClinicUser] = useState<ClinicUser | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [role, setRole] = useState<ClinicRole | null>(null);
  const [status, setStatus] = useState<MemberStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const CLINIC_ID_KEY = 'clinicId';
  const CLINIC_MEMBER_ID_KEY = 'clinicMemberId';
  const CLINIC_ROLE_KEY = 'clinicRole';
  const CLINIC_STATUS_KEY = 'clinicMemberStatus';

  useEffect(() => {
    // Load clinicId from AsyncStorage on mount
    const loadSession = async () => {
      try {
        const [storedClinicId, storedMemberId, storedRole, storedStatus] = await AsyncStorage.multiGet([
          CLINIC_ID_KEY,
          CLINIC_MEMBER_ID_KEY,
          CLINIC_ROLE_KEY,
          CLINIC_STATUS_KEY,
        ]);

        const resolvedClinicId = storedClinicId[1];
        const resolvedMemberId = storedMemberId[1] || null;
        const resolvedRole = (storedRole[1] as ClinicRole | '') || null;
        const resolvedStatus = (storedStatus[1] as MemberStatus | '') || null;

        if (resolvedClinicId) {
          setClinicId(resolvedClinicId);
          setMemberId(resolvedMemberId);
          setRole(resolvedRole || null);
          setStatus(resolvedStatus || null);
          setClinicUser({
            id: resolvedClinicId,
            memberId: resolvedMemberId || undefined,
            role: resolvedRole || undefined,
            status: resolvedStatus || undefined,
          });
        }
      } catch (error) {
        console.error('Error loading clinic session:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const setClinicSession = async (id: string, member?: string, memberRole?: ClinicRole, memberStatus?: MemberStatus) => {
    try {
      const updates: [string, string][] = [[CLINIC_ID_KEY, id]];
      if (member !== undefined) {
        updates.push([CLINIC_MEMBER_ID_KEY, member || '']);
      }
      if (memberRole !== undefined) {
        updates.push([CLINIC_ROLE_KEY, memberRole || '']);
      }
      if (memberStatus !== undefined) {
        updates.push([CLINIC_STATUS_KEY, memberStatus || '']);
      }

      await AsyncStorage.multiSet(updates);
      setClinicId(id);
      if (member !== undefined) setMemberId(member || null);
      if (memberRole !== undefined) setRole(memberRole || null);
      if (memberStatus !== undefined) setStatus(memberStatus || null);
      setClinicUser({
        id,
        memberId: member !== undefined ? member || undefined : memberId || undefined,
        role: memberRole !== undefined ? memberRole : role || undefined,
        status: memberStatus !== undefined ? memberStatus : status || undefined,
      });
    } catch (error) {
      console.error('Error saving clinic session:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        CLINIC_ID_KEY,
        CLINIC_MEMBER_ID_KEY,
        CLINIC_ROLE_KEY,
        CLINIC_STATUS_KEY,
      ]);
      setClinicId(null);
      setMemberId(null);
      setRole(null);
      setStatus(null);
      setClinicUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <ClinicContext.Provider
      value={{ clinicUser, clinicId, memberId, role, status, loading, logout, setClinicSession }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
