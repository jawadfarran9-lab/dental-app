/**
 * App Usage Tracker — foreground time tracking hook
 *
 * Mount ONCE at app root level (inside ClinicProvider).
 * Tracks total app foreground time per calendar day.
 *
 * Strategy:
 *   - AppState 'active' → start timing
 *   - AppState 'inactive'/'background' → stop + flush
 *   - Safety interval every 60s while active → flush
 *   - Unsaved seconds survive failed flushes in memory
 */
import { useClinic } from '@/src/context/ClinicContext';
import { flushUsageSeconds } from '@/src/services/appUsageService';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** "YYYY-MM-DD" for today in local timezone */
function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const SAFETY_INTERVAL_MS = 60_000; // 60 seconds

/**
 * Single-instance foreground usage tracker.
 * Call once at the app root — do not mount in multiple places.
 */
export function useAppUsageTracker() {
  const { clinicId } = useClinic();

  // Mutable refs to avoid stale closures in AppState listener
  const clinicIdRef = useRef(clinicId);
  const activeStartRef = useRef<number | null>(null);
  const unsavedSecondsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep clinicId ref up to date
  useEffect(() => {
    clinicIdRef.current = clinicId;
  }, [clinicId]);

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

    function startTracking() {
      if (activeStartRef.current !== null) return;
      activeStartRef.current = Date.now();

      if (intervalRef.current === null) {
        intervalRef.current = setInterval(() => {
          flush();
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
  }, []); // empty deps — single instance, refs handle everything
}
