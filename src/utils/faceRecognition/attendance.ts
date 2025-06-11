
import { Builder } from '@/components/builder/types';
import { 
  getCachedData, 
  setCachedData, 
  isCacheValid, 
  getInFlightRequest,
  setInFlightRequest,
  removeInFlightRequest,
} from './cache/attendanceCache';
import { fetchBuildersWithAttendance } from './data/builderService';

export { clearCache as clearAttendanceCache } from './cache/attendanceCache';

/**
 * Gets all builders (students) with their merged attendance status for a specific date.
 * Optimized to reduce database calls with caching and batched queries.
 */
export const getAllBuilders = async (targetDateString: string, cohort?: string): Promise<Builder[]> => {
  try {
    // Create cache key that includes cohort
    const cacheKey = cohort ? `${targetDateString}_${cohort}` : targetDateString;
    
    // Check for in-flight requests first
    const existingRequest = getInFlightRequest(cacheKey);
    if (existingRequest) {
      return existingRequest;
    }

    // Check cache next if it's still valid
    if (isCacheValid()) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return [...cachedData]; // Return a copy to prevent mutation of cache
      }
    }

    // Create a new request promise
    const promise = fetchBuildersWithAttendance(targetDateString, cohort);
    
    // Store the promise and handle cleanup
    setInFlightRequest(cacheKey, promise);
    
    const builders = await promise;
    
    // Update cache with the result
    setCachedData(cacheKey, builders);
    
    // Clean up in-flight request
    removeInFlightRequest(cacheKey);

    return builders;
  } catch (error) {
    console.error('Error in getAllBuilders:', error);
    removeInFlightRequest(targetDateString);
    return [];
  }
};
