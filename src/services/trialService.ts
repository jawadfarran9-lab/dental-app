// PHASE AA-2: Trial Management Service (No Payments)

import { db } from '@/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { TrialStatus, TRIAL_DURATION_DAYS } from '@/src/types/trial';
import { writeAuditLog } from './auditLogService';

/**
 * Initialize trial for a new clinic (30 days from signup)
 */
export async function initTrial(clinicId: string): Promise<TrialStatus> {
  try {
    const now = Date.now();
    const trialEndsAt = now + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000; // 30 days from now

    const trialData: TrialStatus = {
      clinicId,
      trialActive: true,
      trialStartedAt: now,
      trialEndsAt,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'clinics', clinicId, 'trial', 'status'), trialData);

    // Log trial start
    await writeAuditLog({
      clinicId,
      actorId: 'system',
      actorName: 'System',
      action: 'TRIAL_STARTED' as any,
      details: { trialEndsAt },
    });

    return trialData;
  } catch (err) {
    console.error('[TRIAL] initTrial error', err);
    throw err;
  }
}

/**
 * Get current trial status for clinic
 */
export async function getTrial(clinicId: string): Promise<TrialStatus | null> {
  try {
    const ref = doc(db, 'clinics', clinicId, 'trial', 'status');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const trial = snap.data() as TrialStatus;

    // Calculate days remaining
    if (trial.trialEndsAt) {
      const now = Date.now();
      const daysRemaining = Math.ceil((trial.trialEndsAt - now) / (24 * 60 * 60 * 1000));
      trial.trialDaysRemaining = Math.max(0, daysRemaining);

      // If trial has expired, mark as inactive
      if (daysRemaining <= 0) {
        trial.trialActive = false;
        await updateDoc(ref, { trialActive: false, updatedAt: serverTimestamp() });

        // Log expiration
        await writeAuditLog({
          clinicId,
          actorId: 'system',
          actorName: 'System',
          action: 'TRIAL_EXPIRED' as any,
        });
      }
    }

    return trial;
  } catch (err) {
    console.error('[TRIAL] getTrial error', err);
    return null;
  }
}

/**
 * Check if trial is currently active
 */
export async function isTrialActive(clinicId: string): Promise<boolean> {
  const trial = await getTrial(clinicId);
  return trial?.trialActive ?? false;
}

/**
 * Log usage limit warning if usage exceeds soft limits
 */
export async function logUsageLimitWarning(
  clinicId: string,
  limitType: 'patients' | 'sessions' | 'messages',
  currentCount: number,
  limitThreshold: number
): Promise<void> {
  try {
    if (currentCount >= limitThreshold) {
      await writeAuditLog({
        clinicId,
        actorId: 'system',
        actorName: 'System',
        action: 'USAGE_LIMIT_WARNING' as any,
        targetName: `${limitType} limit`,
        details: { limitType, currentCount, limitThreshold },
      });
    }
  } catch (err) {
  }
}
