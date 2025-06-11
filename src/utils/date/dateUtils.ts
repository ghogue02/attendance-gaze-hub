
/**
 * Utility functions for handling dates in the application
 */
import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// Eastern timezone identifier
export const TIMEZONE = 'America/New_York';

/**
 * Returns the current date in YYYY-MM-DD format in Eastern Time
 */
export const getCurrentDateString = (): string => {
  const now = new Date();
  return formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Returns a formatted display date string in Eastern Time
 */
export const getDisplayDateString = (): string => {
  const now = new Date();
  return formatInTimeZone(now, TIMEZONE, 'EEEE, MMMM d, yyyy');
};

/**
 * Logs date information for debugging
 */
export const logDateDebugInfo = (context: string, dateString: string): void => {
  const now = new Date();
  const easternTime = toZonedTime(now, TIMEZONE);
  console.log(`[${context}] Current date string: ${dateString}`);
  console.log(`[${context}] Current time in UTC: ${now.toISOString()}`);
  console.log(`[${context}] Current time in Eastern: ${formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss z')}`);
};

/**
 * Parse a date string as Eastern Time
 */
export const parseAsEastern = (dateStr: string): Date => {
  return toZonedTime(new Date(`${dateStr}T00:00:00`), TIMEZONE);
};

/**
 * Format time to Eastern Time
 */
export const formatTimeInEastern = (date: Date): string => {
  return formatInTimeZone(date, TIMEZONE, 'h:mm a');
};

/**
 * Convert ISO date string to Eastern Time and return formatted time
 */
export const formatISOTimeToEastern = (isoString: string): string => {
  try {
    const date = parseISO(isoString);
    return formatInTimeZone(date, TIMEZONE, 'h:mm a');
  } catch (e) {
    console.error('Error formatting ISO time to Eastern:', e);
    return '';
  }
};

/**
 * Checks if a time falls within the "late" attendance windows using Eastern Time
 * Late is:
 * - Weekends (Sat-Sun): Starting at 10:00 AM EDT onwards
 * - Weekdays (Mon-Thu): Starting at 6:30 PM EDT onwards
 */
export const isLateArrivalEastern = (dateTime: Date): boolean => {
  const easternTime = toZonedTime(dateTime, TIMEZONE);
  const dayOfWeek = easternTime.getDay();
  const hours = easternTime.getHours();
  const minutes = easternTime.getMinutes();
  
  // Weekend (Saturday = 6, Sunday = 0)
  if (dayOfWeek === 6 || dayOfWeek === 0) {
    // Late starts at 10:00 AM Eastern
    return hours >= 10;
  }
  
  // Weekday (Monday-Thursday, Friday is excluded elsewhere)
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    const totalMinutes = hours * 60 + minutes;
    // Late starts at 6:30 PM Eastern (18:30)
    return totalMinutes >= (18 * 60 + 30);
  }
  
  // Default: Not considered late
  return false;
};

/**
 * Check if the app window is currently visible to the user
 * Used to reduce API calls when the app is in the background
 */
export const isWindowVisible = (): boolean => {
  if (typeof document === 'undefined') return true;
  return !document.hidden;
};

/**
 * Check if we're in overnight hours when requests should be minimized
 * Defined as between 11:00 PM and 6:00 AM Eastern Time
 */
export const isOvernightHours = (): boolean => {
  const now = new Date();
  const easternTime = toZonedTime(now, TIMEZONE);
  const hours = easternTime.getHours();
  
  // Consider 11pm-6am as overnight hours
  return hours >= 23 || hours < 6;
};

// Legacy functions below are kept for backward compatibility
export { parseAsUTC, isLateArrivalUTC, isLateArrival } from './legacyDateUtils';
