
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
export const getAllBuilders = async (targetDateString: string): Promise<Builder[]> => {
  try {
    // Check for in-flight requests first
    const existingRequest = getInFlightRequest(targetDateString);
    if (existingRequest) {
      return existingRequest;
    }

    // Check cache next if it's still valid
    if (isCacheValid()) {
      const cachedData = getCachedData(targetDateString);
      if (cachedData) {
        return [...cachedData]; // Return a copy to prevent mutation of cache
      }
    }

    // Create a new request promise
    const promise = fetchBuildersWithAttendance(targetDateString);
    
    // Store the promise and handle cleanup
    setInFlightRequest(targetDateString, promise);
    
    const builders = await promise;
    
    // Update cache with the result
    setCachedData(targetDateString, builders);
    
    // Clean up in-flight request
    removeInFlightRequest(targetDateString);

    return builders;
  } catch (error) {
    console.error('Error in getAllBuilders:', error);
    removeInFlightRequest(targetDateString);
    return [];
  }
};
