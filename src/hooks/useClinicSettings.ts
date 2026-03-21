import {
    ClinicPreferences,
    DEFAULT_PREFERENCES,
    subscribeToClinicPreferences,
} from '@/services/clinicPreferencesService';
import { useEffect, useState } from 'react';

/**
 * Real-time hook for clinic preferences.
 * Subscribes to Firestore and returns the latest ClinicPreferences.
 */
export function useClinicSettings(clinicId: string | null | undefined) {
  const [prefs, setPrefs] = useState<ClinicPreferences>(
    { ...DEFAULT_PREFERENCES, updatedAt: null } as ClinicPreferences,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToClinicPreferences(clinicId, (p) => {
      setPrefs(p);
      setLoading(false);
    });

    return unsubscribe;
  }, [clinicId]);

  return { prefs, loading };
}
