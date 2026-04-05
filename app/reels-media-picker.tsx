import ReelsMediaPickerScreen from '@/src/components/create/ReelsMediaPickerScreen';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Reels media picker route (Phase 1).
 * Static shell — no media loading or selection logic yet.
 */
export default function ReelsMediaPickerRoute() {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return <ReelsMediaPickerScreen onClose={handleClose} />;
}
