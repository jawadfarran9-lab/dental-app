import { useEffect, useState } from 'react';
import { getClinicBranding } from '@/src/services/brandingService';
import { useAuth } from '@/src/context/AuthContext';

export function useClinicBrandingImage() {
  const { clinicId } = useAuth();
  const [brandingUrl, setBrandingUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!clinicId) return;
      try {
        const branding = await getClinicBranding(clinicId);
        if (isMounted) setBrandingUrl(branding.heroImageUrl || undefined);
      } catch (error) {
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [clinicId]);

  return brandingUrl;
}
