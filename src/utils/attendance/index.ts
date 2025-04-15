
import { markAttendance as markAttendanceCore } from './markAttendance';
import { clearAttendanceCache } from './attendanceData';
import { cachedFetch } from './cacheManager';

/**
 * Re-export core functions with enhanced caching
 */
export const markAttendance = markAttendanceCore;

/**
 * Re-export other functions
 */
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
