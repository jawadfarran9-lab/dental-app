import { db, storage } from '@/firebaseConfig';
import { compressImage } from '@/src/utils/imageCompress';
import { updateThreadOnMessage } from '@/src/utils/threadsHelper';
import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export async function sendImageMessage(params: {
  clinicId: string;
  patientId: string;
  patientName: string;
  localUri: string;
}): Promise<void> {
  const { clinicId, patientId, patientName, localUri } = params;
  const compressed = await compressImage(localUri, { maxWidth: 1600, quality: 0.7 });
  const messageId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const storagePath = `clinics/${clinicId}/patients/${patientId}/messages/${messageId}.jpg`;
  const blob = await (await fetch(compressed.uri)).blob();
  const snap = await uploadBytes(ref(storage, storagePath), blob, {
    contentType: 'image/jpeg',
  });
  const imageUrl = await getDownloadURL(snap.ref);
  await addDoc(collection(db, `patients/${patientId}/messages`), {
    from: 'clinic',
    text: '',
    type: 'image',
    imageUrl,
    imageWidth: compressed.width,
    imageHeight: compressed.height,
    storagePath,
    senderName: 'Clinic',
    createdAt: Date.now(),
  });
  await updateThreadOnMessage(clinicId, patientId, patientName, 'Photo', 'clinic');
}
