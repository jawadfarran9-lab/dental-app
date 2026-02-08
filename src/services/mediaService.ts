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
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  PatientMedia,
  AnnotationData,
  StrokeData,
  TextOverlay,
  PatientSession,
  TimelineEntry,
} from '@/src/types/media';

/**
 * PATIENT MEDIA SERVICE
 * Handles image upload, storage, and annotation for patient media
 */

// ============ UPLOAD IMAGE ============
export async function uploadPatientImage(
  patientId: string,
  clinicId: string,
  imageUri: string,
  mimeType: string = 'image/jpeg',
  sessionId?: string
): Promise<PatientMedia> {
  try {
    const mediaId = `${Date.now()}_${uuidv4()}`;
    const fileName = `${mediaId}.jpg`;

    // Upload to Cloud Storage
    const storagePath = `clinics/${clinicId}/patients/${patientId}/images/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Fetch the image as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: mimeType,
    });

    // Get download URL
    const originalUrl = await getDownloadURL(snapshot.ref);

    // Create Firestore document
    const mediaDoc: PatientMedia = {
      id: mediaId,
      patientId,
      clinicId,
      originalUrl,
      hasAnnotation: false,
      createdAt: Date.now(),
      uploadedBy: 'clinic',
      sessionId: sessionId || undefined,
    };

    // Save to Firestore
    const mediaRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/media`,
      mediaId
    );
    await setDoc(mediaRef, mediaDoc);

    // If sessionId is provided, add media to session
    if (sessionId) {
      await addMediaToSession(patientId, clinicId, sessionId, mediaId);
    }

    // Create timeline entry
    await createTimelineEntry(patientId, clinicId, {
      type: 'image_upload',
      relatedMediaId: mediaId,
      title: 'Image Uploaded',
    });

    return mediaDoc;
  } catch (error) {
    console.error('Error uploading patient image:', error);
    throw error;
  }
}

// ============ GET PATIENT MEDIA ============
export async function getPatientMedia(
  patientId: string,
  clinicId: string
): Promise<PatientMedia[]> {
  try {
    const mediaRef = collection(
      db,
      `clinics/${clinicId}/patients/${patientId}/media`
    );
    const q = query(mediaRef);
    const snapshot = await getDocs(q);

    const media = snapshot.docs.map((doc) => doc.data() as PatientMedia);
    // Sort by createdAt descending (newest first)
    return media.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching patient media:', error);
    throw error;
  }
}

// ============ GET SINGLE MEDIA ============
export async function getMediaById(
  patientId: string,
  clinicId: string,
  mediaId: string
): Promise<PatientMedia | null> {
  try {
    const mediaRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/media`,
      mediaId
    );
    const snapshot = await getDoc(mediaRef);

    return snapshot.exists() ? (snapshot.data() as PatientMedia) : null;
  } catch (error) {
    console.error('Error fetching media:', error);
    throw error;
  }
}

// ============ SAVE ANNOTATED IMAGE ============
export async function saveAnnotatedImage(
  patientId: string,
  clinicId: string,
  mediaId: string,
  annotatedImageUri: string, // Local file URI of annotated image
  strokes: StrokeData[],
  textOverlays?: TextOverlay[]
): Promise<PatientMedia> {
  try {
    const annotatedFileName = `${mediaId}_annotated_v1.jpg`;

    // Upload annotated image to Cloud Storage
    const storagePath = `clinics/${clinicId}/patients/${patientId}/images/${annotatedFileName}`;
    const storageRef = ref(storage, storagePath);

    const response = await fetch(annotatedImageUri);
    const blob = await response.blob();

    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });

    const annotatedUrl = await getDownloadURL(snapshot.ref);

    // Update Firestore document
    const mediaRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/media`,
      mediaId
    );

    // Update media record with annotated URL
    const updates = {
      annotatedUrl,
      hasAnnotation: true,
      updatedAt: Date.now(),
    };

    await updateDoc(mediaRef, updates);

    // Save annotation data
    const annotationRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/media/${mediaId}/annotations`,
      'v1'
    );

    const annotationData: AnnotationData = {
      id: 'v1',
      mediaId,
      version: 1,
      strokes,
      textOverlays: textOverlays || [],
      createdAt: Date.now(),
      createdBy: 'clinic',
      clinicId,
      patientId,
    };

    await setDoc(annotationRef, annotationData);

    // Create timeline entry
    await createTimelineEntry(patientId, clinicId, {
      type: 'image_annotated',
      relatedMediaId: mediaId,
      title: 'Image Annotated',
    });

    // Return updated media
    const updatedDoc = await getMediaById(patientId, clinicId, mediaId);
    return updatedDoc!;
  } catch (error) {
    console.error('Error saving annotated image:', error);
    throw error;
  }
}

// ============ DELETE MEDIA ============
export async function deletePatientMedia(
  patientId: string,
  clinicId: string,
  mediaId: string
): Promise<void> {
  try {
    const mediaDoc = await getMediaById(patientId, clinicId, mediaId);
    if (!mediaDoc) throw new Error('Media not found');

    // Delete from Cloud Storage
    const originalRef = ref(storage, `clinics/${clinicId}/patients/${patientId}/images/${mediaId}.jpg`);
    await deleteObject(originalRef);

    if (mediaDoc.annotatedUrl) {
      const annotatedRef = ref(
        storage,
        `clinics/${clinicId}/patients/${patientId}/images/${mediaId}_annotated_v1.jpg`
      );
      await deleteObject(annotatedRef);
    }

    // Delete from Firestore
    const mediaRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/media`,
      mediaId
    );
    await deleteDoc(mediaRef);
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
}

