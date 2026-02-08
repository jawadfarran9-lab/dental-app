// PHASE AA-2: Usage Tracking Service (No Payments, No Enforcement)

import { db } from '@/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { UsageStats, SOFT_LIMIT_PATIENTS, SOFT_LIMIT_SESSIONS, SOFT_LIMIT_MESSAGES } from '@/src/types/trial';
import { logUsageLimitWarning } from './trialService';

/**
 * Initialize usage stats for a clinic
 */
export async function initUsageStats(clinicId: string): Promise<UsageStats> {
  try {
    const stats: UsageStats = {
      clinicId,
      patientsCount: 0,
      sessionsCount: 0,
      messagesCount: 0,
      lastUpdatedAt: Date.now(),
    };

    await setDoc(doc(db, 'clinics', clinicId, 'usage', 'stats'), stats);
    return stats;
  } catch (err) {
    console.error('[USAGE] initUsageStats error', err);
    throw err;
  }
}

/**
 * Get current usage stats for clinic
 */
export async function getUsageStats(clinicId: string): Promise<UsageStats | null> {
  try {
    const ref = doc(db, 'clinics', clinicId, 'usage', 'stats');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as UsageStats;
  } catch (err) {
    console.error('[USAGE] getUsageStats error', err);
    return null;
  }
}

/**
 * Recalculate usage stats by counting actual records in Firestore
 * Runs on-demand or periodically
 */
export async function recalculateUsageStats(clinicId: string): Promise<UsageStats> {
  try {
    // Count patients in clinic
    const patientsRef = collection(db, 'clinics', clinicId, 'patients');
    const patientsSnap = await getDocs(patientsRef);
    const patientsCount = patientsSnap.size;

    // Count sessions across all patients
    let sessionsCount = 0;
    for (const patientDoc of patientsSnap.docs) {
      const sessionsRef = collection(db, 'clinics', clinicId, 'patients', patientDoc.id, 'sessions');
      const sessionsSnap = await getDocs(sessionsRef);
      sessionsCount += sessionsSnap.size;
    }

    // Count messages across all patients
    let messagesCount = 0;
    for (const patientDoc of patientsSnap.docs) {
      const messagesRef = collection(db, 'clinics', clinicId, 'patients', patientDoc.id, 'messages');
      const messagesSnap = await getDocs(messagesRef);
      messagesCount += messagesSnap.size;
    }

    const stats: UsageStats = {
      clinicId,
      patientsCount,
      sessionsCount,
      messagesCount,
      lastUpdatedAt: Date.now(),
    };

    // Save updated stats
    await setDoc(doc(db, 'clinics', clinicId, 'usage', 'stats'), stats, { merge: true });

    // Log warnings if near soft limits (non-blocking)
    await logUsageLimitWarning(clinicId, 'patients', patientsCount, SOFT_LIMIT_PATIENTS);
    await logUsageLimitWarning(clinicId, 'sessions', sessionsCount, SOFT_LIMIT_SESSIONS);
    await logUsageLimitWarning(clinicId, 'messages', messagesCount, SOFT_LIMIT_MESSAGES);

    return stats;
  } catch (err) {
    console.error('[USAGE] recalculateUsageStats error', err);
    throw err;
  }
}

/**
 * Get usage percentage (for UI progress bars)
 */
export function getUsagePercentage(
  current: number,
  limit: number
): number {
  if (limit <= 0) return 0;
  return Math.round((current / limit) * 100);
}

/**
 * Check if usage is near or above soft limit
 */
export function isNearLimit(current: number, limit: number): boolean {
  return current >= limit * 0.8; // Warn at 80% of limit
}
