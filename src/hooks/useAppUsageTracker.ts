/**
 * App Usage Tracker — foreground time tracking hook
 *
 * Mount ONCE at app root level (inside ClinicProvider).
 * Tracks total app foreground time per calendar day.
 * Reads clinic preferences to enforce daily limit & sleep mode.
 *
 * Strategy:
 *   - AppState 'active' → start timing
 *   - AppState 'inactive'/'background' → stop + flush
 *   - Safety interval every 60s while active → flush + check limits
 *   - Unsaved seconds survive failed flushes in memory
 */
import { useClinic } from '@/src/context/ClinicContext';
import { flushUsageSeconds } from '@/src/services/appUsageService';
import { getClinicPreferences } from '@/src/services/clinicPreferencesService';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** "YYYY-MM-DD" for today in local timezone */
function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Check if current time (HH:MM) is inside a sleep window (handles overnight). */
function isInSleepWindow(startTime: string, endTime: string): boolean {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  if (startMins <= endMins) {
    // Same-day window (e.g. 09:00 – 17:00)
    return nowMins >= startMins && nowMins < endMins;
  }
  // Overnight window (e.g. 23:00 – 07:00)
  return nowMins >= startMins || nowMins < endMins;
}

export type BlockReason = 'limit' | 'sleep' | null;

const SAFETY_INTERVAL_MS = 60_000; // 60 seconds

/**
 * Single-instance foreground usage tracker.
 * Call once at the app root — do not mount in multiple places.
 *
 * Returns `isBlocked` and `blockReason` for rendering an overlay.
 */
export function useAppUsageTracker(): {
  isBlocked: boolean;
  blockReason: BlockReason;
} {
  const { clinicId } = useClinic();

  const [blockReason, setBlockReason] = useState<BlockReason>(null);

  // Mutable refs to avoid stale closures in AppState listener
  const clinicIdRef = useRef(clinicId);
  const activeStartRef = useRef<number | null>(null);
  const unsavedSecondsRef = useRef(0);
  const totalTodaySecondsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep clinicId ref up to date
  useEffect(() => {
    clinicIdRef.current = clinicId;
  }, [clinicId]);

  /** Read preferences and check daily limit + sleep mode. */
  const checkLimits = useCallback(async () => {
    const cid = clinicIdRef.current;
    if (!cid) return;

    try {
      const prefs = await getClinicPreferences(cid);

      // Sleep mode check
      if (prefs.sleepModeEnabled && prefs.sleepStartTime && prefs.sleepEndTime) {
        if (isInSleepWindow(prefs.sleepStartTime, prefs.sleepEndTime)) {
          setBlockReason('sleep');
          return;
        }
      }

      // Daily limit check
      if (prefs.dailyLimitEnabled && prefs.dailyLimitMinutes) {
        const usedMinutes = totalTodaySecondsRef.current / 60;
        if (usedMinutes >= prefs.dailyLimitMinutes) {
          setBlockReason('limit');
          return;
        }
      }

      // No block
      setBlockReason(null);
    } catch {
      // Preference read failed — don't block
    }
  }, []);

  useEffect(() => {
    /** Harvest elapsed seconds since last checkpoint, reset checkpoint to now */
    function harvest(): number {
      if (activeStartRef.current === null) return 0;
      const now = Date.now();
      const elapsed = Math.floor((now - activeStartRef.current) / 1000);
      activeStartRef.current = now; // reset checkpoint
      return Math.max(0, elapsed);
    }

    /** Flush accumulated seconds to Firestore */
    async function flush() {
      const delta = harvest() + unsavedSecondsRef.current;
      if (delta <= 0) return;

      // Track local total for limit checks
      totalTodaySecondsRef.current += delta;

      const cid = clinicIdRef.current;
      if (!cid) {
        unsavedSecondsRef.current = delta;
        return;
      }

      unsavedSecondsRef.current = 0;

      try {
        await flushUsageSeconds(cid, todayKey(), delta);
      } catch {
        unsavedSecondsRef.current += delta;
      }
    }

    async function flushAndCheck() {
      await flush();
      await checkLimits();
    }

    function startTracking() {
      if (activeStartRef.current !== null) return;
      activeStartRef.current = Date.now();

      // Check limits immediately on app becoming active
      checkLimits();

      if (intervalRef.current === null) {
        intervalRef.current = setInterval(() => {
          flushAndCheck();
        }, SAFETY_INTERVAL_MS);
      }
    }

    function stopTracking() {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      flush();
      activeStartRef.current = null;
    }

    function handleAppState(nextState: AppStateStatus) {
      if (nextState === 'active') {
        startTracking();
      } else {
        stopTracking();
      }
    }

    // If app is already active when hook mounts, start immediately
    if (AppState.currentState === 'active') {
      startTracking();
    }

    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      sub.remove();
      // On unmount: harvest remaining time and keep unsaved
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const remaining = harvest();
      unsavedSecondsRef.current += remaining;
      activeStartRef.current = null;
    };
  }, [checkLimits]);

  return { isBlocked: blockReason !== null, blockReason };
}
