import { db } from '@/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Clinic data type
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
  profileImageUrl?: string;
  countryCode?: string;
  city?: string;
  createdAt?: number;
  accountCreatedAt?: number;
  status?: string;
  clinicType?: string; // 'dental' | 'laser' | 'beauty' etc.
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
};

/**
 * Fetch clinic data including image URL from Firestore
 */
export const fetchClinicData = async (clinicId: string): Promise<ClinicData | null> => {
  try {
    if (!clinicId) {
      return null;
    }

    const clinicRef = doc(db, 'clinics', clinicId);
    const clinicSnap = await getDoc(clinicRef);

    if (!clinicSnap.exists()) {
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
      profileImageUrl: data?.profileImageUrl,
      countryCode: data?.countryCode,
      city: data?.city,
      createdAt: data?.createdAt,
      accountCreatedAt: data?.accountCreatedAt,
      status: data?.status,
      clinicType: data?.clinicType,
      location: data?.location,
    };

    if (clinicData.imageUrl) {
    } else {
    }

    return clinicData;
  } catch (error) {
    console.error('[CLINIC_DATA] Error fetching clinic data:', error);
    return null;
  }
};


