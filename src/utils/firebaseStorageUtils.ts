/**
 * Firebase Storage Utilities
 * Reliable image upload for React Native / Expo using Firebase SDK
 * 
 * ⚠️ IMPORTANT: Firebase Storage Rules must allow writes!
 * Go to: https://console.firebase.google.com/project/dental-jawad/storage/rules
 * Set rules to:
 * 
 * rules_version = '2';
 * service firebase.storage {
 *   match /b/{bucket}/o {
 *     match /clinics/{clinicId}/{allPaths=**} {
 *       allow read, write: if true;
 *     }
 *   }
 * }
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
 * Upload clinic image to Firebase Storage
 * Uses XMLHttpRequest + uploadBytesResumable for maximum reliability
 * 
 * @param imageUri - The image URI (file:// URI or data: URL from ImagePicker)
 * @param clinicId - The clinic ID (required, must not be undefined)
 * @returns Promise with download URL
 * @throws Error if clinicId is undefined or upload fails
 */
export const uploadClinicImage = async (
  imageUri: string,
  clinicId: string
): Promise<string> => {
  console.log('[STORAGE] ========== CLINIC IMAGE UPLOAD START ==========');
  console.log('[STORAGE] Platform:', Platform.OS);
  console.log('[STORAGE] Clinic ID:', clinicId);
  console.log('[STORAGE] Clinic ID type:', typeof clinicId);
  
  // ✅ STEP 1: Validate clinicId thoroughly
  if (!clinicId) {
    console.error('[STORAGE] ❌ ERROR: clinicId is falsy:', clinicId);
    throw new Error('Cannot upload image: clinicId is missing. Please ensure clinic is created first.');
  }
  if (clinicId === 'undefined' || clinicId === 'null') {
    console.error('[STORAGE] ❌ ERROR: clinicId is string "undefined" or "null":', clinicId);
    throw new Error('Cannot upload image: clinicId is invalid string. Please ensure clinic is created first.');
  }
  if (clinicId.trim() === '') {
    console.error('[STORAGE] ❌ ERROR: clinicId is empty string');
    throw new Error('Cannot upload image: clinicId is empty. Please ensure clinic is created first.');
  }
  console.log('[STORAGE] ✅ clinicId validation passed:', clinicId);
  
  // ✅ STEP 2: Validate imageUri thoroughly
  if (!imageUri) {
    console.error('[STORAGE] ❌ ERROR: imageUri is falsy:', imageUri);
    throw new Error('Cannot upload image: No image URI provided.');
  }
  if (typeof imageUri !== 'string') {
    console.error('[STORAGE] ❌ ERROR: imageUri is not a string:', typeof imageUri);
    throw new Error('Cannot upload image: imageUri must be a string.');
  }
  if (imageUri.length < 10) {
    console.error('[STORAGE] ❌ ERROR: imageUri is too short:', imageUri.length, 'chars');
    throw new Error('Cannot upload image: imageUri appears to be invalid (too short).');
  }
  
  const uriType = imageUri.startsWith('data:') ? 'data URL' : 
                  imageUri.startsWith('file://') ? 'file URI' : 
                  imageUri.startsWith('content://') ? 'content URI' :
                  imageUri.startsWith('ph://') ? 'photo library URI' : 'unknown';
  
  console.log('[STORAGE] ✅ imageUri validation passed');
  console.log('[STORAGE] URI type:', uriType);
  console.log('[STORAGE] URI length:', imageUri.length);
  console.log('[STORAGE] URI preview:', imageUri.substring(0, 100) + '...');

  try {
    // ✅ STEP 3: Convert image to Blob using XMLHttpRequest (most reliable for RN!)
    console.log('[STORAGE] Converting image to Blob using XMLHttpRequest...');
    
    let blob: Blob;
    try {
      blob = await uriToBlob(imageUri);
    } catch (blobError: any) {
      console.error('[STORAGE] ❌ uriToBlob() failed:', blobError.message);
      
      // Fallback: try fetch() method
      console.log('[STORAGE] Trying fallback: fetch() method...');
      try {
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        blob = await response.blob();
      } catch (fetchError: any) {
        console.error('[STORAGE] ❌ fetch() fallback also failed:', fetchError.message);
        throw new Error(`Failed to convert image to blob: ${blobError.message}. Fallback also failed: ${fetchError.message}`);
      }
    }
    
    console.log('[STORAGE] Blob created:');
    console.log('[STORAGE]   - size:', blob.size, 'bytes');
    console.log('[STORAGE]   - type:', blob.type || 'unknown');
    
    // ✅ STEP 4: Validate blob before upload
    if (!blob || blob.size === 0) {
      console.error('[STORAGE] ❌ ERROR: Blob is empty or invalid!');
      throw new Error('Cannot upload image: The image blob is empty. Please select a valid image.');
    }
    
    if (blob.size < 100) {
      console.warn('[STORAGE] ⚠️ WARNING: Blob is suspiciously small:', blob.size, 'bytes');
    }
    
    console.log('[STORAGE] ✅ Blob validation passed');

    // ✅ STEP 5: Create storage reference
    const storagePath = `clinics/${clinicId}/clinicImage.jpg`;
    console.log('[STORAGE] Storage path:', storagePath);
    
    const storageRef = ref(storage, storagePath);
    console.log('[STORAGE] Storage reference created');

    // ✅ STEP 6: Upload using uploadBytesResumable (more reliable than uploadBytes)
    console.log('[STORAGE] Starting Firebase upload with uploadBytesResumable...');
    console.log('[STORAGE] Upload payload: blob size =', blob.size, 'bytes');
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: blob.type || 'image/jpeg',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          clinicId: clinicId,
          platform: Platform.OS,
          originalSize: String(blob.size),
        },
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[STORAGE] Upload progress:', progress.toFixed(1) + '%',
            `(${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes)`);
          
          switch (snapshot.state) {
            case 'paused':
              console.log('[STORAGE] Upload paused');
              break;
            case 'running':
              console.log('[STORAGE] Upload running...');
              break;
          }
        },
        (error) => {
          // Handle upload errors
          console.error('[STORAGE] ❌ uploadBytesResumable() failed!');
          console.error('[STORAGE] Error name:', error.name);
          console.error('[STORAGE] Error code:', error.code);
          console.error('[STORAGE] Error message:', error.message);
          console.error('[STORAGE] Error serverResponse:', (error as any).serverResponse);
          console.error('[STORAGE] Full error:', JSON.stringify(error, null, 2));
          console.error('[STORAGE] ========== CLINIC IMAGE UPLOAD FAILED ==========');
          
          // Provide specific error messages
          let userMessage = error.message;
          if (error.code === 'storage/unauthorized') {
            userMessage = 'Storage permission denied. Please update Firebase Storage rules to allow writes.';
          } else if (error.code === 'storage/canceled') {
            userMessage = 'Upload was cancelled.';
          } else if (error.code === 'storage/unknown') {
            userMessage = `Firebase Storage unknown error. Blob size: ${blob.size}, type: ${blob.type}. Please check Storage rules.`;
          } else if (error.code === 'storage/quota-exceeded') {
            userMessage = 'Storage quota exceeded. Please upgrade your Firebase plan.';
          } else if (error.code === 'storage/retry-limit-exceeded') {
            userMessage = 'Upload retry limit exceeded. Please check your network connection.';
          }
          
          reject(new Error(`Upload failed (${error.code || 'unknown'}): ${userMessage}`));
        },
        async () => {
          // Upload completed successfully
          console.log('[STORAGE] ✅ Upload complete!');
          console.log('[STORAGE] Bytes transferred:', uploadTask.snapshot.totalBytes);
          console.log('[STORAGE] Full path:', uploadTask.snapshot.ref.fullPath);

          // Get download URL
          console.log('[STORAGE] Getting download URL...');
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[STORAGE] ✅ Download URL obtained:', downloadURL.substring(0, 80) + '...');
            console.log('[STORAGE] ========== CLINIC IMAGE UPLOAD SUCCESS ==========');
            resolve(downloadURL);
          } catch (urlError: any) {
            console.error('[STORAGE] ❌ getDownloadURL() failed:', urlError.message);
            reject(new Error(`Upload succeeded but failed to get URL: ${urlError.message}`));
          }
        }
      );
    });

  } catch (error: any) {
    console.error('[STORAGE] ========== UPLOAD ERROR ==========');
    console.error('[STORAGE] Error name:', error.name);
    console.error('[STORAGE] Error message:', error.message);
    console.error('[STORAGE] Error code:', error.code || 'N/A');
    console.error('[STORAGE] Error stack:', error.stack);
    console.error('[STORAGE] ========== CLINIC IMAGE UPLOAD FAILED ==========');
    
    // Re-throw with clear message
    throw error;
  }
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
