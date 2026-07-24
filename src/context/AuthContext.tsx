import { auth, db } from '@/firebaseConfig';
import { ensureClinicPublished } from '@/src/services/clinicDirectorySync';
import {
    ensureOwnerMembership,
    fetchMemberProfile,
    recordMemberLogin,
} from '@/src/services/clinicMembersService';
import { ClinicRole, MemberStatus } from '@/src/types/members';
import { logSilentFailure } from '@/src/utils/silentFailure';
import { hasActiveSubscription } from '@/src/utils/subscriptionUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'clinic' | 'patient' | null;

export type ClinicType = 'dental' | 'beauty' | 'laser' | null;

const narrowClinicType = (v: unknown): ClinicType =>
  v === 'dental' || v === 'beauty' || v === 'laser' ? v : null;

export interface AuthState {
  userRole: UserRole;
  userId: string | null;
  clinicId: string | null;
  memberId: string | null;
  clinicRole: ClinicRole | null;
  memberStatus: MemberStatus | null;
  clinicType: ClinicType;
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
  setPatientAuth: (patientId: string, clinicId?: string) => Promise<void>;
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
    clinicType: null,
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
  const PATIENT_CLINIC_ID_KEY = 'patientClinicId';

  /** All auth-related storage keys — single source of truth for deterministic cleanup */
  const ALL_AUTH_KEYS = [CLINIC_ID_KEY, CLINIC_MEMBER_ID_KEY, CLINIC_ROLE_KEY, CLINIC_STATUS_KEY, PATIENT_ID_KEY, PATIENT_CLINIC_ID_KEY];

  /**
   * Check subscription status for clinic
   */
  const checkClinicSubscription = async (clinicId: string): Promise<{ subscribed: boolean | null; detailsComplete: boolean; clinicMissing?: boolean; clinicType: ClinicType }> => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      const clinicSnap = await getDoc(clinicRef);

      if (!clinicSnap.exists()) {
        return { subscribed: null, detailsComplete: false, clinicMissing: true, clinicType: null };
      }

      const clinicData = clinicSnap.data();
      const subscribed = hasActiveSubscription(clinicData);

      // Check if clinic details are complete (clinicName required)
      const detailsComplete = !!(clinicData.clinicName && clinicData.clinicName.trim());

      // Auto-sync to public directory (fire-and-forget, non-blocking)
      if (subscribed && detailsComplete) {
        ensureClinicPublished(clinicId, clinicData).catch((err) => {
          logSilentFailure('authContext.ensureClinicPublished', err);
        });
      }

