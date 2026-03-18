/**
 * useWeeklyUsage — read hook for Time Management main screen
 *
 * Fetches the last 7 calendar days (including today) from
 * clinics/{clinicId}/analytics/timeManagement.dailyUsageSeconds
 *
 * Single source of truth for: hero average, chart bars, tooltip values.
 */
import { db } from '@/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface DayEntry {
  key: string;   // "2026-03-18"
  label: string;  // "Mon"
  seconds: number;
}

export interface WeeklyUsage {
  loading: boolean;
  week: DayEntry[];       // always length 7, oldest→newest (today is last)
  todayIndex: number;     // always 6
  averageSeconds: number; // rounded to nearest second
  averageLabel: string;   // formatted "1h 22m"
}

/** "YYYY-MM-DD" for a Date in local timezone */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Shared formatter: seconds → human-readable string.
 * 0 → "0m",  2400 → "40m",  3600 → "1h 0m",  4920 → "1h 22m"
 */
export function formatSeconds(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes <= 0) return '0m';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function useWeeklyUsage(clinicId: string | undefined): WeeklyUsage {
  const [loading, setLoading] = useState(true);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    const ref = doc(db, `clinics/${clinicId}/analytics`, 'timeManagement');

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = (snap.data()?.dailyUsageSeconds as Record<string, number>) ?? {};
        setUsageMap(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return unsub;
  }, [clinicId]);

  // Build last 7 days: [today-6 … today]
  const today = new Date();
  const week: DayEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    week.push({
      key,
      label: DAY_NAMES[d.getDay()],
      seconds: usageMap[key] ?? 0,
    });
  }

  const sum = week.reduce((acc, d) => acc + d.seconds, 0);
  const averageSeconds = Math.round(sum / 7);

  return {
    loading,
    week,
    todayIndex: 6,
    averageSeconds,
    averageLabel: formatSeconds(averageSeconds),
  };
}
