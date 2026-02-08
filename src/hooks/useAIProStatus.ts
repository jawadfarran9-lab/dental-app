import { db } from '@/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

export interface AIProStatus {
  /**
   * Whether the clinic has AI Pro enabled (includeAIPro flag)
   */
  hasAIPro: boolean;

  /**
   * AI Pro price ($9.99/month)
   */
  aiProPrice: number;

  /**
   * Whether data is currently loading
   */
  isLoading: boolean;

  /**
   * Any error encountered while checking status
   */
  error: string | null;

  /**
   * The subscription tier (PRO, PRO_AI, etc)
   */
  subscriptionTier: string | null;

  /**
   * Final subscription price including AI Pro if enabled
   */
  finalPrice: number | null;
}

/**
 * Hook to check if clinic has AI Pro subscription enabled
 * Reads from Firestore and caches in AsyncStorage
 *
 * Returns:
 * - hasAIPro: boolean indicating if AI Pro is active
 * - aiProPrice: $9.99 constant
 * - isLoading: whether data is being fetched
 * - error: any error message
 * - subscriptionTier: current subscription plan
 * - finalPrice: total price including AI Pro
 */
export function useAIProStatus(): AIProStatus {
  const { userRole, clinicId } = useAuth();
  const [status, setStatus] = useState<AIProStatus>({
    hasAIPro: false,
    aiProPrice: 9.99,
    isLoading: true,
    error: null,
    subscriptionTier: null,
    finalPrice: null,
  });

  /**
   * Refresh AI Pro status from Firestore
   */
  const refreshFromFirestore = useCallback(async (targetClinicId: string) => {
    try {
      const clinicSnap = await getDoc(doc(db, 'clinics', targetClinicId));
      
      if (clinicSnap.exists()) {
        const data = clinicSnap.data();
        const hasAIPro = data.includeAIPro === true;
        const tier = data.subscriptionPlan || null;
        const finalPrice = data.subscriptionPriceWithAIPro || data.subscriptionPrice || null;

        // Cache in AsyncStorage
        await AsyncStorage.multiSet([
          ['clinicIncludeAIPro', String(hasAIPro)],
          ['clinicSubscriptionTier', String(tier)],
          ['clinicFinalPrice', String(finalPrice || 0)],
        ]);

        return { hasAIPro, tier, finalPrice };
      }

      return { hasAIPro: false, tier: null, finalPrice: null };
    } catch (error) {
      throw new Error('Failed to fetch AI Pro status from Firestore');
    }
  }, []);

  /**
   * Load AI Pro status from cache (AsyncStorage) first, then refresh from Firestore if needed
   */
  useEffect(() => {
    const loadAIProStatus = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }));

        // For patients, check if they have demo access
        if (userRole === 'patient') {
          setStatus({
            hasAIPro: true, // Patients get demo access
            aiProPrice: 9.99,
            isLoading: false,
            error: null,
            subscriptionTier: 'PATIENT_DEMO',
            finalPrice: 0, // No charge for demo
          });
          return;
        }

        // For clinic users, check from Firestore
        if (userRole === 'clinic' && clinicId) {
          const result = await refreshFromFirestore(clinicId);
          const basePrice = result.tier === 'PRO_AI' ? 19.99 : 30;

          setStatus({
            hasAIPro: result.hasAIPro,
            aiProPrice: 9.99,
            isLoading: false,
            error: null,
            subscriptionTier: result.tier,
            finalPrice: result.finalPrice || (result.hasAIPro ? basePrice + 9.99 : basePrice),
          });
          return;
        }

        // Unauthenticated or clinic user without ID
        const cachedAIPro = await AsyncStorage.getItem('clinicIncludeAIPro');
        const hasAIPro = cachedAIPro === 'true';

        setStatus({
          hasAIPro,
          aiProPrice: 9.99,
          isLoading: false,
          error: null,
          subscriptionTier: await AsyncStorage.getItem('clinicSubscriptionTier'),
          finalPrice: Number(await AsyncStorage.getItem('clinicFinalPrice')) || null,
        });
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    };

    loadAIProStatus();
  }, [userRole, clinicId, refreshFromFirestore]);

  return status;
}
