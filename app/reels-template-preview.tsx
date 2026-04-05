import TemplatesPreviewScreen from '@/src/components/create/TemplatesPreviewScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

export default function ReelsTemplatePreviewRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const handleClose = useCallback(() => { router.back(); }, [router]);
  return <TemplatesPreviewScreen templateId={id} onClose={handleClose} />;
}