// ============ SESSIONS ============
export async function createSession(
  patientId: string,
  clinicId: string,
  title: string,
  description?: string
): Promise<PatientSession> {
  try {
    const sessionId = uuidv4();
    const now = Date.now();

    const session: PatientSession = {
      id: sessionId,
      clinicId,
      patientId,
      title,
      description: description || '',
      date: now,
      mediaIds: [],
      createdAt: now,
      createdBy: clinicId,
      updatedAt: now,
    };

    const sessionRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/sessions`,
      sessionId
    );
    await setDoc(sessionRef, session);

    // Create timeline entry
    await createTimelineEntry(patientId, clinicId, {
      type: 'session',
      relatedSessionId: sessionId,
      title: `Session: ${title}`,
    });

    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function getSessionsForPatient(
  patientId: string,
  clinicId: string
): Promise<PatientSession[]> {
  try {
    const sessionsRef = collection(
      db,
      `clinics/${clinicId}/patients/${patientId}/sessions`
    );
    const snapshot = await getDocs(sessionsRef);

    const sessions = snapshot.docs.map((doc) => doc.data() as PatientSession);
    // Sort by date descending (latest first)
    return sessions.sort((a, b) => b.date - a.date);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
}

export async function addMediaToSession(
  patientId: string,
  clinicId: string,
  sessionId: string,
  mediaId: string
): Promise<void> {
  try {
    const sessionRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/sessions`,
      sessionId
    );

    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) throw new Error('Session not found');

    const currentMediaIds = sessionDoc.data().mediaIds || [];
    if (!currentMediaIds.includes(mediaId)) {
      currentMediaIds.push(mediaId);
      await updateDoc(sessionRef, {
        mediaIds: currentMediaIds,
        updatedAt: Date.now(),
      });
    }

    // Also update media to link to session
    const mediaRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/media`,
      mediaId
    );
    await updateDoc(mediaRef, { sessionId });
  } catch (error) {
    console.error('Error adding media to session:', error);
    throw error;
  }
}

// ============ TIMELINE ============
export async function createTimelineEntry(
  patientId: string,
  clinicId: string,
  entry: Partial<TimelineEntry>
): Promise<TimelineEntry> {
  try {
    const entryId = uuidv4();
    const now = Date.now();

    const timelineEntry: TimelineEntry = {
      id: entryId,
      type: entry.type as any,
      patientId,
      clinicId,
      timestamp: now,
      relatedSessionId: entry.relatedSessionId,
      relatedMediaId: entry.relatedMediaId,
      title: entry.title || 'Event',
      description: entry.description,
      sortKey: Number.MAX_VALUE - now, // For descending order
    };

    const timelineRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/timeline`,
      entryId
    );
    await setDoc(timelineRef, timelineEntry);

    return timelineEntry;
  } catch (error) {
    console.error('Error creating timeline entry:', error);
    throw error;
  }
}

export async function getPatientTimeline(
  patientId: string,
  clinicId: string
): Promise<TimelineEntry[]> {
  try {
    const timelineRef = collection(
      db,
      `clinics/${clinicId}/patients/${patientId}/timeline`
    );
    const snapshot = await getDocs(timelineRef);

    const entries = snapshot.docs.map((doc) => doc.data() as TimelineEntry);
    // Sort by timestamp descending (latest first)
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    throw error;
  }
}
