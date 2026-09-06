import { db, storage } from '@/firebaseConfig';
import { compressImage } from '@/src/utils/imageCompress';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

export type SessionPhotoCategory =
  | 'before'
  | 'after'
  | 'xray'
  | 'intraoral'
  | 'scan'
  | 'other';

export interface UploadSessionPhotoInput {
  clinicId: string;
  patientId: string;
  sessionId: string;
  memberId: string;
  uri: string;
  category: SessionPhotoCategory;
  sharedWithPatient: boolean;
}

export interface SessionPhotoDoc {
  id: string;
  sessionId: string;
  patientId: string;
  clinicId: string;
  url: string;
  storagePath: string;
  category: SessionPhotoCategory;
  sharedWithPatient: boolean;
  uploadedBy: string;
  createdAt: number;
  updatedAt: number;
  width: number;
  height: number;
  contentType: 'image/jpeg';
}

export async function uploadSessionPhoto(
  input: UploadSessionPhotoInput,
): Promise<void> {
  const {
    clinicId,
    patientId,
    sessionId,
    memberId,
    uri,
    category,
    sharedWithPatient,
  } = input;

  const photosCol = collection(
    db,
    `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}/photos`,
  );
  const photoRef = doc(photosCol);
  const photoId = photoRef.id;

  const c = await compressImage(uri, { maxWidth: 2048, quality: 0.85 });

  const storagePath = `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}/photos/${photoId}.jpg`;
  const blob = await (await fetch(c.uri)).blob();
  const snap = await uploadBytes(ref(storage, storagePath), blob, {
    contentType: 'image/jpeg',
  });
  const url = await getDownloadURL(snap.ref);

  const now = Date.now();
  const docData: SessionPhotoDoc = {
    id: photoId,
    sessionId,
    patientId,
    clinicId,
    url,
    storagePath,
    category,
    sharedWithPatient,
    uploadedBy: memberId,
    createdAt: now,
    updatedAt: now,
    width: c.width,
    height: c.height,
    contentType: 'image/jpeg',
  };
  await setDoc(photoRef, docData);
}

export interface UploadSessionPhotosBase {
  clinicId: string;
  patientId: string;
  sessionId: string;
  memberId: string;
}

export interface UploadSessionPhotosItem {
  uri: string;
  category: SessionPhotoCategory;
  sharedWithPatient: boolean;
}

export async function uploadSessionPhotos(
  base: UploadSessionPhotosBase,
  photos: UploadSessionPhotosItem[],
): Promise<{ failed: number }> {
  let failed = 0;
  for (const p of photos) {
    try {
      await uploadSessionPhoto({
        ...base,
        uri: p.uri,
        category: p.category,
        sharedWithPatient: p.sharedWithPatient,
      });
    } catch (e) {
      failed += 1;
      console.warn('[uploadSessionPhotos] photo failed', e);
    }
  }
  return { failed };
}

export interface SessionPhotoRef {
  clinicId: string;
  patientId: string;
  sessionId: string;
}

export async function listSessionPhotos(
  sessionRef: SessionPhotoRef,
): Promise<SessionPhotoDoc[]> {
  const { clinicId, patientId, sessionId } = sessionRef;
  const col = collection(
    db,
    `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}/photos`,
  );
  const q = query(col, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Omit<SessionPhotoDoc, 'id'>;
    return { ...data, id: d.id } as SessionPhotoDoc;
  });
}

export interface UpdateSessionPhotoInput extends SessionPhotoRef {
  photoId: string;
  patch: Partial<Pick<SessionPhotoDoc, 'category' | 'sharedWithPatient'>>;
}

export async function updateSessionPhoto(
  input: UpdateSessionPhotoInput,
): Promise<void> {
  const { clinicId, patientId, sessionId, photoId, patch } = input;
  const photoRef = doc(
    db,
    `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}/photos/${photoId}`,
  );
  await updateDoc(photoRef, { ...patch, updatedAt: Date.now() });
}

export interface DeleteSessionPhotoInput extends SessionPhotoRef {
  photoId: string;
  storagePath?: string;
}

export async function deleteSessionPhoto(
  input: DeleteSessionPhotoInput,
): Promise<void> {
  const { clinicId, patientId, sessionId, photoId, storagePath } = input;
  const photoRef = doc(
    db,
    `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}/photos/${photoId}`,
  );
  await deleteDoc(photoRef);
  if (storagePath) {
    try {
      await deleteObject(ref(storage, storagePath));
    } catch (e) {
      console.warn('[deleteSessionPhoto] storage delete ignored', e);
    }
  }
}
