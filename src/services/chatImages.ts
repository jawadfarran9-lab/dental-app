import { db, storage } from '@/firebaseConfig';
import { compressImage } from '@/src/utils/imageCompress';
import { updateThreadOnMessage } from '@/src/utils/threadsHelper';
import * as VideoThumbnails from 'expo-video-thumbnails';
import type { Firestore } from 'firebase/firestore';
import { addDoc, collection } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Video as VideoCompressor } from 'react-native-compressor';

export type DrawingDoc = {
  vb: [number, number];
  strokes: Array<{ color: string; width: number; d: string }>;
};

export type TextsDoc = {
  items: Array<{
    text: string;
    color: string;
    align: 'left' | 'center' | 'right';
    bg: 'none' | 'white' | 'dim' | 'black';
    font?: string | null;
    nx: number;
    ny: number;
    size: number;
    rot: number;
  }>;
};

export async function sendImageMessage(params: {
  clinicId: string;
  patientId: string;
  patientName: string;
  localUri: string;
  from?: 'clinic' | 'patient';
  senderName?: string;
  senderType?: 'clinic' | 'patient';
  caption?: string;
  drawing?: DrawingDoc | null;
  texts?: TextsDoc | null;
  hd?: boolean;
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
  const compressed = await compressImage(localUri, params.hd ? { maxWidth: 2560, quality: 0.9 } : { maxWidth: 1600, quality: 0.7 });
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
    drawing: params.drawing ?? null,
    texts: params.texts ?? null,
    type: 'image',
    imageUrl,
    imageWidth: compressed.width,
    imageHeight: compressed.height,
    hd: params.hd ?? false,
    storagePath,
    senderName,
    createdAt: Date.now(),
  });
  await updateThreadOnMessage(clinicId, patientId, patientName, 'Photo', senderType, dbInstance);
}

export async function sendVideoMessage(params: {
  clinicId: string;
  patientId: string;
  patientName: string;
  localUri: string;
  from?: 'clinic' | 'patient';
  senderName?: string;
  senderType?: 'clinic' | 'patient';
  caption?: string;
  drawing?: DrawingDoc | null;
  texts?: TextsDoc | null;
  hd?: boolean;
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

  let posterUri: string | null = null;
  let posterW: number | null = null;
  let posterH: number | null = null;
  try {
    const thumb = await VideoThumbnails.getThumbnailAsync(localUri, { time: 0 });
    posterUri = thumb.uri;
    posterW = thumb.width;
    posterH = thumb.height;
  } catch {
    posterUri = null;
  }

  const messageId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const storagePath = `clinics/${clinicId}/patients/${patientId}/messages/${messageId}.mp4`;
  let uploadUri = localUri;
  if (!params.hd) {
    try {
      uploadUri = await VideoCompressor.compress(localUri, { compressionMethod: 'auto' });
    } catch (e) {
      console.warn('[sendVideoMessage] video compress failed, uploading raw', e);
      uploadUri = localUri;
    }
  }
  const videoBlob = await (await fetch(uploadUri)).blob();
  const videoSnap = await uploadBytes(ref(storageInstance, storagePath), videoBlob, {
    contentType: 'video/mp4',
  });
  const videoUrl = await getDownloadURL(videoSnap.ref);

  let posterUrl: string | null = null;
  let posterPath: string | null = null;
  if (posterUri) {
    try {
      const pPath = `clinics/${clinicId}/patients/${patientId}/messages/${messageId}_poster.jpg`;
      const posterBlob = await (await fetch(posterUri)).blob();
      const posterSnap = await uploadBytes(ref(storageInstance, pPath), posterBlob, {
        contentType: 'image/jpeg',
      });
      posterUrl = await getDownloadURL(posterSnap.ref);
      posterPath = pPath;
    } catch {
      posterUrl = null;
      posterPath = null;
    }
  }

  await addDoc(collection(dbInstance, `patients/${patientId}/messages`), {
    from,
    text: params.caption ?? '',
    drawing: params.drawing ?? null,
    texts: params.texts ?? null,
    type: 'video',
    videoUrl,
    storagePath,
    posterUrl: posterUrl ?? null,
    posterPath: posterPath ?? null,
    durationMs: null,
    videoWidth: posterW,
    videoHeight: posterH,
    senderName,
    createdAt: Date.now(),
  });
  await updateThreadOnMessage(clinicId, patientId, patientName, '🎬 Video', senderType, dbInstance);
}

export async function sendAudioMessage(params: {
  clinicId: string;
  patientId: string;
  patientName: string;
  localUri: string;
  durationMs: number;
  waveform?: number[];
  from?: 'clinic' | 'patient';
  senderName?: string;
  senderType?: 'clinic' | 'patient';
}, dbInstance: Firestore = db, storageInstance: FirebaseStorage = storage): Promise<void> {
  const {
    clinicId, patientId, patientName, localUri, durationMs,
    waveform = [],
    from = 'clinic', senderName = 'Clinic', senderType = 'clinic',
  } = params;
  const messageId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const storagePath = `clinics/${clinicId}/patients/${patientId}/messages/${messageId}.m4a`;
  const blob = await (await fetch(localUri)).blob();
  const snap = await uploadBytes(ref(storageInstance, storagePath), blob, { contentType: 'audio/m4a' });
  const audioUrl = await getDownloadURL(snap.ref);
  await addDoc(collection(dbInstance, `patients/${patientId}/messages`), {
    from,
    text: '',
    type: 'audio',
    audioUrl,
    storagePath,
    durationMs,
    waveform,
    mimeType: 'audio/m4a',
    senderName,
    createdAt: Date.now(),
  });
  await updateThreadOnMessage(clinicId, patientId, patientName, '🎤 Voice message', senderType, dbInstance);
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
