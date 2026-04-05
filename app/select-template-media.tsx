import SelectTemplateMediaScreen from '@/src/components/create/SelectTemplateMediaScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

export default function SelectTemplateMediaRoute() {
  const router = useRouter();
  const { templateId, slots } = useLocalSearchParams<{ templateId: string; slots: string }>();
  const handleClose = useCallback(() => { router.back(); }, [router]);
  return <SelectTemplateMediaScreen templateId={templateId} maxSlots={Number(slots) || 0} onClose={handleClose} />;
}
