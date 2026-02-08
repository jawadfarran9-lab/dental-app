import { useAuth } from '@/src/context/AuthContext';
import { ClinicRole } from '@/src/types/members';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Guard hook to ensure only clinic users can access a route
 * If patient is logged in, redirects to patient login
 * If no user is logged in, allows access (will redirect from home)
 */
export function useClinicGuard() {
  const router = useRouter();
  const { userRole, loading, memberStatus, logout, userId, clinicId } = useAuth();

  useEffect(() => {
    if (!loading && userRole === 'patient') {
      router.replace('/patient' as any);
    }
    // PHASE T: Block DISABLED or REMOVED members
    if (!loading && userRole === 'clinic' && (memberStatus === 'DISABLED' || memberStatus === 'REMOVED')) {
      try {
        const action = memberStatus === 'REMOVED' ? 'SESSION_INVALIDATED' : 'LOGIN_BLOCKED';
        const { writeAuditLog } = require('@/src/services/auditLogService');
        writeAuditLog({
          action,
          actorId: userId,
          clinicId: clinicId,
          meta: { status: memberStatus },
        });
      } catch (e) {}
      logout();
      router.replace('/clinic/login' as any);
    }
  }, [userRole, loading, memberStatus, logout]);
}

export function useClinicRoleGuard(allowedRoles: ClinicRole[]) {
  const router = useRouter();
  const { userRole, clinicRole, memberStatus, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (userRole !== 'clinic') {
      router.replace('/clinic/login' as any);
      return;
    }

    // PHASE T: Block DISABLED or REMOVED members
    if (memberStatus === 'DISABLED' || memberStatus === 'REMOVED') {
      logout();
      router.replace('/clinic/login' as any);
      return;
    }

    if (!allowedRoles.includes(clinicRole as ClinicRole)) {
      router.replace('/clinic/dashboard' as any);
    }
  }, [allowedRoles, userRole, clinicRole, memberStatus, loading, logout]);
}

/**
 * Guard hook to ensure only patient users can access a route
 * If clinic is logged in, redirects to clinic dashboard
 * If no user is logged in, allows access (will redirect from home)
 */
export function usePatientGuard() {
  const router = useRouter();
  const { userRole, loading } = useAuth();

  useEffect(() => {
    if (!loading && userRole === 'clinic') {
      router.replace('/clinic/login' as any);
    }
  }, [userRole, loading]);
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
