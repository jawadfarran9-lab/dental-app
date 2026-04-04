import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

/**
 * Hook that reads camera-roll (media library) permission from the OS.
 * Returns live granted status + a request/toggle function.
 *
 * Re-checks permission when the app returns to foreground
 * (e.g. user changed it in device Settings).
 */
export function useCameraRollPermission() {
  const [granted, setGranted] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      setGranted(status === 'granted');
    } catch {
      setGranted(false);
    }
  }, []);

  // Check on mount
  useEffect(() => { refresh(); }, [refresh]);

  // Re-check when app returns from background (user may have toggled in OS settings)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') { refresh(); }
    });
    return () => sub.remove();
  }, [refresh]);

  /** Toggle handler for settings UI switches. */
  const toggle = useCallback(async (value: boolean) => {
    if (!value) {
      // User toggling OFF → can only revoke from OS settings
      Linking.openSettings();
      return;
    }
    // User toggling ON → request permission first
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      setGranted(true);
    } else {
      // Permission denied by system prompt → send to OS settings
      Linking.openSettings();
    }
  }, []);

  return { granted, toggle, refresh } as const;
}
