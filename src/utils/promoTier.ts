import { PublicClinic } from '@/src/services/publicClinics';

/**
 * G3: Compute Pro Preview status locally (UI-only, no backend changes).
 * Pro Preview = clinic has essential info for a complete listing.
 * This is used only for styling (badges, borders) on public surfaces.
 */
export function isProPreviewClinic(clinic: PublicClinic): boolean {
  if (!clinic) return false;
  
  // Basic criteria: hero image, phone, and address
  const hasEssentials = !!(clinic.heroImage && clinic.phone && clinic.address);
  
  // Optional boost: if whatsapp is also present
  const hasWhatsApp = !!clinic.whatsapp;
  
  // For now, just require essentials (heroImage + phone + address)
  // Future: could add whatsapp as bonus or use clinic.tier field when available
  return hasEssentials;
}

/**
 * Alternative: if clinic has explicit tier field from G1, respect it.
 * Otherwise fall back to computed logic.
 */
export function getClinicTier(clinic: PublicClinic): 'pro' | 'standard' {
  // If tier is explicitly set (from G1), use it
  if (clinic.tier === 'pro') return 'pro';
  
  // Otherwise compute pro preview based on completeness
  return isProPreviewClinic(clinic) ? 'pro' : 'standard';
}
