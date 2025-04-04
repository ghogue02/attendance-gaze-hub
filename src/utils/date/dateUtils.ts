/**
 * Utility functions for handling dates in the application
 */

/**
 * Returns the current date in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * Returns a formatted display date string
 */
export const getDisplayDateString = (): string => {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

/**
 * Logs date information for debugging
 */
export const logDateDebugInfo = (context: string, dateString: string): void => {
  console.log(`[${context}] Current date string: ${dateString}`);
};

/**
 * Parse a date string as UTC
 */
export const parseAsUTC = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00Z');
};

/**
 * Checks if a time falls within the "late" attendance windows using UTC time
 * Late is:
 * - Weekends (Sat-Sun): Starting at 10:00 AM EDT (14:00 UTC) onwards
 * - Weekdays (Mon-Thu): Starting at 6:30 PM EDT (22:30 UTC) onwards
 */
export const isLateArrivalUTC = (dayOfWeekUTC: number, hourUTC: number, minutesUTC: number): boolean => {
  // Weekend (Saturday = 6, Sunday = 0 UTC)
  if (dayOfWeekUTC === 6 || dayOfWeekUTC === 0) {
    // Late starts at 10:00 AM EDT == 14:00 UTC
    const startLateHourUTC = 14;
    return hourUTC >= startLateHourUTC;
  }
  
  // Weekday (Monday-Thursday UTC, Friday is excluded elsewhere)
  // Late starts at 6:30 PM EDT == 22:30 UTC
  if (dayOfWeekUTC >= 1 && dayOfWeekUTC <= 4) {
    const startLateMinutesUTC = 22 * 60 + 30; // 22:30 UTC
    const totalMinutesUTC = hourUTC * 60 + minutesUTC;
    return totalMinutesUTC >= startLateMinutesUTC;
  }
  
  // Default: Not considered late (e.g., if Friday data somehow gets here)
  return false;
};

/**
 * Legacy function that uses local time - DEPRECATED
 * Use isLateArrivalUTC instead
 */
export const isLateArrival = (date: Date, timeStr: string): boolean => {
  console.warn('DEPRECATED: isLateArrival using local time is deprecated. Use isLateArrivalUTC instead.');
  
  const day = date.getDay();
  
  // Parse the time string (assuming format like "6:30 PM" or "10:45 AM")
  const [timePart, ampm] = timeStr.split(' ');
  const [hourStr, minuteStr] = timePart.split(':');
  
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);
  const isPM = ampm?.toLowerCase() === 'pm';
  
  // Convert to 24-hour format
  const hour24 = isPM && hour !== 12 ? hour + 12 : (hour === 12 && !isPM ? 0 : hour);
  
  // Weekend (Saturday = 6, Sunday = 0)
  if (day === 6 || day === 0) {
    // Late on weekend: 10 AM - 4 PM (10:00-16:00)
    return hour24 >= 10 && hour24 < 16;
  }
  
  // Weekday (Monday-Thursday, Friday is typically excluded)
  // Late on weekdays: 6:30 PM - 10 PM (18:30-22:00)
  if (day >= 1 && day <= 4) {
    const totalMinutes = hour24 * 60 + minute;
    return totalMinutes >= (18 * 60 + 30) && totalMinutes < (22 * 60);
  }
  
  return false;
};
