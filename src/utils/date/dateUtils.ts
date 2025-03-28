
/**
 * Utility functions for handling dates in the application
 */

/**
 * Returns the current date in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  const now = new Date();
  // Format as YYYY-MM-DD to avoid timezone issues
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
 * Checks if a time falls within the "late" attendance windows
 * Late is:
 * - Weekdays (Mon-Thu): 6:30 PM - 10:00 PM
 * - Weekends (Sat-Sun): 10:00 AM - 4:00 PM
 */
export const isLateArrival = (date: Date, timeStr: string): boolean => {
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
