import { db } from '@/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Clinic data type with image URL
 */
export type ClinicData = {
  id: string;
  firstName?: string;
  lastName?: string;
  clinicName?: string;
  email?: string;
  phone?: string;
  clinicPhone?: string;
  imageUrl?: string;
  countryCode?: string;
  city?: string;
  createdAt?: number;
  accountCreatedAt?: number;
  status?: string;
  clinicType?: string; // 'dental' | 'laser' | 'beauty' etc.
};

/**
 * Fetch clinic data including image URL from Firestore
 */
export const fetchClinicData = async (clinicId: string): Promise<ClinicData | null> => {
  try {
    if (!clinicId) {
      console.warn('[CLINIC_DATA] No clinic ID provided');
      return null;
    }

    console.log('[CLINIC_DATA] Fetching clinic data:', clinicId);
    const clinicRef = doc(db, 'clinics', clinicId);
    const clinicSnap = await getDoc(clinicRef);

    if (!clinicSnap.exists()) {
      console.warn('[CLINIC_DATA] Clinic document not found:', clinicId);
      return null;
    }

    const data = clinicSnap.data();
    const clinicData: ClinicData = {
      id: clinicSnap.id,
      firstName: data?.firstName,
      lastName: data?.lastName,
      clinicName: data?.clinicName,
      email: data?.email,
      phone: data?.phone,
      clinicPhone: data?.clinicPhone,
      imageUrl: data?.imageUrl,
      countryCode: data?.countryCode,
      city: data?.city,
      createdAt: data?.createdAt,
      accountCreatedAt: data?.accountCreatedAt,
      status: data?.status,
      clinicType: data?.clinicType,
    };

    if (clinicData.imageUrl) {
      console.log('[CLINIC_DATA] Image URL found:', clinicData.imageUrl);
    } else {
      console.log('[CLINIC_DATA] No image URL in clinic data');
    }

    return clinicData;
  } catch (error) {
    console.error('[CLINIC_DATA] Error fetching clinic data:', error);
    return null;
  }
};

/**
 * Get clinic image URL only
 */
export const getClinicImageUrl = async (clinicId: string): Promise<string | null> => {
  try {
    const clinicData = await fetchClinicData(clinicId);
    return clinicData?.imageUrl || null;
  } catch (error) {
    console.error('[CLINIC_IMAGE] Error fetching image URL:', error);
    return null;
  }
};
