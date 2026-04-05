import TemplatesBrowseScreen from '@/src/components/create/TemplatesBrowseScreen';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export default function ReelsTemplatesRoute() {
  const router = useRouter();
  const handleClose = useCallback(() => { router.back(); }, [router]);
  return <TemplatesBrowseScreen onClose={handleClose} />;
}
