import { useAuth } from '@/src/hooks/useAuth';

/**
 * Returns `true` only when the current clinic has an active subscription.
 * Reads directly from AuthContext — no Firestore calls, no side effects.
 */
export function useHasActiveSubscription(): boolean {
  const { isSubscribed } = useAuth();
  return isSubscribed === true;
}
