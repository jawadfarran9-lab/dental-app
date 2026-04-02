import PostPreviewScreen from '@/components/create/PostPreviewScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Post Preview route — receives image URI via params, renders preview UI.
 */
export default function PostPreviewRoute() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return <PostPreviewScreen uri={uri ?? ''} onClose={handleClose} />;
}
