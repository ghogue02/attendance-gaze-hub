
/**
 * A simple client-side cache manager for attendance data
 * Enhanced with longer TTL and storage efficiency
 */

// Extended to 15 minutes (was lower before)
const DEFAULT_TTL = 15 * 60 * 1000;

// Cache for general data
const dataCache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// In-flight request tracker
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Store data in the cache with an optional TTL
 */
export const setCachedData = <T>(key: string, data: T, ttl: number = DEFAULT_TTL): void => {
  dataCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

/**
 * Get data from the cache if it exists and hasn't expired
 */
export const getCachedData = <T>(key: string): T | null => {
  const cachedItem = dataCache.get(key);
  
  if (!cachedItem) {
    return null;
  }
  
  const now = Date.now();
  if (now - cachedItem.timestamp > cachedItem.ttl) {
    // Data has expired, remove it
    dataCache.delete(key);
    return null;
  }
  
  return cachedItem.data as T;
};

/**
 * Clear a specific item from the cache
 */
export const clearCachedData = (key: string): void => {
  dataCache.delete(key);
};

/**
 * Clear all cached data
 */
export const clearAllCachedData = (): void => {
  dataCache.clear();
};

/**
 * Register an in-flight request to prevent duplicate API calls
 */
export const registerPendingRequest = <T>(key: string, promise: Promise<T>): Promise<T> => {
  pendingRequests.set(key, promise);
  
  // Auto-cleanup when the promise resolves or rejects
  promise.finally(() => {
    if (pendingRequests.get(key) === promise) {
      pendingRequests.delete(key);
    }
  });
  
  return promise;
};

/**
 * Check if a request is already in flight
 */
export const getPendingRequest = <T>(key: string): Promise<T> | undefined => {
  return pendingRequests.get(key) as Promise<T> | undefined;
};

/**
 * Cache-first data fetcher that prevents duplicate API calls
 * @param cacheKey - Key to use for caching
 * @param fetchFunction - Function that returns a Promise with the data
 * @param ttl - Time to live in milliseconds
 */
export const cachedFetch = async <T>(
  cacheKey: string, 
  fetchFunction: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> => {
  // First check cache
  const cachedData = getCachedData<T>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Then check for pending requests
  const pendingRequest = getPendingRequest<T>(cacheKey);
  if (pendingRequest) {
    return pendingRequest;
  }
  
  // If not cached or pending, make a new request
  const promise = fetchFunction().then(result => {
    setCachedData(cacheKey, result, ttl);
    return result;
  });
  
  // Register this promise to prevent duplicate calls
  return registerPendingRequest(cacheKey, promise);
};

// Periodically clean up expired cache entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  
  for (const [key, item] of dataCache.entries()) {
    if (now - item.timestamp > item.ttl) {
      dataCache.delete(key);
    }
  }
}, 60000); // Run every minute
