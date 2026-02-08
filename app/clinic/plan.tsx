import { useAuth } from '@/src/context/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function PlanRedirect() {
  const { userRole, clinicRole } = useAuth();
  useEffect(() => {
    // If a clinic user is logged in but not an owner, go home
    if (userRole === 'clinic' && clinicRole !== 'owner') {
      router.replace('/(tabs)/home');
      return;
    }
    // Otherwise show the plan selection UI by redirecting to the unified subscribe page
    router.replace('/clinic/subscribe');
  }, [userRole, clinicRole]);

  return null;
}