      return { subscribed, detailsComplete, clinicType: narrowClinicType(clinicData.clinicType) };
    } catch (error) {
      console.error('[AUTH] Error checking clinic subscription:', error);
      // Return null (unknown) — never flip to false on transient errors
      return { subscribed: null, detailsComplete: false, clinicType: null };
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
      const storedRole = await AsyncStorage.getItem(CLINIC_ROLE_KEY);
      const storedStatus = await AsyncStorage.getItem(CLINIC_STATUS_KEY);
      const patientId = await AsyncStorage.getItem(PATIENT_ID_KEY);
      const patientClinicId = await AsyncStorage.getItem(PATIENT_CLINIC_ID_KEY);

      // ── Unified clinicId path: subscription check runs identically on Web & Native ──
      // If clinicId exists in storage, ALWAYS run checkClinicSubscription first.
      // Member keys (clinicMemberId/Role/Status) enrich the session but never
      // block subscription detection — this guarantees platform parity.
      if (clinicId) {
        const subResult = await checkClinicSubscription(clinicId);

        if (subResult.clinicMissing) {
          await AsyncStorage.multiRemove(ALL_AUTH_KEYS);
          setAuthState({ userRole: null, userId: null, clinicId: null, memberId: null, clinicRole: null, memberStatus: null, clinicType: null, isSubscribed: null, isDetailsComplete: null, loading: false, error: null });
          return;
        }

        // If all member keys are present, resolve full session with member profile
        if (storedMemberId && storedRole && storedStatus) {
          const clinicSnap = await getDoc(doc(db, 'clinics', clinicId));
          if (!clinicSnap.exists()) {
            await AsyncStorage.multiRemove(ALL_AUTH_KEYS);
            setAuthState({ userRole: null, userId: null, clinicId: null, memberId: null, clinicRole: null, memberStatus: null, clinicType: null, isSubscribed: null, isDetailsComplete: null, loading: false, error: null });
            return;
          }
          const memberId = storedMemberId || clinicId;
          const memberProfile = await fetchMemberProfile(clinicId, memberId);
          const clinicEmail = clinicSnap.data()?.email || '';
          const resolvedMember =
            memberProfile || (await ensureOwnerMembership(clinicId, clinicEmail));

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
            clinicType: narrowClinicType(clinicSnap.data()?.clinicType),
            isSubscribed: subResult.subscribed ?? null,
            isDetailsComplete: subResult.detailsComplete,
            loading: false,
            error: null,
          });
        } else {
          // Partial session: clinicId exists but member keys missing
          // (e.g. post-confirm-subscription). Subscription is still resolved
          // from Firestore above — identical to Web's localStorage path.
          // Default clinicRole to 'owner' so useClinicRoleGuard(['owner'])
          // does not eject the user to /clinic/dashboard on mobile where
          // Firebase Auth persistence is fully cleared after signOut.
          setAuthState({
            userRole: 'clinic',
            userId: clinicId,
            clinicId,
            memberId: null,
            clinicRole: 'owner',
            memberStatus: null,
            clinicType: subResult.clinicType,
            isSubscribed: subResult.subscribed ?? null,
            isDetailsComplete: subResult.detailsComplete,
            loading: false,
            error: null,
          });
        }
        return;
      } else if (patientId) {
        setAuthState({
          userRole: 'patient',
          userId: patientId,
          clinicId: patientClinicId ?? null,
          memberId: null,
          clinicRole: null,
          memberStatus: null,
          clinicType: null,
          isSubscribed: null, // Patients don't have subscription
          isDetailsComplete: null,
          loading: false,
          error: null,
        });
      } else if (auth.currentUser) {
        // ── Fallback: AsyncStorage empty but Firebase Auth session exists ──
        // This recovers the clinic identity on web (localStorage cleared)
        // or after cache-clear on mobile, using the persistent Firebase token.
        const firebaseUid = auth.currentUser.uid;
        const clinicQuery = query(
          collection(db, 'clinics'),
          where('ownerUid', '==', firebaseUid),
        );
        const clinicSnap = await getDocs(clinicQuery);

        if (!clinicSnap.empty) {
          const clinicDoc = clinicSnap.docs[0];
          const restoredClinicId = clinicDoc.id;
          const clinicEmail = clinicDoc.data()?.email ?? '';
          const ownerMember = await ensureOwnerMembership(restoredClinicId, clinicEmail);
          const { subscribed, detailsComplete } = await checkClinicSubscription(restoredClinicId);

          // Re-persist to AsyncStorage so next startup is fast
          await AsyncStorage.multiSet([
            [CLINIC_ID_KEY, restoredClinicId],
            [CLINIC_MEMBER_ID_KEY, ownerMember.id],
            [CLINIC_ROLE_KEY, ownerMember.role],
            [CLINIC_STATUS_KEY, ownerMember.status],
          ]);

          setAuthState({
            userRole: 'clinic',
            userId: restoredClinicId,
            clinicId: restoredClinicId,
            memberId: ownerMember.id,
            clinicRole: ownerMember.role,
            memberStatus: ownerMember.status,
            clinicType: narrowClinicType(clinicDoc.data()?.clinicType),
            isSubscribed: subscribed ?? null,
            isDetailsComplete: detailsComplete,
            loading: false,
            error: null,
          });
        } else {
          // Firebase user exists but no clinic found — treat as guest
          // Clear any stale auth keys so they cannot resurface on next reload
          await AsyncStorage.multiRemove(ALL_AUTH_KEYS);
          setAuthState({
            userRole: null,
            userId: null,
            clinicId: null,
            memberId: null,
            clinicRole: null,
            memberStatus: null,
            clinicType: null,
            isSubscribed: null,
            isDetailsComplete: null,
            loading: false,
            error: null,
          });
        }
      } else {
        // No user logged in — clear any stale auth keys defensively
        await AsyncStorage.multiRemove(ALL_AUTH_KEYS);
        setAuthState({
          userRole: null,
          userId: null,
          clinicId: null,
          memberId: null,
          clinicRole: null,
          memberStatus: null,
          clinicType: null,
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
   * Set clinic authentication after login.
   * Resolves subscription status BEFORE setting loading=false so that
   * consumers never see the invalid (isSubscribed=null, loading=false) state.
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

      // Keep loading=true while we resolve subscription
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      // Resolve subscription and record login in parallel
      const [subResult] = await Promise.all([
        checkClinicSubscription(clinicId),
        status === 'ACTIVE' ? recordMemberLogin(clinicId, memberId) : Promise.resolve(),
      ]);

      // Commit ONE final stable state — subscription is now known
      setAuthState({
        userRole: 'clinic',
        userId: clinicId,
        clinicId,
        memberId,
        clinicRole: role,
        memberStatus: status,
        clinicType: subResult.clinicType,
        isSubscribed: subResult.subscribed ?? null,
        isDetailsComplete: subResult.detailsComplete,
        loading: false,
        error: null,
      });

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
  const setPatientAuth = async (patientId: string, clinicId?: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      await AsyncStorage.setItem(PATIENT_ID_KEY, patientId);
      if (clinicId) {
        await AsyncStorage.setItem(PATIENT_CLINIC_ID_KEY, clinicId);
      } else {
        await AsyncStorage.removeItem(PATIENT_CLINIC_ID_KEY);
      }

      setAuthState({
        userRole: 'patient',
        userId: patientId,
        clinicId: clinicId ?? null,
        memberId: null,
        clinicRole: null,
        memberStatus: null,
        clinicType: null,
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
      await AsyncStorage.multiRemove(ALL_AUTH_KEYS);
    } catch (e) {
      logSilentFailure('authContext.logout.clearStorage', e);
    }
    // Clear biometric credentials on logout
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync('clinic_credentials');
      await SecureStore.deleteItemAsync('biometric_enabled');
    } catch (e) {
      logSilentFailure('authContext.logout.clearBiometric', e);
    }
    // End Firebase Auth session so no ghost user persists
    try {
      await signOut(auth);
    } catch (e) {
      logSilentFailure('authContext.logout.signOut', e);
    }
    // Always reset in-memory state, even if a cleanup step failed —
    // otherwise the app keeps treating the user as logged in.
    setAuthState({
      userRole: null,
      userId: null,
      clinicId: null,
      memberId: null,
      clinicRole: null,
      memberStatus: null,
      clinicType: null,
      isSubscribed: null,
      isDetailsComplete: null,
      loading: false,
      error: null,
    });
  };

  /**
   * Run startup check on mount.
   * Wait for Firebase Auth to resolve its persisted session first so that
   * the fallback branch inside checkAuthState can read auth.currentUser.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      // Called once Firebase Auth has determined the current user
      // (either restored from token or null). Run our async check once.
      unsubscribe();
      checkAuthState();
    });

    return () => unsubscribe();
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
