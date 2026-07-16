import { db } from '@/firebaseConfig';
import { logSilentFailure } from '@/src/utils/silentFailure';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    serverTimestamp,
    setDoc,
    updateDoc,
} from 'firebase/firestore';

// ========== Device ID (reuse existing pattern) ==========
const DEVICE_ID_KEY = '@device_id';

const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
};

// ========== Like System ==========
// Path: clinics/{clinicId}/media/{postId}/likes/{deviceId}

const likeDoc = (clinicId: string, postId: string, deviceId: string) =>
  doc(db, 'clinics', clinicId, 'media', postId, 'likes', deviceId);

const likesCol = (clinicId: string, postId: string) =>
  collection(db, 'clinics', clinicId, 'media', postId, 'likes');

const mediaDoc = (clinicId: string, postId: string) =>
  doc(db, 'clinics', clinicId, 'media', postId);

/**
 * Toggle like on a post. Returns new status + count.
 */
export const togglePostLike = async (
  clinicId: string,
  postId: string,
  initialLikes: number = 0,
): Promise<{ isLiked: boolean; likeCount: number }> => {
  const deviceId = await getDeviceId();
  const ref = likeDoc(clinicId, postId, deviceId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    // Unlike
    await deleteDoc(ref);
    try {
      await updateDoc(mediaDoc(clinicId, postId), { likeCount: increment(-1) });
    } catch (e) { logSilentFailure('engagementService.incrementLikeCount', e); /* media doc may not have likeCount yet */ }
    const count = await getLikeCount(clinicId, postId, initialLikes);
    return { isLiked: false, likeCount: Math.max(0, count) };
  } else {
    // Like
    await setDoc(ref, { deviceId, createdAt: serverTimestamp() });
    try {
      await updateDoc(mediaDoc(clinicId, postId), { likeCount: increment(1) });
    } catch (e) {
      logSilentFailure('engagementService.rollbackLikeCount', e);
      // If media doc doesn't have likeCount field, set it
      try {
        const mSnap = await getDoc(mediaDoc(clinicId, postId));
        if (mSnap.exists()) {
          await updateDoc(mediaDoc(clinicId, postId), { likeCount: (mSnap.data().likeCount || 0) + 1 });
        }
      } catch (e2) { logSilentFailure('engagementService.rollbackLikeCount.inner', e2); /* ignore */ }
    }
    const count = await getLikeCount(clinicId, postId, initialLikes);
    return { isLiked: true, likeCount: count };
  }
};

/**
 * Get like count from media document's likeCount field,
 * falling back to subcollection count.
 */
const getLikeCount = async (
  clinicId: string,
  postId: string,
  fallback: number,
): Promise<number> => {
  try {
    const mSnap = await getDoc(mediaDoc(clinicId, postId));
    if (mSnap.exists() && typeof mSnap.data().likeCount === 'number') {
      return mSnap.data().likeCount;
    }
    // Fallback: count subcollection docs
    const snap = await getDocs(likesCol(clinicId, postId));
    return snap.size;
  } catch {
    return fallback;
  }
};

/**
 * Batch: get like status + count for multiple posts.
 * Same signature pattern as old postService.getPostsLikeData
 * but with clinicId.
 */
export const getPostsLikeData = async (
  clinicId: string,
  postIds: string[],
  fallbackCounts: Record<string, number> = {},
): Promise<Record<string, { isLiked: boolean; likeCount: number }>> => {
  const deviceId = await getDeviceId();
  const result: Record<string, { isLiked: boolean; likeCount: number }> = {};

  await Promise.all(
    postIds.map(async (postId) => {
      try {
        // Check if this device liked it
        const snap = await getDoc(likeDoc(clinicId, postId, deviceId));
        const isLiked = snap.exists();

        // Get count from media doc
        const mSnap = await getDoc(mediaDoc(clinicId, postId));
        const likeCount =
          mSnap.exists() && typeof mSnap.data().likeCount === 'number'
            ? mSnap.data().likeCount
            : fallbackCounts[postId] ?? 0;

        result[postId] = { isLiked, likeCount };
      } catch {
        result[postId] = { isLiked: false, likeCount: fallbackCounts[postId] ?? 0 };
      }
    }),
  );

  return result;
};

// ========== Save System ==========
// Path: users/{deviceId}/saved/{postId}

const savedDoc = (deviceId: string, postId: string) =>
  doc(db, 'users', deviceId, 'saved', postId);

const savedCol = (deviceId: string) =>
  collection(db, 'users', deviceId, 'saved');

