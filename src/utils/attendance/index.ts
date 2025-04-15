
import { markAttendance as markAttendanceCore } from './markAttendance';
import { getAllBuilders, clearAttendanceCache } from './attendanceData';
import { cachedFetch } from './cacheManager';

/**
 * Re-export core functions with enhanced caching
 */
export const markAttendance = markAttendanceCore;

/**
 * Enhanced version of getAllBuilders with advanced caching
 */
export const getAllBuilders = (targetDateString: string) => {
  // Use a consistent cache key format
  const cacheKey = `builders_${targetDateString}`;
  
  // Use the cached fetch utility with a 10-minute TTL
  return cachedFetch(
    cacheKey,
    () => getAllBuilders(targetDateString),
    10 * 60 * 1000 // 10 minute cache
  );
};

// Re-export other functions
export { clearAttendanceCache };

/**
 * Clear attendance cache and update the UI
 */
export const clearAndRefreshAttendance = (date?: string) => {
  clearAttendanceCache(date);
  
  // Return next steps message
  return {
    success: true,
    message: 'Cache cleared successfully'
  };
};
