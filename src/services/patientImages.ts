/**
 * STEP G - Patient Images Service
 * 
 * Firebase operations for patient imaging:
 * - Upload images to Storage
 * - Save metadata to Firestore
 * - Fetch images
 * - Update annotations
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, startAfter, DocumentSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { storage, db } from '@/firebaseConfig';
import { PatientImage, ImageType, ImageAnnotations, UploadProgress } from '@/src/types/imaging';

/**
 * Upload patient image to Firebase Storage and save metadata to Firestore
 */
export async function uploadPatientImage(
  clinicId: string,
  patientId: string,
  imageId: string,
  imageUri: string,
  imageType: ImageType,
  width: number,
  height: number,
  createdByUid: string,
  onProgress?: (progress: number) => void
): Promise<PatientImage> {
  try {
    // Fetch image blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Storage path
    const storagePath = `clinics/${clinicId}/patients/${patientId}/images/${imageId}/original.jpg`;
    const storageRef = ref(storage, storagePath);

    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          console.error('[UPLOAD ERROR]', error);
          reject(error);
        },
        async () => {
          try {
            // Get download URL
            const downloadUrl = await getDownloadURL(storageRef);

            // Create Firestore document
            const imageDoc: PatientImage = {
              clinicId,
              patientId,
              imageId,
              type: imageType,
              storagePathOriginal: storagePath,
              downloadUrlOriginal: downloadUrl,
              width,
              height,
              createdAt: serverTimestamp(),
              createdByUid,
              annotations: {
                version: 1,
                strokes: [],
                texts: [],
              },
            };

            // Save to Firestore
            const docRef = doc(db, `clinics/${clinicId}/patients/${patientId}/images`, imageId);
            await setDoc(docRef, imageDoc);

            resolve(imageDoc);
          } catch (error) {
            console.error('[POST-UPLOAD ERROR]', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('[UPLOAD PATIENT IMAGE ERROR]', error);
    throw error;
  }
}

/**
 * Fetch patient images with pagination
 */
export async function fetchPatientImages(
  clinicId: string,
  patientId: string,
  imageType?: ImageType,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ images: PatientImage[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
  try {
    const imagesRef = collection(db, `clinics/${clinicId}/patients/${patientId}/images`);
    
    let q = query(
      imagesRef,
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    // Filter by type if specified
    if (imageType) {
      q = query(
        imagesRef,
        where('type', '==', imageType),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }

    // Pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { images: [], lastDoc: null, hasMore: false };
    }

    const images = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PatientImage[];

    const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
    const hasMore = snapshot.docs.length === pageSize;

    return { images, lastDoc: newLastDoc, hasMore };
  } catch (error) {
    console.error('[FETCH PATIENT IMAGES ERROR]', error);
    throw error;
  }
}

/**
 * Fetch single patient image by ID
 */
export async function fetchPatientImage(
  clinicId: string,
  patientId: string,
  imageId: string
): Promise<PatientImage | null> {
  try {
    const docRef = doc(db, `clinics/${clinicId}/patients/${patientId}/images`, imageId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as PatientImage;
  } catch (error) {
    console.error('[FETCH PATIENT IMAGE ERROR]', error);
    throw error;
  }
}

/**
 * Save annotations to Firestore
 */
export async function saveImageAnnotations(
  clinicId: string,
  patientId: string,
  imageId: string,
  annotations: ImageAnnotations
): Promise<void> {
  try {
    const docRef = doc(db, `clinics/${clinicId}/patients/${patientId}/images`, imageId);
    await updateDoc(docRef, { annotations });

  } catch (error) {
    console.error('[SAVE ANNOTATIONS ERROR]', error);
    throw error;
  }
}
