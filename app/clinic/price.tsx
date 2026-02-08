import { useAuth } from '@/src/context/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function PriceRedirect() {
  const { userRole, clinicRole } = useAuth();
  useEffect(() => {
    // If a clinic user is logged in but not an owner, go home
    if (userRole === 'clinic' && clinicRole !== 'owner') {
      router.replace('/(tabs)/home');
      return;
    }
    // Otherwise show the pricing page content by redirecting to existing subscribe page
    router.replace('/clinic/subscribe');
  }, [userRole, clinicRole]);

  return null;
}