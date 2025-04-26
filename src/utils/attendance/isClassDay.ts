
/**
 * "Class day" = every calendar day **except** Friday + listed holidays.
 * Works in UTC so cron jobs & dashboards agree.
 */

// Define holidays - dates when we don't have class
const HOLIDAYS = new Set([
  '2025-04-20', // Easter Sunday
]);

/**
 * Determines if a given date is a class day (every day except Friday and holidays)
 * This is our single source of truth for class day determination
 */
export const isClassDay = (isoDate: string): boolean => {
  if (HOLIDAYS.has(isoDate)) return false;
  const dow = new Date(isoDate + 'T00:00:00Z').getUTCDay();   // 0-Sun … 6-Sat
  return dow !== 5;            // drop Fridays, keep everything else
};

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use isClassDay instead
 */
export const isAttendanceDay = isClassDay;
