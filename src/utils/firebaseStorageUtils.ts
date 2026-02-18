/**
 * Firebase Storage Utilities
 * Reliable image upload for React Native / Expo using Firebase SDK
 * 
 * Currently handles: X-ray image uploads
 */

import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { Platform } from 'react-native';
import { storage } from '../../app/firebaseConfig';

/**
 * Convert image URI to Blob using XMLHttpRequest
 * This is the MOST RELIABLE method for React Native!
 */
const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`XHR failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = function () {
      reject(new Error('XHR network error'));
    };
    xhr.ontimeout = function () {
      reject(new Error('XHR timeout'));
    };
    xhr.responseType = 'blob';
    xhr.timeout = 30000; // 30 second timeout
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

/**
 * Upload patient X-ray image to Firebase Storage
 * 
 * @param imageUri - The image URI (file:// URI or data: URL from ImagePicker)
 * @param clinicId - The clinic ID
 * @param patientId - The patient ID
 * @param imageId - Unique image identifier (e.g., UUID or timestamp)
 * @returns Promise resolving to the download URL
 */
export const uploadXrayImage = async (
  imageUri: string,
  clinicId: string,
  patientId: string,
  imageId: string
): Promise<string> => {
  console.log('[STORAGE] ========== X-RAY IMAGE UPLOAD START ==========');
  console.log('[STORAGE] Platform:', Platform.OS);
  console.log('[STORAGE] Clinic ID:', clinicId);
  console.log('[STORAGE] Patient ID:', patientId);
  console.log('[STORAGE] Image ID:', imageId);

  // Validate required parameters
  if (!clinicId || clinicId === 'undefined') {
    throw new Error('Cannot upload X-ray: clinicId is undefined.');
  }
  if (!patientId || patientId === 'undefined') {
    throw new Error('Cannot upload X-ray: patientId is undefined.');
  }
  if (!imageId) {
    throw new Error('Cannot upload X-ray: imageId is required.');
  }
  if (!imageUri) {
    throw new Error('Cannot upload X-ray: No image data provided.');
  }

  try {
    // ✅ Convert image to Blob using XMLHttpRequest (most reliable)
    console.log('[STORAGE] Converting image to Blob using XMLHttpRequest...');
    let blob: Blob;
    try {
      blob = await uriToBlob(imageUri);
    } catch (blobError: any) {
      console.log('[STORAGE] XMLHttpRequest failed, trying fetch()...');
      const response = await fetch(imageUri);
      blob = await response.blob();
    }
    console.log('[STORAGE] Blob created, size:', blob.size, 'bytes, type:', blob.type);

    if (!blob || blob.size === 0) {
      throw new Error('Blob is empty or invalid');
    }

    // Create storage reference for X-ray
    const storagePath = `clinics/${clinicId}/patients/${patientId}/xrays/${imageId}.jpg`;
    console.log('[STORAGE] Storage path:', storagePath);
    const storageRef = ref(storage, storagePath);

    // ✅ Upload using uploadBytesResumable
    console.log('[STORAGE] Starting Firebase upload...');
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: blob.type || 'image/jpeg',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          clinicId: clinicId,
          patientId: patientId,
          imageId: imageId,
          platform: Platform.OS,
        },
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[STORAGE] X-ray upload progress:', progress.toFixed(1) + '%');
        },
        (error) => {
          console.error('[STORAGE] ❌ X-ray upload failed:', error.code, error.message);
          console.error('[STORAGE] ========== X-RAY UPLOAD FAILED ==========');
          reject(new Error(`X-ray upload failed (${error.code}): ${error.message}`));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[STORAGE] ✅ X-ray download URL:', downloadURL.substring(0, 80) + '...');
            console.log('[STORAGE] ========== X-RAY UPLOAD SUCCESS ==========');
            resolve(downloadURL);
          } catch (urlError: any) {
            reject(new Error(`X-ray upload succeeded but failed to get URL: ${urlError.message}`));
          }
        }
      );
    });

  } catch (error: any) {
    console.error('[STORAGE] ========== X-RAY UPLOAD ERROR ==========');
    console.error('[STORAGE] Error:', error.message);
    console.error('[STORAGE] ========== X-RAY UPLOAD FAILED ==========');
    throw new Error(`Failed to upload X-ray image: ${error.message}`);
  }
};
