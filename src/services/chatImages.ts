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
  onProgress?: (progress: number) => void;
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
      uploadUri = await VideoCompressor.compress(
        localUri,
        {
          compressionMethod: 'manual',
          maxSize: 720,
          bitrate: 1500000,
        },
        params.onProgress
      );
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
    assets: Array<{ uri: string; kind: 'image' | 'video' }>;
    from?: string;
    senderName?: string;
    senderType?: string;
    caption?: string;
    onProgress?: (index: number, total: number, pct: number | null) => void;
  },
  dbInstance: Firestore = db,
  storageInstance: FirebaseStorage = storage,
): Promise<void> {
  const {
    clinicId,
    patientId,
    patientName,
    assets,
    from = 'clinic',
    senderName = 'Clinic',
    senderType = 'clinic',
    caption,
    onProgress,
  } = params;
  const messageId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const total = assets.length;
  type AlbumMediaItem =
    | { kind: 'image'; url: string; storagePath: string; width: number; height: number }
    | {
        kind: 'video';
        url: string;
        videoUrl: string;
        storagePath: string;
        posterUrl: string | null;
        posterPath: string | null;
        width: number | null;
        height: number | null;
        durationMs: null;
      };
  const media: AlbumMediaItem[] = [];
  let hasVideo = false;
  for (let i = 0; i < total; i++) {
    const a = assets[i];
    if (a.kind === 'image') {
      onProgress?.(i, total, null);
      const compressed = await compressImage(a.uri, { maxWidth: 1600, quality: 0.7 });
      const storagePath = `clinics/${clinicId}/patients/${patientId}/messages/${messageId}_${i}.jpg`;
      const blob = await (await fetch(compressed.uri)).blob();
      const snap = await uploadBytes(ref(storageInstance, storagePath), blob, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(snap.ref);
      media.push({ kind: 'image', url, storagePath, width: compressed.width, height: compressed.height });
    } else {
      hasVideo = true;
      onProgress?.(i, total, 0);
      let posterUri: string | null = null;
      let posterW: number | null = null;
      let posterH: number | null = null;
      try {
        const thumb = await VideoThumbnails.getThumbnailAsync(a.uri, { time: 0 });
        posterUri = thumb.uri;
        posterW = thumb.width;
        posterH = thumb.height;
      } catch {
        posterUri = null;
      }
      let uploadUri = a.uri;
      try {
        uploadUri = await VideoCompressor.compress(
          a.uri,
          {
            compressionMethod: 'manual',
            maxSize: 720,
            bitrate: 1500000,
          },
          (p) => onProgress?.(i, total, p),
        );
      } catch (e) {
        console.warn('[sendAlbumMessage] video compress failed, uploading raw', e);
        uploadUri = a.uri;
      }
      onProgress?.(i, total, null);
      const videoStoragePath = `clinics/${clinicId}/patients/${patientId}/messages/${messageId}_${i}.mp4`;
      const videoBlob = await (await fetch(uploadUri)).blob();
      const videoSnap = await uploadBytes(ref(storageInstance, videoStoragePath), videoBlob, {
        contentType: 'video/mp4',
      });
      const videoUrl = await getDownloadURL(videoSnap.ref);

      let posterUrl: string | null = null;
      let posterPath: string | null = null;
      if (posterUri) {
        try {
          const pPath = `clinics/${clinicId}/patients/${patientId}/messages/${messageId}_${i}_poster.jpg`;
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
      media.push({
        kind: 'video',
        url: posterUrl ?? '',
        videoUrl,
        storagePath: videoStoragePath,
        posterUrl,
        posterPath,
        width: posterW,
        height: posterH,
        durationMs: null,
      });
    }
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
    hasVideo ? `📷 ${media.length} media` : `📷 ${media.length} photos`,
    senderType as any,
    dbInstance,
  );
}
