/**
 * Clinic Weekly Schedule Types & Helpers
 *
 * Strongly-typed model for per-day working hours.
 * Used by signup, confirmation, and settings screens.
 */

// ── Types ──────────────────────────────────────────────────────

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface DaySchedule {
  enabled: boolean;
  /** Opening time in "HH:MM" 24-hour format */
  open: string;
  /** Closing time in "HH:MM" 24-hour format */
  close: string;
}

export type WeeklySchedule = Record<DayOfWeek, DaySchedule>;

// ── Deterministic ordering ─────────────────────────────────────

export const DAYS_ORDER: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

// ── Factory ────────────────────────────────────────────────────

/** Returns a WeeklySchedule with every day disabled and safe time defaults. */
export function createDefaultSchedule(): WeeklySchedule {
  const base: DaySchedule = { enabled: false, open: '09:00', close: '17:00' };

  return {
    monday:    { ...base },
    tuesday:   { ...base },
    wednesday: { ...base },
    thursday:  { ...base },
    friday:    { ...base },
    saturday:  { ...base },
    sunday:    { ...base },
  };
}

// ── Helpers ────────────────────────────────────────────────────

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday:    'Monday',
  tuesday:   'Tuesday',
  wednesday: 'Wednesday',
  thursday:  'Thursday',
  friday:    'Friday',
  saturday:  'Saturday',
  sunday:    'Sunday',
};

/** Returns the Title-Case English label for a day. */
export function formatDayLabel(day: DayOfWeek): string {
  return DAY_LABELS[day];
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validates that both strings are "HH:MM" (24-hour) and that open < close.
 * Uses simple string comparison which is safe for zero-padded 24-hour times.
 */
export function isValidTimeRange(open: string, close: string): boolean {
  if (!TIME_RE.test(open) || !TIME_RE.test(close)) {
    return false;
  }
  return open < close;
}
