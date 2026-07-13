import '@/i18n';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

// Keep native splash visible until we navigate
SplashScreen.preventAutoHideAsync().catch(() => {});

const RETRY_DELAY_MS = 1500;
const MAX_RETRIES = 2;

/**
 * INDEX — Auth-aware boot decision
 *
 * - Waits for AuthContext to settle (loading===false).
 * - Logged-in (clinic OR patient) → /(tabs)/home (today's behavior).
 * - Definitely logged out (userRole===null, error===null) → /login.
 * - Unknown/error (userRole===null, error!==null) → retry checkAuthState
 *   up to MAX_RETRIES; if still unknown, STAY on splash. Never force
 *   /login on a network blip.
 * - Hides the native splash ~100 ms AFTER each router.replace.
 */
export default function Index() {
  const router = useRouter();
  const { loading, userRole, error, checkAuthState } = useAuth();
  const navigatedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (navigatedRef.current) return;
    if (loading) return;

    if (userRole === 'clinic' || userRole === 'patient') {
      navigatedRef.current = true;
      router.replace('/(tabs)/home');
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
      return;
    }

    if (userRole === null && !error) {
      navigatedRef.current = true;
      router.replace('/login' as any);
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
      return;
    }

    if (userRole === null && !!error && retryCountRef.current < MAX_RETRIES) {
      retryTimerRef.current = setTimeout(() => {
        retryCountRef.current += 1;
        checkAuthState().catch(() => {});
      }, RETRY_DELAY_MS);
    }
  }, [loading, userRole, error, router, checkAuthState]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // Invisible - native splash covers this
  return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
}
