import { patientAuth } from '@/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

/**
 * True once patientAuth.currentUser is present (fresh sign-in or rehydrated
 * on cold start). Patient screens gate their patientDb reads on this so the
 * reads carry the patient identity before Phase-6 rules evaluate them.
 */
export function usePatientAuthReady(): boolean {
  const [ready, setReady] = useState<boolean>(() => patientAuth.currentUser != null);
  useEffect(() => {
    if (patientAuth.currentUser) {
      setReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(patientAuth, (user) => {
      if (user) {
        setReady(true);
        unsubscribe();
      }
    });
    return unsubscribe;
  }, []);
  return ready;
}
