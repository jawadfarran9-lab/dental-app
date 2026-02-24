import { DAYS_ORDER, DayOfWeek, WeeklySchedule } from '@/src/types/clinicSchedule';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Safely parse an unknown value into a valid WeeklySchedule.
 *
 * Returns null if the data is missing, not an object, or any day
 * fails structural / format validation. Never throws.
 */
export function parseWorkingHours(data: unknown): WeeklySchedule | null {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const obj = data as Record<string, unknown>;
  const result: Partial<WeeklySchedule> = {};

  for (const day of DAYS_ORDER) {
    const entry = obj[day];
    if (entry == null || typeof entry !== 'object' || Array.isArray(entry)) {
      return null;
    }

    const e = entry as Record<string, unknown>;

    if (typeof e.enabled !== 'boolean') return null;
    if (typeof e.open !== 'string' || typeof e.close !== 'string') return null;
    if (!TIME_RE.test(e.open) || !TIME_RE.test(e.close)) return null;

    if (e.enabled && e.open >= e.close) return null;

    result[day as DayOfWeek] = {
      enabled: e.enabled,
      open: e.open,
      close: e.close,
    };
  }

  return result as WeeklySchedule;
}
