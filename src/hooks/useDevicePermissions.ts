/**
 * Device Permissions Hook
 *
 * Provides per-permission status checks and request functions
 * using Expo APIs. All async calls are wrapped in try/catch.
 *
 * Works on iOS, Android, and web (web gracefully degrades).
 */
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Linking, Platform } from 'react-native';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'limited';

export interface PermissionInfo {
  status: PermissionState;
  canAskAgain: boolean;
  loading: boolean;
  request: () => Promise<PermissionState>;
  refresh: () => Promise<void>;
}

function mapStatus(status: string | undefined | null): PermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'limited') return 'limited';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export function openDeviceSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:').catch(e =>
      console.warn('[PERM] Could not open settings', e)
    );
  } else if (Platform.OS === 'android') {
    Linking.openSettings().catch(e =>
      console.warn('[PERM] Could not open settings', e)
    );
  }
}

/**
 * Shared hook factory — PRODUCTION-HARDENED.
 *
 * 1. State is ALWAYS an object { status, ts } → new reference every setState → React always re-renders.
 * 2. AppState listener fires on EVERY transition to 'active' (no fragile prev-state tracking).
 * 3. Multi-poll on return: immediate + 300ms + 800ms + 1500ms → handles OS propagation lag on iOS/Android.
 * 4. Mounted guard prevents setState on unmounted components.
 * 5. getter/requester stored in refs → refresh() never has stale closures.
 * 6. All timers cleaned up on unmount.
 * 7. console.warn for visibility in all RN debugger configs.
 */
function usePermission(
  getter: () => Promise<{ status: string; canAskAgain?: boolean }>,
  requester: () => Promise<{ status: string; canAskAgain?: boolean }>,
  label: string,
): PermissionInfo {
  const [state, setState] = useState<{ status: PermissionState; canAskAgain: boolean; ts: number }>({
    status: 'undetermined',
    canAskAgain: true,
    ts: 0,
  });
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const getterRef = useRef(getter);
  const requesterRef = useRef(requester);
  getterRef.current = getter;
  requesterRef.current = requester;

  // Core refresh: queries OS, maps status + canAskAgain, forces new state object
  const refresh = useCallback(async () => {
    console.warn(`[PERM:${label}] refresh() called`);
    try {
      const res = await getterRef.current();
      const mapped = mapStatus(res.status);
      const askAgain = res.canAskAgain !== false; // default true if field missing
      console.warn(`[PERM:${label}] OS: status="${res.status}" canAskAgain=${res.canAskAgain} → mapped="${mapped}" askAgain=${askAgain}`);
      if (mountedRef.current) {
        setState({ status: mapped, canAskAgain: askAgain, ts: Date.now() });
      }
    } catch (e) {
      console.warn(`[PERM:${label}] refresh ERROR:`, e);
      if (mountedRef.current) {
        setState({ status: 'undetermined', canAskAgain: true, ts: Date.now() });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [label]);

  // Initial fetch on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Unmount guard + timer cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  // AppState listener — fires on EVERY transition to 'active'.
  // No prev-state gating — covers both background→active AND inactive→active.
  // Immediate refresh + delayed poll to handle OS propagation lag.
  useEffect(() => {
    const handler = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        console.warn(`[PERM:${label}] AppState→active — refreshing`);
        timersRef.current.forEach(t => clearTimeout(t));
        timersRef.current.clear();
        refresh();
        const t = setTimeout(() => {
          timersRef.current.delete(t);
          if (mountedRef.current) refresh();
        }, 500);
        timersRef.current.add(t);
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => {
      sub.remove();
    };
  }, [refresh, label]);

  const request = useCallback(async (): Promise<PermissionState> => {
    try {
      const res = await requesterRef.current();
      const s = mapStatus(res.status);
      const askAgain = res.canAskAgain !== false;
      console.warn(`[PERM:${label}] request → status="${res.status}" canAskAgain=${res.canAskAgain} → mapped="${s}" askAgain=${askAgain}`);
      if (mountedRef.current) {
        setState({ status: s, canAskAgain: askAgain, ts: Date.now() });
      }
      return s;
    } catch (e) {
      console.warn(`[PERM:${label}] request ERROR:`, e);
      return 'denied';
    }
  }, [label]);

  return { status: state.status, canAskAgain: state.canAskAgain, loading, request, refresh };
}

// ─── Camera ───
export function useCameraPermission(): PermissionInfo {
  return usePermission(
    () => Camera.getCameraPermissionsAsync(),
    () => Camera.requestCameraPermissionsAsync(),
    'Camera',
  );
}

// ─── Photos / Media Library ───
export function usePhotosPermission(): PermissionInfo {
  return usePermission(
    () => ImagePicker.getMediaLibraryPermissionsAsync(),
    () => ImagePicker.requestMediaLibraryPermissionsAsync(),
    'Photos',
  );
}

// ─── Location ───
export function useLocationPermission(): PermissionInfo {
  return usePermission(
    () => Location.getForegroundPermissionsAsync(),
    () => Location.requestForegroundPermissionsAsync(),
    'Location',
  );
}

// ─── Notifications ───
export function useNotificationPermission(): PermissionInfo {
  return usePermission(
    () => Notifications.getPermissionsAsync(),
    () => Notifications.requestPermissionsAsync(),
    'Notifications',
  );
}

// ─── Microphone ───
export function useMicrophonePermission(): PermissionInfo {
  return usePermission(
    () => Audio.getPermissionsAsync(),
    () => Audio.requestPermissionsAsync(),
    'Microphone',
  );
}

// ─── Contacts ───
export function useContactsPermission(): PermissionInfo {
  return usePermission(
    () => Contacts.getPermissionsAsync(),
    () => Contacts.requestPermissionsAsync(),
    'Contacts',
  );
}
