import { DayOfWeek, WeeklySchedule } from '@/src/types/clinicSchedule';

/**
 * Current open/closed status derived from a WeeklySchedule.
 */
export type OpenStatus =
  | { status: 'open'; closesAt: string }
  | { status: 'closed'; opensAt?: string };

/** Map JS Date.getDay() (0=Sun..6=Sat) to DayOfWeek key. */
const JS_DAY_MAP: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Determine whether the clinic is currently open based on its weekly schedule.
 *
 * Uses device local time. Assumes same-day ranges only (no overnight spans).
 *
 * @param workingHours  The clinic's weekly schedule.
 * @param now           Override for testing; defaults to current device time.
 */
export function getClinicOpenStatus(
  workingHours: WeeklySchedule,
  now: Date = new Date(),
): OpenStatus {
  const dayKey = JS_DAY_MAP[now.getDay()];
  const ds = workingHours[dayKey];

  if (!ds.enabled) {
    return { status: 'closed' };
  }

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const nowTime = `${hh}:${mm}`;

  if (nowTime >= ds.open && nowTime < ds.close) {
    return { status: 'open', closesAt: ds.close };
  }

  return { status: 'closed', opensAt: ds.open };
}
