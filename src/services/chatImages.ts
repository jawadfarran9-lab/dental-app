import { db, storage } from '@/firebaseConfig';
import { compressImage } from '@/src/utils/imageCompress';
import { updateThreadOnMessage } from '@/src/utils/threadsHelper';
import type { Firestore } from 'firebase/firestore';
import { addDoc, collection } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export async function sendImageMessage(params: {
  clinicId: string;
  patientId: string;
  patientName: string;
  localUri: string;
  from?: 'clinic' | 'patient';
  senderName?: string;
  senderType?: 'clinic' | 'patient';
  caption?: string;
}, dbInstance: Firestore = db, storageInstance: FirebaseStorage = storage): Promise<void> {
  const {
    clinicId,
    patientId,
    patientName,
    localUri,
    from = 'clinic',
    senderName = 'Clinic',
    senderType = 'clinic',
  } = params;
  const compressed = await compressImage(localUri, { maxWidth: 1600, quality: 0.7 });
  const messageId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const storagePath = `clinics/${clinicId}/patients/${patientId}/messages/${messageId}.jpg`;
  const blob = await (await fetch(compressed.uri)).blob();
  const snap = await uploadBytes(ref(storageInstance, storagePath), blob, {
    contentType: 'image/jpeg',
  });
  const imageUrl = await getDownloadURL(snap.ref);
  await addDoc(collection(dbInstance, `patients/${patientId}/messages`), {
    from,
    text: params.caption ?? '',
    type: 'image',
    imageUrl,
    imageWidth: compressed.width,
    imageHeight: compressed.height,
    storagePath,
    senderName,
    createdAt: Date.now(),
  });
  await updateThreadOnMessage(clinicId, patientId, patientName, 'Photo', senderType, dbInstance);
}

export async function sendAlbumMessage(
  params: {
    clinicId: string;
    patientId: string;
    patientName: string;
    localUris: string[];
    from?: string;
    senderName?: string;
    senderType?: string;
    caption?: string;
  },
  dbInstance: Firestore = db,
  storageInstance: FirebaseStorage = storage,
): Promise<void> {
  const {
    clinicId,
    patientId,
    patientName,
    localUris,
    from = 'clinic',
    senderName = 'Clinic',
    senderType = 'clinic',
    caption,
  } = params;
  const messageId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const media: { kind: 'image'; url: string; storagePath: string; width: number; height: number }[] = [];
  for (let i = 0; i < localUris.length; i++) {
    const compressed = await compressImage(localUris[i], { maxWidth: 1600, quality: 0.7 });
    const storagePath = `clinics/${clinicId}/patients/${patientId}/messages/${messageId}_${i}.jpg`;
    const blob = await (await fetch(compressed.uri)).blob();
    const snap = await uploadBytes(ref(storageInstance, storagePath), blob, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(snap.ref);
    media.push({ kind: 'image', url, storagePath, width: compressed.width, height: compressed.height });
  }
  await addDoc(collection(dbInstance, `patients/${patientId}/messages`), {
    from,
    text: caption ?? '',
    type: 'album',
    media,
    senderName,
    createdAt: Date.now(),
  });
  await updateThreadOnMessage(
    clinicId,
    patientId,
    patientName,
    `📷 ${media.length} photos`,
    senderType as any,
    dbInstance,
  );
}
