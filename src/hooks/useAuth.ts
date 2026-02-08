import type { AuthState } from '@/src/context/AuthContext';
import { AuthContext } from '@/src/context/AuthContext';
import { useContext } from 'react';

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  
  if (!context) {
    // Return default state if context not available
    return {
      userRole: null,
      userId: null,
      clinicId: null,
      memberId: null,
      clinicRole: null,
      memberStatus: null,
      isSubscribed: null,
      isDetailsComplete: null,
      loading: true,
      error: 'AuthContext not available',
    };
  }

  return context;
}
