import TemplateSlotsScreen from '@/src/components/create/TemplateSlotsScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

export default function TemplateSlotsRoute() {
  const router = useRouter();
  const { templateId, selectedMedia } = useLocalSearchParams<{ templateId: string; selectedMedia: string }>();
  const handleClose = useCallback(() => { router.back(); }, [router]);
  return <TemplateSlotsScreen templateId={templateId} selectedMedia={selectedMedia} onClose={handleClose} />;
}
