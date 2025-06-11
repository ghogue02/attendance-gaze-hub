
/**
 * "Class day" = every calendar day **except** Friday before May 15, then Thursday + Friday after May 15, plus listed holidays/cancellations.
 * Works in UTC so cron jobs & dashboards agree.
 */
import { supabase } from '@/integrations/supabase/client';

// Define permanent holidays - dates when we never have class (annual events)
const HOLIDAYS = new Set([
  '2025-04-20', // Easter Sunday
]);

// Cache for cancelled days fetched from Supabase
let cancelledDaysCache: Set<string> | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches cancelled class days from Supabase and updates the cache
 * @returns Promise<Set<string>> A set of dates in ISO format
 */
export const fetchCancelledDays = async (): Promise<Set<string>> => {
  try {
    const { data, error } = await supabase
      .from('cancelled_days')
      .select('date')
      .order('date');
    
    if (error) {
      console.error('Error fetching cancelled days:', error);
      // Return empty set on error, or cached data if available
      return cancelledDaysCache || new Set();
    }
    
    const cancelledSet = new Set<string>(
      data.map(item => item.date)
    );
    
    // Update cache
    cancelledDaysCache = cancelledSet;
    lastCacheTime = Date.now();
    
    return cancelledSet;
  } catch (err) {
    console.error('Error fetching cancelled days:', err);
    return cancelledDaysCache || new Set();
  }
};

/**
 * Gets cancelled days from cache or fetches them from Supabase
 * @returns Promise<Set<string>> A set of dates in ISO format
 */
export const getCancelledDays = async (): Promise<Set<string>> => {
  // Check if we have valid cache
  if (cancelledDaysCache && (Date.now() - lastCacheTime < CACHE_TTL)) {
    return cancelledDaysCache;
  }
  
  // Otherwise fetch fresh data
  return await fetchCancelledDays();
};

/**
 * Export a read-only version of the cached cancelled days
 * This is a backward compatibility mechanism for synchronous code
 * that depended on the old CANCELLED_CLASSES set
 */
export const CANCELLED_CLASSES = new Set<string>();

// Initialize from localStorage for backward compatibility
// This will be quickly replaced by DB data, but prevents flickering
if (typeof window !== 'undefined') {
  try {
    const storedDays = localStorage.getItem('cancelledDays');
    if (storedDays) {
      const days = JSON.parse(storedDays);
      days.forEach((day: string) => CANCELLED_CLASSES.add(day));
    }
  } catch (e) {
    console.error('Error parsing cancelled days from localStorage:', e);
  }
}

// Immediately fetch data for first load
getCancelledDays().then(days => {
  // Update the exported set for backward compatibility
  CANCELLED_CLASSES.clear();
  days.forEach(day => CANCELLED_CLASSES.add(day));
}).catch(err => {
  console.error('Initial fetch of cancelled days failed:', err);
});

/**
 * Determines if a given date is a class day based on schedule changes
 * 
 * Schedule rules:
 * - Before May 15, 2025: exclude Fridays only
 * - After May 15, 2025: exclude Thursdays and Fridays
 * - Always exclude permanent holidays and one-off cancellations
 */
export const isClassDay = async (isoDate: string): Promise<boolean> => {
  // Check permanent holidays first
  if (HOLIDAYS.has(isoDate)) return false;
  
  // Check one-off cancellations
  const cancelledDays = await getCancelledDays();
  if (cancelledDays.has(isoDate)) return false;
  
  // Check day of week based on schedule transition
  const dow = new Date(isoDate + 'T00:00:00Z').getUTCDay();   // 0-Sun … 6-Sat
  const scheduleTransitionDate = '2025-05-15';
  
  if (isoDate <= scheduleTransitionDate) {
    // Before/on May 15, 2025: exclude Fridays (5) only
    return dow !== 5;
  } else {
    // After May 15, 2025: exclude Thursdays (4) and Fridays (5)
    return dow !== 4 && dow !== 5;
  }
};

/**
 * Synchronous version of isClassDay - uses cached data
 * For backward compatibility with code that can't easily be updated to async
 * Will be slightly less accurate until cache refreshes
 */
export const isClassDaySync = (isoDate: string): boolean => {
  // Check permanent holidays first
  if (HOLIDAYS.has(isoDate)) return false;
  
  // Check one-off cancellations using cached data
  if (CANCELLED_CLASSES.has(isoDate)) return false;
  
  // Check day of week based on schedule transition
  const dow = new Date(isoDate + 'T00:00:00Z').getUTCDay();   // 0-Sun … 6-Sat
  const scheduleTransitionDate = '2025-05-15';
  
  if (isoDate <= scheduleTransitionDate) {
    // Before/on May 15, 2025: exclude Fridays (5) only
    return dow !== 5;
  } else {
    // After May 15, 2025: exclude Thursdays (4) and Fridays (5)
    return dow !== 4 && dow !== 5;
  }
};

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use isClassDay instead
 */
export const isAttendanceDay = isClassDaySync;

/**
 * Determines if a given date is a cancelled class day 
 * (would normally be a class day, but was cancelled as a one-off)
 */
export const isCancelledClassDay = async (isoDate: string): Promise<boolean> => {
  // First check if it would normally be a class day (not excluded by schedule or permanent holiday)
  const dow = new Date(isoDate + 'T00:00:00Z').getUTCDay();
  const scheduleTransitionDate = '2025-05-15';
  
  let wouldBeClassDay: boolean;
  if (isoDate <= scheduleTransitionDate) {
    // Before/on May 15: would be class day if not Friday
    wouldBeClassDay = (dow !== 5 && !HOLIDAYS.has(isoDate));
  } else {
    // After May 15: would be class day if not Thursday or Friday
    wouldBeClassDay = (dow !== 4 && dow !== 5 && !HOLIDAYS.has(isoDate));
  }
  
  // Then check if it's in the cancelled set
  const cancelledDays = await getCancelledDays();
  return wouldBeClassDay && cancelledDays.has(isoDate);
};

/**
 * Synchronous version of isCancelledClassDay for backward compatibility
 */
export const isCancelledClassDaySync = (isoDate: string): boolean => {
  // First check if it would normally be a class day (not excluded by schedule or permanent holiday)
  const dow = new Date(isoDate + 'T00:00:00Z').getUTCDay();
  const scheduleTransitionDate = '2025-05-15';
  
  let wouldBeClassDay: boolean;
  if (isoDate <= scheduleTransitionDate) {
    // Before/on May 15: would be class day if not Friday
    wouldBeClassDay = (dow !== 5 && !HOLIDAYS.has(isoDate));
  } else {
    // After May 15: would be class day if not Thursday or Friday
    wouldBeClassDay = (dow !== 4 && dow !== 5 && !HOLIDAYS.has(isoDate));
  }
  
  // Then check if it's in the cancelled set using cached data
  return wouldBeClassDay && CANCELLED_CLASSES.has(isoDate);
};

/**
 * Checks if a date is a permanent holiday (never a class day)
 */
export const isHoliday = (isoDate: string): boolean => {
  return HOLIDAYS.has(isoDate);
};
