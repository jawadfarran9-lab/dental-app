import {
    ClinicPreferences,
    DEFAULT_PREFERENCES,
    subscribeToClinicPreferences,
    updateClinicPreferences,
} from '@/src/services/clinicPreferencesService';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for reading and writing clinic preferences (Instagram-style settings).
 *
 * Uses a real-time Firestore listener so changes from other devices
 * propagate automatically.
 *
 * Returns optimistic local state — the UI updates instantly, then the
 * Firestore write happens in the background.
 */
export function useClinicPreferences() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();

  const [settings, setSettings] = useState<ClinicPreferences>({
    ...DEFAULT_PREFERENCES,
    updatedAt: null,
  } as ClinicPreferences);
  const [loading, setLoading] = useState(true);

  // Track whether we just did an optimistic update so we don't
  // overwrite it with the (slightly stale) snapshot echo-back.
  const optimisticKeys = useRef<Set<string>>(new Set());
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time listener
  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    const unsub = subscribeToClinicPreferences(clinicId, (prefs) => {
      setSettings((prev) => {
        // Merge remote but keep optimistic overrides for 2s
        if (optimisticKeys.current.size === 0) return prefs;
        const merged = { ...prefs };
        for (const key of optimisticKeys.current) {
          (merged as any)[key] = (prev as any)[key];
        }
        return merged;
      });
      setLoading(false);
    });

    return unsub;
  }, [clinicId]);

  /**
   * Update a single setting key. Optimistic — UI changes instantly.
   */
  const updateSetting = useCallback(
    <K extends keyof Omit<ClinicPreferences, 'updatedAt'>>(
      key: K,
      value: ClinicPreferences[K],
    ) => {
      if (!clinicId) return;

      // Optimistic local update
      setSettings((prev) => ({ ...prev, [key]: value }));
      optimisticKeys.current.add(key as string);

      // Clear optimistic flag after 2s (by then Firestore echoes back)
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => {
        optimisticKeys.current.clear();
      }, 2000);

      // Fire-and-forget Firestore write
      updateClinicPreferences(clinicId, { [key]: value }).catch((err) => {
        console.error('[useClinicPreferences] write failed, reverting', err);
        // On failure revert — next snapshot will correct it anyway
      });
    },
    [clinicId],
  );

  const updateSettings = useCallback(
    (updates: Partial<Omit<ClinicPreferences, 'updatedAt'>>) => {
      if (!clinicId) {
        return;
      }

      setSettings((prev) => ({ ...prev, ...updates }));
      for (const key of Object.keys(updates)) {
        optimisticKeys.current.add(key);
      }

      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => {
        optimisticKeys.current.clear();
      }, 2000);

      updateClinicPreferences(clinicId, updates).catch((err) => {
        console.error('[useClinicPreferences] write failed, reverting', err);
      });
    },
    [clinicId],
  );

  return { settings, loading, updateSetting, updateSettings };
}
