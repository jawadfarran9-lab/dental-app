import '@/i18n';
import { useRootNavigationState, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

// Keep native splash visible until we navigate
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * INDEX - Redirect to Home after splash
 * 
 * - Native splash shows the large BeSmile logo (from app.json)
 * - Waits for navigation to be ready
 * - Then navigates to Home and hides splash
 */
export default function Index() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Wait until navigation is ready
    if (!rootNavigationState?.key) return;

    // Navigate to Home after 500ms splash display
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
      // Hide splash after navigation
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
    }, 500);

    return () => clearTimeout(timer);
  }, [rootNavigationState?.key, router]);

  // Invisible - native splash covers this
  return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
}
