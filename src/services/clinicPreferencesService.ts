/**
 * Clinic Settings Service (Instagram-style preferences)
 *
 * Firestore path: clinics/{clinicId}/settings/main
 *
 * This is SEPARATE from the existing clinicSettingsService.ts
 * which uses clinics/{clinicId}/settings/profile for branding.
 */
import { db } from '@/firebaseConfig';
import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';

export interface ClinicPreferences {
  // Archive & download
  saveStoryToArchive: boolean;
  saveLiveToArchive: boolean;
  saveOriginalPhotos: boolean;
  saveStoryToCameraRoll: boolean;

  // Like / share counts
  hideLikeCounts: boolean;
  hideShareCounts: boolean;
  hideViewCounts: boolean;

  // Hide story & live
  hideStoryFrom: boolean;
  hideLiveFrom: boolean;
  closeFriends: boolean;
  allowStoryReplies: boolean;

  // Sharing
  allowStorySharing: boolean;
  allowReposting: boolean;
  shareToOtherApps: boolean;
  shareableLink: boolean;

  // Time management
  dailyReminder: boolean;
  notificationSchedule: boolean;
  sleepMode: boolean;
  sessionTimeout: boolean;
  dailyLimitEnabled: boolean;
  dailyLimitMinutes: number | null;
  sleepModeEnabled: boolean;
  sleepStartTime: string;
  sleepEndTime: string;
  sleepDays: string[];

  // Messages / archive
  keepChatsArchived: boolean;

  updatedAt: any; // Firestore Timestamp
}

export const DEFAULT_PREFERENCES: Omit<ClinicPreferences, 'updatedAt'> = {
  saveStoryToArchive: true,
  saveLiveToArchive: false,
  saveOriginalPhotos: true,
  saveStoryToCameraRoll: false,

  hideLikeCounts: false,
  hideShareCounts: false,
  hideViewCounts: false,

  hideStoryFrom: false,
  hideLiveFrom: false,
  closeFriends: false,
  allowStoryReplies: true,

  allowStorySharing: true,
  allowReposting: true,
  shareToOtherApps: false,
  shareableLink: true,

  dailyReminder: false,
  notificationSchedule: false,
  sleepMode: false,
  sessionTimeout: false,
  dailyLimitEnabled: false,
  dailyLimitMinutes: null,
  sleepModeEnabled: false,
  sleepStartTime: '23:00',
  sleepEndTime: '07:00',
  sleepDays: [],

  keepChatsArchived: true,
};

/** Firestore doc ref helper */
const prefsDoc = (clinicId: string) =>
  doc(db, `clinics/${clinicId}/settings`, 'main');

/**
 * Fetch clinic preferences. Returns defaults if document doesn't exist.
 */
export async function getClinicPreferences(
  clinicId: string,
): Promise<ClinicPreferences> {
  try {
    const snap = await getDoc(prefsDoc(clinicId));
    if (snap.exists()) {
      return { ...DEFAULT_PREFERENCES, ...snap.data() } as ClinicPreferences;
    }
    return { ...DEFAULT_PREFERENCES, updatedAt: null } as ClinicPreferences;
  } catch (error) {
    console.error('[CLINIC_PREFS] Error fetching preferences:', error);
    return { ...DEFAULT_PREFERENCES, updatedAt: null } as ClinicPreferences;
  }
}

/**
 * Update clinic preferences (partial merge).
 * Creates the document with defaults if it doesn't exist yet.
 */
export async function updateClinicPreferences(
  clinicId: string,
  updates: Partial<Omit<ClinicPreferences, 'updatedAt'>>,
): Promise<void> {
  try {
    await setDoc(
      prefsDoc(clinicId),
      { ...updates, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (error) {
    console.error('[CLINIC_PREFS] Error updating preferences:', error);
    throw error;
  }
}

/**
 * Real-time listener for clinic preferences.
 * Returns an unsubscribe function.
 */
export function subscribeToClinicPreferences(
  clinicId: string,
  callback: (prefs: ClinicPreferences) => void,
): () => void {
  return onSnapshot(
    prefsDoc(clinicId),
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_PREFERENCES, ...snap.data() } as ClinicPreferences);
      } else {
        callback({ ...DEFAULT_PREFERENCES, updatedAt: null } as ClinicPreferences);
      }
    },
    (error) => {
      console.error('[CLINIC_PREFS] Snapshot error:', error);
    },
  );
}
