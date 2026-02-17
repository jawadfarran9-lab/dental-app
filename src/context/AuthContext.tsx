import { db } from '@/firebaseConfig';
import { ensureClinicPublished } from '@/src/services/clinicDirectorySync';
import {
    ensureOwnerMembership,
    fetchMemberProfile,
    recordMemberLogin,
} from '@/src/services/clinicMembersService';
import { ClinicRole, MemberStatus } from '@/src/types/members';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'clinic' | 'patient' | null;

export interface AuthState {
  userRole: UserRole;
  userId: string | null;
  clinicId: string | null;
  memberId: string | null;
  clinicRole: ClinicRole | null;
  memberStatus: MemberStatus | null;
  isSubscribed: boolean | null;
  isDetailsComplete: boolean | null;
  loading: boolean;
  error: string | null;
}

type ClinicAuthPayload = {
  clinicId: string;
  memberId: string;
  role: ClinicRole;
  status: MemberStatus;
};

interface AuthContextType extends AuthState {
  setClinicAuth: (payload: ClinicAuthPayload) => Promise<void>;
  setPatientAuth: (patientId: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    userRole: null,
    userId: null,
    clinicId: null,
    memberId: null,
    clinicRole: null,
    memberStatus: null,
    isSubscribed: null,
    isDetailsComplete: null,
    loading: true,
    error: null,
  });

  const CLINIC_ID_KEY = 'clinicId';
  const CLINIC_MEMBER_ID_KEY = 'clinicMemberId';
  const CLINIC_ROLE_KEY = 'clinicRole';
  const CLINIC_STATUS_KEY = 'clinicMemberStatus';
  const PATIENT_ID_KEY = 'patientId';

  /**
   * Check subscription status for clinic
   */
  const checkClinicSubscription = async (clinicId: string): Promise<{ subscribed: boolean; detailsComplete: boolean }> => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      const clinicSnap = await getDoc(clinicRef);

      if (!clinicSnap.exists()) {
        throw new Error('Clinic not found');
      }

      const clinicData = clinicSnap.data();
      const subscribed = clinicData.subscribed === true;
      
      // Check if clinic details are complete (clinicName required)
      const detailsComplete = !!(clinicData.clinicName && clinicData.clinicName.trim());

      // Auto-sync to public directory (fire-and-forget, non-blocking)
      if (subscribed && detailsComplete) {
        ensureClinicPublished(clinicId, clinicData).catch(() => {});
      }

      return { subscribed, detailsComplete };
    } catch (error) {
      console.error('[AUTH] Error checking clinic subscription:', error);
      return { subscribed: false, detailsComplete: false };
    }
  };

  /**
   * Startup check: Verify auth state on app launch
   * This runs once when app initializes
   */
  const checkAuthState = async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const clinicId = await AsyncStorage.getItem(CLINIC_ID_KEY);
      const storedMemberId = await AsyncStorage.getItem(CLINIC_MEMBER_ID_KEY);
      const patientId = await AsyncStorage.getItem(PATIENT_ID_KEY);

      // Determine which role to use (clinic takes priority)
      if (clinicId) {
        const memberId = storedMemberId || clinicId;
        const memberProfile = await fetchMemberProfile(clinicId, memberId);
        const clinicSnap = await getDoc(doc(db, 'clinics', clinicId));
        const clinicEmail = clinicSnap.exists() ? clinicSnap.data()?.email : '';
        const resolvedMember =
          memberProfile || (await ensureOwnerMembership(clinicId, clinicEmail));
        const { subscribed, detailsComplete } = await checkClinicSubscription(clinicId);

        // PHASE T: Block DISABLED or REMOVED members from logging in
        if (resolvedMember.status === 'DISABLED' || resolvedMember.status === 'REMOVED') {
          await logout();
          setAuthState((prev) => ({
            ...prev,
            loading: false,
            error: resolvedMember.status === 'REMOVED' 
              ? 'Your membership has been removed. Please contact the clinic owner.'
              : 'Account disabled. Please contact the clinic owner.',
          }));
          return;
        }

        await AsyncStorage.multiSet([
          [CLINIC_ID_KEY, clinicId],
          [CLINIC_MEMBER_ID_KEY, resolvedMember.id],
          [CLINIC_ROLE_KEY, resolvedMember.role],
          [CLINIC_STATUS_KEY, resolvedMember.status],
        ]);

        setAuthState({
          userRole: 'clinic',
          userId: clinicId,
          clinicId,
          memberId: resolvedMember.id,
          clinicRole: resolvedMember.role,
          memberStatus: resolvedMember.status,
          isSubscribed: subscribed,
          isDetailsComplete: detailsComplete,
          loading: false,
          error: null,
        });
      } else if (patientId) {
        setAuthState({
          userRole: 'patient',
          userId: patientId,
          clinicId: null,
          memberId: null,
          clinicRole: null,
          memberStatus: null,
          isSubscribed: null, // Patients don't have subscription
          isDetailsComplete: null,
          loading: false,
          error: null,
        });
      } else {
        // No user logged in
        setAuthState({
          userRole: null,
          userId: null,
          clinicId: null,
          memberId: null,
          clinicRole: null,
          memberStatus: null,
          isSubscribed: null,
          isDetailsComplete: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('[AUTH] Error checking auth state:', error);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to verify authentication',
      }));
    }
  };

  /**
   * Set clinic authentication after login
   * Optimized for fast navigation - subscription check runs in background
   */
  const setClinicAuth = async ({ clinicId, memberId, role, status }: ClinicAuthPayload) => {
    try {
      // Save to AsyncStorage first (fast operation)
      await AsyncStorage.multiSet([
        [CLINIC_ID_KEY, clinicId],
        [CLINIC_MEMBER_ID_KEY, memberId],
        [CLINIC_ROLE_KEY, role],
        [CLINIC_STATUS_KEY, status],
      ]);
      // Clear patient session if switching to clinic
      await AsyncStorage.removeItem(PATIENT_ID_KEY);

      // Set state immediately for fast navigation (don't wait for subscription check)
      setAuthState({
        userRole: 'clinic',
        userId: clinicId,
        clinicId,
        memberId,
        clinicRole: role,
        memberStatus: status,
        isSubscribed: null,  // Will be updated in background
        isDetailsComplete: null,
        loading: false,
        error: null,
      });

      // Run subscription check and login record in background (non-blocking)
      Promise.all([
        checkClinicSubscription(clinicId).then(({ subscribed, detailsComplete }) => {
          setAuthState(prev => ({
            ...prev,
            isSubscribed: subscribed,
            isDetailsComplete: detailsComplete,
          }));
        }),
        status === 'ACTIVE' ? recordMemberLogin(clinicId, memberId) : Promise.resolve(),
      ]).catch(err => console.warn('[AUTH] Background tasks failed:', err));

    } catch (error) {
      console.error('[AUTH] Error setting clinic auth:', error);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to set clinic authentication',
      }));
      throw error;
    }
  };

  /**
   * Set patient authentication after login
   */
  const setPatientAuth = async (patientId: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      await AsyncStorage.setItem(PATIENT_ID_KEY, patientId);
      // Clear clinic session if switching to patient
      await AsyncStorage.multiRemove([
        CLINIC_ID_KEY,
        CLINIC_MEMBER_ID_KEY,
        CLINIC_ROLE_KEY,
        CLINIC_STATUS_KEY,
      ]);

      setAuthState({
        userRole: 'patient',
        userId: patientId,
        clinicId: null,
        memberId: null,
        clinicRole: null,
        memberStatus: null,
        isSubscribed: null,
        isDetailsComplete: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('[AUTH] Error setting patient auth:', error);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to set patient authentication',
      }));
      throw error;
    }
  };

  /**
   * Logout: Clear all auth data
   */
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        CLINIC_ID_KEY,
        CLINIC_MEMBER_ID_KEY,
        CLINIC_ROLE_KEY,
        CLINIC_STATUS_KEY,
        PATIENT_ID_KEY,
      ]);
      setAuthState({
        userRole: null,
        userId: null,
        clinicId: null,
        memberId: null,
        clinicRole: null,
        memberStatus: null,
        isSubscribed: null,
        isDetailsComplete: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('[AUTH] Error logging out:', error);
    }
  };

  /**
   * Run startup check on mount
   */
  useEffect(() => {
    checkAuthState();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        setClinicAuth,
        setPatientAuth,
        logout,
        checkAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
