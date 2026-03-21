import {
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';

export interface ArchiveItem {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  caption: string;
  createdAt: number;
  expiresAt: number;
  archivedAt: number;
  clinicId: string;
  clinicName: string;
  type: 'image' | 'video';
}

const archiveCol = (clinicId: string) =>
  collection(db, 'clinics', clinicId, 'archive');

function normalizeTimestamp(val: unknown): number {
  if (typeof val === 'number') return val;
  if (val && typeof (val as any).toMillis === 'function') return (val as any).toMillis();
  return 0;
}

export async function fetchArchive(clinicId: string): Promise<ArchiveItem[]> {
  try {
    const q = query(archiveCol(clinicId), orderBy('archivedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        mediaUrl: raw.mediaUrl ?? '',
        thumbnailUrl: raw.thumbnailUrl ?? null,
        caption: raw.caption ?? '',
        createdAt: normalizeTimestamp(raw.createdAt),
        expiresAt: normalizeTimestamp(raw.expiresAt),
        archivedAt: normalizeTimestamp(raw.archivedAt),
        clinicId: raw.clinicId ?? '',
        clinicName: raw.clinicName ?? '',
        type: raw.type ?? 'image',
      } as ArchiveItem;
    });
  } catch (error) {
    console.error('[ARCHIVE] Error fetching archive:', error);
    return [];
  }
}
