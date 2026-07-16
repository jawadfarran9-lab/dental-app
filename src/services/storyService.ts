/**
 * Story Service
 *
 * Firestore path: clinics/{clinicId}/stories
 * Archive path:   clinics/{clinicId}/archive
 *
 * Handles story creation, active story fetching,
 * auto-archiving (Phase 3), and camera roll save (Phase 4).
 */
import { db } from '@/firebaseConfig';
import { logSilentFailure } from '@/src/utils/silentFailure';
import * as FileSystem from 'expo-file-system';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    where,
} from 'firebase/firestore';
import { getClinicPreferences } from './clinicPreferencesService';

// ── Types ────────────────────────────────────────────────────────

/** Optional location attached to a story. */
export interface StoryLocation {
  latitude: number;
  longitude: number;
  placeName?: string;
  placeId?: string;
  address?: string;
}

export interface ClinicStory {
  id: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  clinicId: string;
  clinicName?: string;
  type: 'image' | 'video';
  /** If set, only these userIds can see the story. */
  closeFriends?: string[];
  /** These userIds will NOT see the story. */
  hiddenFrom?: string[];
  /** Whether viewers can reply. Defaults to true if absent. */
  allowReplies?: boolean;
  /** Per-story location (optional). */
  location?: StoryLocation;
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

export interface CreateStoryInput {
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  clinicName?: string;
  type: 'image' | 'video';
  closeFriends?: string[];
  hiddenFrom?: string[];
  allowReplies?: boolean;
  /** Optional location from the story creation flow. */
  location?: StoryLocation;
  /** Optional sticker overlays placed on the story canvas. */
  stickers?: Array<{
    type: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    data: Record<string, any>;
  }>;
}

// ── Collection helpers ───────────────────────────────────────────

const storiesCol = (clinicId: string) =>
  collection(db, `clinics/${clinicId}/stories`);

const archiveCol = (clinicId: string) =>
  collection(db, `clinics/${clinicId}/archive`);

// ── Privacy helper ───────────────────────────────────────────────

/**
 * Determine if a story is visible to the given user.
 *
 * Rules:
 * 1. If closeFriends is set and non-empty, only those userIds can see it.
 * 2. If the userId is in hiddenFrom, the story is hidden.
 */
export function isStoryVisible(
  story: ClinicStory,
  userId: string | null | undefined,
): boolean {
  // closeFriends gate: if the list exists, user must be in it
  if (story.closeFriends && story.closeFriends.length > 0) {
    if (!userId || !story.closeFriends.includes(userId)) return false;
  }

  // hiddenFrom gate
  if (story.hiddenFrom && story.hiddenFrom.length > 0) {
    if (userId && story.hiddenFrom.includes(userId)) return false;
  }

  return true;
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Create a new story.
 *
 * 1. Writes to clinics/{clinicId}/stories
 * 2. Reads clinic preferences
 * 3. If saveStoryToArchive → copies to clinics/{clinicId}/archive
 * 4. If saveStoryToCameraRoll → saves media to device gallery
 *
 * Steps 3 & 4 are fire-and-forget — failures never block story creation.
 */
export async function createStory(
  clinicId: string,
  input: CreateStoryInput,
): Promise<ClinicStory> {
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);

  const storyData: Record<string, any> = {
    mediaUrl: input.mediaUrl,
    thumbnailUrl: input.thumbnailUrl ?? null,
    caption: input.caption ?? '',
    createdAt: serverTimestamp(),
    expiresAt,
    clinicId,
    clinicName: input.clinicName ?? '',
    type: input.type,
    allowReplies: input.allowReplies ?? true,
  };
  if (input.closeFriends && input.closeFriends.length > 0) {
    storyData.closeFriends = input.closeFriends;
  }
  if (input.hiddenFrom && input.hiddenFrom.length > 0) {
    storyData.hiddenFrom = input.hiddenFrom;
  }
  if (input.location &&
      typeof input.location.latitude === 'number' && isFinite(input.location.latitude) &&
      typeof input.location.longitude === 'number' && isFinite(input.location.longitude)) {
    storyData.location = {
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      ...(input.location.placeName ? { placeName: input.location.placeName } : {}),
      ...(input.location.placeId ? { placeId: input.location.placeId } : {}),
      ...(input.location.address ? { address: input.location.address } : {}),
    };
  }
  if (input.stickers && input.stickers.length > 0) {
    storyData.stickers = input.stickers;
  }

  const docRef = await addDoc(storiesCol(clinicId), storyData);

  const story: ClinicStory = {
    id: docRef.id,
    mediaUrl: input.mediaUrl,
    thumbnailUrl: input.thumbnailUrl,
    caption: input.caption,
    createdAt: now,
    expiresAt,
    clinicId,
    clinicName: input.clinicName,
    type: input.type,
    closeFriends: input.closeFriends,
    hiddenFrom: input.hiddenFrom,
    allowReplies: input.allowReplies ?? true,
    location: storyData.location,
    stickers: input.stickers && input.stickers.length > 0 ? input.stickers : undefined,
  };

  // ── Post-creation side effects (fire-and-forget) ───────────
  try {
    const prefs = await getClinicPreferences(clinicId);

    // Phase 3: Auto-archive
    if (prefs.saveStoryToArchive) {
      archiveStory(clinicId, story).catch((e) => logSilentFailure('storyService.archiveStory', e));
    }

    // Phase 4: Save to camera roll
    if (prefs.saveStoryToCameraRoll) {
      saveToCameraRoll(story.mediaUrl, story.type).catch(() => {});
    }
  } catch (e) {
    // Preference read failed — story is still saved, skip side effects
    logSilentFailure('storyService.getClinicPreferences', e);
  }

  return story;
}

/**
 * Fetch active (non-expired) stories for a clinic.
 * Returns only stories where expiresAt > now, ordered newest-first.
 * Privacy filtering: stories are filtered through isStoryVisible.
 */
export async function getActiveStories(
  clinicId: string,
  userId?: string | null,
): Promise<ClinicStory[]> {
  try {
    const now = Timestamp.now();
    const q = query(
      storiesCol(clinicId),
      where('expiresAt', '>', now),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClinicStory);
    return all.filter((story) => isStoryVisible(story, userId));
  } catch (error) {
    console.error('[STORY_SERVICE] Error fetching active stories:', error);
    return [];
  }
}

// ── Internal helpers ─────────────────────────────────────────────

/**
 * Copy a story into the archive collection.
 * Keeps all original fields including expiresAt, adds archivedAt.
 */
async function archiveStory(
  clinicId: string,
  story: ClinicStory,
): Promise<void> {
  const archiveData: Record<string, any> = {
    mediaUrl: story.mediaUrl,
    thumbnailUrl: story.thumbnailUrl ?? null,
    caption: story.caption ?? '',
    createdAt: story.createdAt,
    expiresAt: story.expiresAt,
    archivedAt: serverTimestamp(),
    clinicId: story.clinicId,
    clinicName: story.clinicName ?? '',
    type: story.type,
  };
  if (story.location) {
    archiveData.location = story.location;
  }
  if (story.stickers && story.stickers.length > 0) {
    archiveData.stickers = story.stickers;
  }
  await addDoc(archiveCol(clinicId), archiveData);
}

/**
 * Download a remote media URL to local cache, then save to device gallery.
 */
async function saveToCameraRoll(mediaUrl: string, type: 'image' | 'video'): Promise<void> {
  const localUri = await downloadToLocal(mediaUrl, type);
  await MediaLibrary.createAssetAsync(localUri);
}

/**
 * Infer file extension from the media URL or fall back based on story type.
 */
function inferExtension(url: string, type: 'image' | 'video'): string {
  const match = url.match(/\.(jpe?g|png|webp|gif|mp4|mov|avi|webm)(\?|$)/i);
  if (match) return match[1].toLowerCase();
  return type === 'video' ? 'mp4' : 'jpg';
}

/**
 * Download a remote file to the app's cache directory.
 */
async function downloadToLocal(url: string, type: 'image' | 'video'): Promise<string> {
  const ext = inferExtension(url, type);
  const fileName = `story_${Date.now()}.${ext}`;
  const destination = new ExpoFile(Paths.cache, fileName);
  const result = await FileSystem.downloadAsync(url, destination.uri);
  return result.uri;
}
