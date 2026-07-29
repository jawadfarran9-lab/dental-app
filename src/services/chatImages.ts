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
    text: '',
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
