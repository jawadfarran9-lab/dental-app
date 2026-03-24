import { db } from '@/firebaseConfig';
import {
    collection,
    getDocs,
    orderBy,
    query,
} from 'firebase/firestore';

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
  /** Per-story location (optional — only present for stories created with location). */
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
    placeId?: string;
    address?: string;
  };
  /** Sticker overlays saved from the editor canvas. */
  stickers?: Array<{
    type: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    data: Record<string, any>;
  }>;
}

const archiveCol = (clinicId: string) =>
  collection(db, 'clinics', clinicId, 'archive');

function normalizeTimestamp(val: unknown): number {
  if (typeof val === 'number') return val;
  if (val && typeof (val as any).toMillis === 'function') return (val as any).toMillis();
  return 0;
}

/** Safely extract location from a Firestore doc. Returns undefined if invalid. */
function normalizeLocation(raw: any): ArchiveItem['location'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const lat = raw.latitude;
  const lng = raw.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return undefined;
  if (!isFinite(lat) || !isFinite(lng)) return undefined;
  return {
    latitude: lat,
    longitude: lng,
    ...(typeof raw.placeName === 'string' && raw.placeName ? { placeName: raw.placeName } : {}),
    ...(typeof raw.placeId === 'string' && raw.placeId ? { placeId: raw.placeId } : {}),
    ...(typeof raw.address === 'string' && raw.address ? { address: raw.address } : {}),
  };
}

export async function fetchArchive(clinicId: string): Promise<ArchiveItem[]> {
  try {
    const q = query(archiveCol(clinicId), orderBy('archivedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const raw = d.data();
      const loc = normalizeLocation(raw.location);
      const item: ArchiveItem = {
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
      };
      if (loc) item.location = loc;
      if (Array.isArray(raw.stickers) && raw.stickers.length > 0) {
        item.stickers = raw.stickers;
      }
      return item;
    });
  } catch (error) {
    console.error('[ARCHIVE] Error fetching archive:', error);
    return [];
  }
}
