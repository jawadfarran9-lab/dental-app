import { useAuth } from '@/src/hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type SubscriptionTier = 'MONTHLY' | 'ANNUAL' | null;

export interface SubscriptionStatus {
  isSubscribed: boolean;
  tier: SubscriptionTier;
  hasAIAccess: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to check user's subscription status and AI access.
 *
 * Access authority derives strictly from Firestore status field
 * (via AuthContext.isSubscribed, backed by hasActiveSubscription helper).
 *
 * AsyncStorage is used only for cosmetic tier/plan display — never for access control.
 */
export function useSubscriptionStatus(): SubscriptionStatus {
  const { userRole, clinicId, isSubscribed: authIsSubscribed } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    tier: null,
    hasAIAccess: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }));

        // Patient users (non-clinic) get AI access by default for now
        if (userRole === 'patient') {
          setStatus({
            isSubscribed: true,
            tier: 'MONTHLY',
            hasAIAccess: true,
            isLoading: false,
            error: null,
          });
          return;
        }

        // For clinic users — access authority derives strictly from Firestore status field
        if (userRole === 'clinic' && clinicId) {
          const subscribed = authIsSubscribed === true;

          // AsyncStorage used only for display tier — never for access control
          let displayTier: SubscriptionTier = null;
          let aiProEnabled = false;
          try {
            const [storedPlan, aiProFlag] = await AsyncStorage.multiGet([
              'clinicSubscriptionPlan',
              'clinicIncludeAIPro',
            ]);
            const plan = storedPlan[1];
            if (plan === 'MONTHLY' || plan === 'ANNUAL') {
              displayTier = plan as SubscriptionTier;
            }
            aiProEnabled = aiProFlag[1] === 'true';
          } catch {
            // Cache read failure is non-fatal — access decision unaffected
          }

          setStatus({
            isSubscribed: subscribed,
            tier: subscribed ? displayTier : null,
            hasAIAccess: subscribed && aiProEnabled,
            isLoading: false,
            error: null,
          });
          return;
        }

        // Unauthenticated user - AI access demo allowed
        setStatus({
          isSubscribed: false,
          tier: null,
          hasAIAccess: true, // Demo mode
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to check subscription status',
        }));
      }
    };

    checkSubscription();
  }, [userRole, clinicId, authIsSubscribed]);

  return status;
}
