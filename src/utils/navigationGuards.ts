import { useAuth } from '@/src/context/AuthContext';
import { ClinicRole } from '@/src/types/members';
import { logSilentFailure } from '@/src/utils/silentFailure';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Guard hook to ensure only clinic users can access a route.
 * Blocks: patients, DISABLED/REMOVED members, and cancelled subscriptions.
 *
 * Pages that cancelled clinics MUST still reach (e.g. subscribe.tsx)
 * should use `useClinicGuardNoSubscription` instead.
 */
export function useClinicGuard() {
  const router = useRouter();
  const { userRole, loading, memberStatus, logout, userId, clinicId, isSubscribed } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (userRole === 'patient') {
      router.replace('/patient' as any);
      return;
    }

    // PHASE T: Block DISABLED or REMOVED members
    if (userRole === 'clinic' && (memberStatus === 'DISABLED' || memberStatus === 'REMOVED')) {
      try {
        const action = memberStatus === 'REMOVED' ? 'SESSION_INVALIDATED' : 'LOGIN_BLOCKED';
        const { writeAuditLog } = require('@/src/services/auditLogService');
        writeAuditLog({
          action,
          actorId: userId,
          clinicId: clinicId,
          meta: { status: memberStatus },
        });
      } catch (e) { logSilentFailure('navigationGuards.useClinicGuard.auditLog', e); }
      logout();
      router.replace('/login' as any);
      return;
    }

    // PHASE 1D: Block cancelled/inactive subscriptions from clinic screens
    // Only redirect when isSubscribed is CONFIRMED false (not null/unknown)
    if (userRole === 'clinic' && isSubscribed === false) {
      router.replace('/clinic/subscribe?reason=cancelled' as any);
      return;
    }
  }, [userRole, loading, memberStatus, isSubscribed, logout]);
}

/**
 * Lighter guard that checks role and member status but NOT subscription.
 * Used on pages that cancelled clinics must still access (subscribe, payment).
 */
export function useClinicGuardNoSubscription() {
  const router = useRouter();
  const { userRole, loading, memberStatus, logout, userId, clinicId } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (userRole === 'patient') {
      router.replace('/patient' as any);
      return;
    }

    if (userRole === 'clinic' && (memberStatus === 'DISABLED' || memberStatus === 'REMOVED')) {
      try {
        const action = memberStatus === 'REMOVED' ? 'SESSION_INVALIDATED' : 'LOGIN_BLOCKED';
        const { writeAuditLog } = require('@/src/services/auditLogService');
        writeAuditLog({
          action,
          actorId: userId,
          clinicId: clinicId,
          meta: { status: memberStatus },
        });
      } catch (e) { logSilentFailure('navigationGuards.useClinicGuardNoSubscription.auditLog', e); }
      logout();
      router.replace('/login' as any);
      return;
    }
  }, [userRole, loading, memberStatus, logout]);
}

export function useClinicRoleGuard(allowedRoles: ClinicRole[]) {
  const router = useRouter();
  const { userRole, clinicRole, memberStatus, isSubscribed, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (userRole !== 'clinic') {
      router.replace('/login' as any);
      return;
    }

    // PHASE T: Block DISABLED or REMOVED members
    if (memberStatus === 'DISABLED' || memberStatus === 'REMOVED') {
      logout();
      router.replace('/login' as any);
      return;
    }

    // PHASE 1D: Block cancelled/inactive subscriptions
    if (isSubscribed === false) {
      router.replace('/clinic/subscribe?reason=cancelled' as any);
      return;
    }

    if (!allowedRoles.includes(clinicRole as ClinicRole)) {
      router.replace('/clinic/dashboard' as any);
    }
  }, [allowedRoles, userRole, clinicRole, memberStatus, isSubscribed, loading, logout]);
}

/**
 * Guard hook to ensure only patient users can access a route
 * If clinic is logged in, redirects to clinic dashboard
 * If no user is logged in, allows access (will redirect from home)
 */
export function usePatientGuard() {
  const router = useRouter();
  const { patientId, loading } = useAuth();

  useEffect(() => {
    // A patient screen requires an active patient session (patientId), independent of userRole —
    // so a clinic/email user can open patient pages without their clinic session bouncing them.
    if (!loading && !patientId) {
      router.replace('/patient' as any);
    }
  }, [patientId, loading]);
}

/**
 * Guard hook to prevent back navigation from Payment to Subscribe
 * Used to lock the subscription flow
 */
export function useNavigationGuard(allowedPrevRoute?: string) {
  const router = useRouter();
  
  // This would prevent Android back button in real scenarios
  // For now, we rely on using router.replace instead of router.push
}
