
/**
 * Utility for managing cache to reduce API calls
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

// Global cache object
const cache: Record<string, CacheEntry<any>> = {};

/**
 * Get cached data if it's not expired
 * @param key Cache key
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 * @returns The cached data or null if not found or expired
 */
export function getCachedData<T>(key: string, ttl = 5 * 60 * 1000): T | null {
  const entry = cache[key];
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > ttl) {
    // Cache expired
    delete cache[key];
    return null;
  }

  return entry.data;
}

/**
 * Set data in cache with TTL
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 */
export function setCachedData<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
  cache[key] = {
    data,
    timestamp: Date.now(),
  };
  
  // Set automatic cleanup after TTL
  setTimeout(() => {
    const entry = cache[key];
    if (entry && entry.timestamp === cache[key].timestamp) {
      delete cache[key];
    }
  }, ttl);
}

/**
 * Clear a specific cache entry or all cache
 * @param key Optional cache key to clear specific entry
 */
export function clearCachedData(key?: string): void {
  if (key) {
    delete cache[key];
  } else {
    // Clear all cache
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
}

/**
 * Cached fetch utility - performs a fetch operation with caching
 * @param cacheKey The key to store the result under
 * @param fetchFn Function that returns a promise with the data
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 * @returns The data from fetch operation or cache
 */
export async function cachedFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl = 5 * 60 * 1000
): Promise<T> {
  // Check if we have valid cached data
  const cachedData = getCachedData<T>(cacheKey, ttl);
  if (cachedData !== null) {
    console.log(`[cachedFetch] Cache hit for key: ${cacheKey}`);
    return cachedData;
  }

  console.log(`[cachedFetch] Cache miss for key: ${cacheKey}, fetching fresh data`);
  
  // No cache hit, execute the fetch function
  const data = await fetchFn();
  
  // Store in cache
  setCachedData(cacheKey, data, ttl);
  
  return data;
}
