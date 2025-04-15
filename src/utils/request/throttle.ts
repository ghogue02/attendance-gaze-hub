
/**
 * Utility for throttling and batching REST requests
 */

// Queue for storing pending requests
type RequestQueue<T> = {
  resolver: (value: T) => void;
  key: string;
}[];

// Cache for storing responses
const responseCache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// Default TTL for cached responses (15 seconds)
const DEFAULT_TTL = 15 * 1000;

/**
 * A utility for batching and throttling REST requests
 * @param key The unique key to identify this request
 * @param fetchFn The function that performs the actual fetch operation
 * @param ttl Time to live for cached results in milliseconds
 */
export async function throttledRequest<T>(
  key: string, 
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Check if we have a cached response that is still valid
  const cached = responseCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.data as T;
  }

  // Track in-flight requests to avoid duplicates
  const inFlightRequests = new Map<string, Promise<T>>();

  // If there's already an in-flight request for this key, return that promise
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  // Create a new promise for this request
  const requestPromise = new Promise<T>(async (resolve) => {
    try {
      // Execute the fetch function
      const result = await fetchFn();
      
      // Cache the result
      responseCache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl
      });

      resolve(result);
    } catch (error) {
      console.error(`Error in throttled request for key "${key}":`, error);
      throw error;
    } finally {
      // Remove from in-flight requests
      inFlightRequests.delete(key);
    }
  });

  // Store the promise in the in-flight requests map
  inFlightRequests.set(key, requestPromise);

  return requestPromise;
}

/**
 * Clear all cached responses or a specific one
 * @param key Optional key to clear only that specific cache entry
 */
export function clearRequestCache(key?: string): void {
  if (key) {
    responseCache.delete(key);
  } else {
    responseCache.clear();
  }
}