/**
 * Toggle save on a post. Returns new saved status.
 */
export const toggleSavePost = async (postId: string): Promise<boolean> => {
  try {
    const deviceId = await getDeviceId();
    const ref = savedDoc(deviceId, postId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await deleteDoc(ref);
      return false;
    } else {
      await setDoc(ref, { postId, savedAt: serverTimestamp() });
      return true;
    }
  } catch (error) {
    console.error('[ENGAGEMENT] Error toggling save:', error);
    throw error;
  }
};

/**
 * Batch: get saved status for multiple posts.
 */
export const getSavedStatusBatch = async (
  postIds: string[],
): Promise<Record<string, boolean>> => {
  const deviceId = await getDeviceId();
  const result: Record<string, boolean> = {};

  await Promise.all(
    postIds.map(async (postId) => {
      try {
        const snap = await getDoc(savedDoc(deviceId, postId));
        result[postId] = snap.exists();
      } catch {
        result[postId] = false;
      }
    }),
  );

  return result;
};

/**
 * Get all saved post IDs for the current device.
 */
export const getSavedPostIds = async (): Promise<string[]> => {
  try {
    const deviceId = await getDeviceId();
    const snap = await getDocs(savedCol(deviceId));
    return snap.docs.map((d) => d.id);
  } catch (error) {
    console.error('[ENGAGEMENT] Error fetching saved post IDs:', error);
    return [];
  }
};

/**
 * Check if a single post is saved.
 */
export const isPostSaved = async (postId: string): Promise<boolean> => {
  try {
    const deviceId = await getDeviceId();
    const snap = await getDoc(savedDoc(deviceId, postId));
    return snap.exists();
  } catch {
    return false;
  }
};

// ========== Hidden Reels (Not Interested) ==========
const HIDDEN_REELS_KEY = '@hidden_reels';

export const hideReel = async (reelId: string): Promise<void> => {
  try {
    const ids = await getHiddenReelIds();
    if (!ids.includes(reelId)) {
      ids.push(reelId);
      await AsyncStorage.setItem(HIDDEN_REELS_KEY, JSON.stringify(ids));
    }
  } catch (error) {
    console.error('[ENGAGEMENT] Error hiding reel:', error);
  }
};

export const getHiddenReelIds = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(HIDDEN_REELS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearHiddenReels = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HIDDEN_REELS_KEY);
  } catch {
    // silent
  }
};

// ========== Reports ==========
const REPORTS_KEY = '@reel_reports';

export interface ReelReport {
  reelId: string;
  reason: string;
  timestamp: number;
}

export const reportReel = async (reelId: string, reason: string): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    const reports: ReelReport[] = raw ? JSON.parse(raw) : [];
    reports.push({ reelId, reason, timestamp: Date.now() });
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error('[ENGAGEMENT] Error reporting reel:', error);
  }
};

export const getReelReports = async (): Promise<ReelReport[]> => {
  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// ========== Interested ==========
const INTERESTED_REELS_KEY = '@interested_reels';

export const markInterested = async (reelId: string): Promise<void> => {
  try {
    const ids = await getInterestedReelIds();
    if (!ids.includes(reelId)) {
      ids.push(reelId);
      await AsyncStorage.setItem(INTERESTED_REELS_KEY, JSON.stringify(ids));
    }
  } catch (error) {
    console.error('[ENGAGEMENT] Error marking interested:', error);
  }
};

export const getInterestedReelIds = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(INTERESTED_REELS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearInterestedReels = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(INTERESTED_REELS_KEY);
  } catch {
    // silent
  }
};

// ========== Category Preference Profile ==========
const CATEGORY_PROFILE_KEY = '@reel_category_profile';

export const saveCategoryProfile = async (profile: Record<string, number>): Promise<void> => {
  try {
    const stored: Record<string, { score: number }> = {};
    for (const [cat, score] of Object.entries(profile)) {
      stored[cat] = { score };
    }
    await AsyncStorage.setItem(CATEGORY_PROFILE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('[ENGAGEMENT] Error saving category profile:', error);
  }
};

export const loadCategoryProfile = async (): Promise<Record<string, number>> => {
  try {
    const raw = await AsyncStorage.getItem(CATEGORY_PROFILE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { score: number }>;
    const result: Record<string, number> = {};
    for (const [cat, val] of Object.entries(parsed)) {
      if (typeof val?.score === 'number') result[cat] = val.score;
    }
    return result;
  } catch {
    return {};
  }
};
