/**
 * CLINIC SETTINGS SERVICE
 * Handles clinic profile, branding, and preferences
 */

import { storage, db } from '@/firebaseConfig';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ClinicSettings } from '@/src/types/media';

/**
 * Get clinic settings
 */
export async function getClinicSettings(clinicId: string): Promise<ClinicSettings | null> {
  try {
    const docRef = doc(db, 'clinics', clinicId, 'settings', 'profile');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as ClinicSettings;
    }

    return null;
  } catch (error) {
    console.error('Error fetching clinic settings:', error);
    throw error;
  }
}

/**
 * Create or update clinic settings
 * Only the clinic owner can perform this operation
 */
export async function saveClinicSettings(
  clinicId: string,
  ownerUid: string,
  settings: Partial<ClinicSettings>
): Promise<ClinicSettings> {
  try {
    const docRef = doc(db, 'clinics', clinicId, 'settings', 'profile');
    
    // Get existing settings to verify ownership
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const existingSettings = docSnap.data() as ClinicSettings;
      // Verify owner
      if (existingSettings.ownerUid !== ownerUid) {
        throw new Error('Only clinic owner can modify settings');
      }
    }

    const now = Date.now();
    const dataToSave: ClinicSettings = {
      id: clinicId,
      clinicName: settings.clinicName || '',
      country: settings.country || '',
      city: settings.city || '',
      phoneNumber: settings.phoneNumber || '',
      email: settings.email || '',
      workingHours: settings.workingHours || '',
      logoUrl: settings.logoUrl || '',
      primaryColor: settings.primaryColor || '#D4AF37',
      secondaryColor: settings.secondaryColor || '#0B0F1A',
      createdAt: docSnap?.exists() ? (docSnap.data() as ClinicSettings).createdAt : now,
      updatedAt: now,
      ownerUid,
    };

    await setDoc(docRef, dataToSave, { merge: true });
    return dataToSave;
  } catch (error) {
    console.error('Error saving clinic settings:', error);
    throw error;
  }
}

/**
 * Upload clinic logo
 * Handles image compression and Firebase Storage upload
 */
export async function uploadClinicLogo(
  clinicId: string,
  ownerUid: string,
  imageUri: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    // Verify owner permissions first
    const docRef = doc(db, 'clinics', clinicId, 'settings', 'profile');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const settings = docSnap.data() as ClinicSettings;
      if (settings.ownerUid !== ownerUid) {
        throw new Error('Only clinic owner can upload logo');
      }
    }

    // Upload to Firebase Storage
    const fileName = `logo_${Date.now()}.jpg`;
    const storagePath = `clinics/${clinicId}/branding/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Convert imageUri to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload blob
    await uploadBytes(storageRef, blob, {
      contentType: mimeType,
    });

    // Get download URL
    const logoUrl = await getDownloadURL(storageRef);

    // Update settings with logo URL
    await updateDoc(docRef, {
      logoUrl,
      updatedAt: serverTimestamp(),
    });

    return logoUrl;
  } catch (error) {
    console.error('Error uploading clinic logo:', error);
    throw error;
  }
}

/**
 * Delete clinic logo
 */
export async function deleteClinicLogo(
  clinicId: string,
  ownerUid: string,
  logoUrl: string
): Promise<void> {
  try {
    // Verify owner permissions
    const docRef = doc(db, 'clinics', clinicId, 'settings', 'profile');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const settings = docSnap.data() as ClinicSettings;
      if (settings.ownerUid !== ownerUid) {
        throw new Error('Only clinic owner can delete logo');
      }
    }

    // Delete from storage if URL is a Firebase Storage URL
    if (logoUrl && logoUrl.includes('firebasestorage')) {
      try {
        const storageRef = ref(storage, logoUrl);
        await deleteObject(storageRef);
      } catch (err) {
        console.warn('Could not delete logo from storage:', err);
      }
    }

    // Clear logoUrl in settings
    await updateDoc(docRef, {
      logoUrl: '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting clinic logo:', error);
    throw error;
  }
}

/**
 * Update specific clinic settings fields
 */
export async function updateClinicSettings(
  clinicId: string,
  ownerUid: string,
  updates: Partial<ClinicSettings>
): Promise<void> {
  try {
    // Verify owner permissions
    const docRef = doc(db, 'clinics', clinicId, 'settings', 'profile');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const settings = docSnap.data() as ClinicSettings;
      if (settings.ownerUid !== ownerUid) {
        throw new Error('Only clinic owner can modify settings');
      }
    }

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating clinic settings:', error);
    throw error;
  }
}
