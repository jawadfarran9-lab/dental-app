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
 * Hook to check user's subscription status and AI access
 * Returns subscription tier and whether user has AI Pro access
 */
export function useSubscriptionStatus(): SubscriptionStatus {
  const { userRole, clinicId } = useAuth();
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

        // For clinic users, check stored subscription
        if (userRole === 'clinic' && clinicId) {
          const [storedPlan, aiProFlag] = await AsyncStorage.multiGet([
            'clinicSubscriptionPlan',
            'clinicIncludeAIPro',
          ]);
          const plan = storedPlan[1];
          const aiProEnabled = aiProFlag[1] === 'true';

          if (plan === 'MONTHLY' || plan === 'ANNUAL') {
            setStatus({
              isSubscribed: true,
              tier: plan as SubscriptionTier,
              hasAIAccess: aiProEnabled,
              isLoading: false,
              error: null,
            });
          } else {
            setStatus({
              isSubscribed: false,
              tier: null,
              hasAIAccess: false,
              isLoading: false,
              error: null,
            });
          }
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
  }, [userRole, clinicId]);

  return status;
}
