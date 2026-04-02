import ReelsCameraScreen from '@/components/create/ReelsCameraScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Create-Reel entry screen.
 * Immediately renders the static Reels Camera UI — no intermediate loaders.
 * Accepts ?mode=post|reel to control initial tab.
 */
export default function CreateReelScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  const initialMode = mode === 'post' ? 'post' : 'reel';

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return <ReelsCameraScreen onClose={handleClose} initialMode={initialMode} />;
}
