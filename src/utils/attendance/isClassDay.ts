
/**
 * "Class day" = every calendar day **except** Friday + listed holidays/cancellations.
 * Works in UTC so cron jobs & dashboards agree.
 */

// Define permanent holidays - dates when we never have class (annual events)
const HOLIDAYS = new Set([
  '2025-04-20', // Easter Sunday
]);

// Define one-off cancellations - dates when class was cancelled for special reasons
// This can be extended with more dates as needed for weather cancellations, special events, etc.
export const CANCELLED_CLASSES = new Set([
  // Format: 'YYYY-MM-DD'
  // Example: '2025-05-10', // Special event cancellation
]);

/**
 * Determines if a given date is a class day (every day except Friday, permanent holidays,
 * and one-off cancellations)
 * 
 * This is our single source of truth for class day determination
 */
export const isClassDay = (isoDate: string): boolean => {
  // Check permanent holidays first
  if (HOLIDAYS.has(isoDate)) return false;
  
  // Check one-off cancellations
  if (CANCELLED_CLASSES.has(isoDate)) return false;
  
  // Check if it's Friday (day 5)
  const dow = new Date(isoDate + 'T00:00:00Z').getUTCDay();   // 0-Sun … 6-Sat
  return dow !== 5;  // Drop Fridays, keep everything else (including Sundays)
};

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use isClassDay instead
 */
export const isAttendanceDay = isClassDay;

/**
 * Determines if a given date is a cancelled class day 
 * (would normally be a class day, but was cancelled as a one-off)
 */
export const isCancelledClassDay = (isoDate: string): boolean => {
  // First check if it would normally be a class day (not a Friday or permanent holiday)
  const dow = new Date(isoDate + 'T00:00:00Z').getUTCDay();
  const wouldBeClassDay = (dow !== 5 && !HOLIDAYS.has(isoDate));
  
  // Then check if it's in the cancelled set
  return wouldBeClassDay && CANCELLED_CLASSES.has(isoDate);
};

/**
 * Checks if a date is a permanent holiday (never a class day)
 */
export const isHoliday = (isoDate: string): boolean => {
  return HOLIDAYS.has(isoDate);
};
