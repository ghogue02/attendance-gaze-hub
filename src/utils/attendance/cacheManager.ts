
/**
 * Attendance Cache Manager
 * 
 * This utility provides centralized management of attendance data caching
 * to reduce database requests and improve application performance.
 */

// Global cache storage
const cache = {
  // Data storage by type and key
  data: new Map<string, Map<string, any>>(),
  
  // Cache entry timestamps
  timestamps: new Map<string, Map<string, number>>(),
  
  // Default TTL values by cache type (in milliseconds)
  ttl: {
    attendance: 5 * 60 * 1000,       // 5 minutes
    builders: 10 * 60 * 1000,        // 10 minutes
    history: 15 * 60 * 1000,         // 15 minutes
    statistics: 20 * 60 * 1000,      // 20 minutes
  }
};

// Initialize cache storage for different data types
['attendance', 'builders', 'history', 'statistics'].forEach(type => {
  if (!cache.data.has(type)) {
    cache.data.set(type, new Map());
    cache.timestamps.set(type, new Map());
  }
});

/**
 * Get data from cache if available and not expired
 * @param type Cache type (attendance, builders, etc.)
 * @param key Cache key (usually a date or ID)
 * @returns Cached data or null if not found/expired
 */
export const getCachedData = <T>(type: string, key: string): T | null => {
  const typeCache = cache.data.get(type);
  const timestampCache = cache.timestamps.get(type);
  const ttl = cache.ttl[type as keyof typeof cache.ttl] || 5 * 60 * 1000; // Default 5 minutes
  
  if (!typeCache || !timestampCache) return null;
  
  const data = typeCache.get(key);
  const timestamp = timestampCache.get(key) || 0;
  
  if (data && Date.now() - timestamp < ttl) {
    console.log(`[CacheManager] Cache hit for ${type}:${key}`);
    return data as T;
  }
  
  console.log(`[CacheManager] Cache miss for ${type}:${key}`);
  return null;
};

/**
 * Store data in cache with specified TTL
 * @param type Cache type (attendance, builders, etc.) 
 * @param key Cache key (usually a date or ID)
 * @param data Data to cache
 * @param customTTL Optional custom TTL in milliseconds
 */
export const setCachedData = <T>(type: string, key: string, data: T, customTTL?: number): void => {
  let typeCache = cache.data.get(type);
  let timestampCache = cache.timestamps.get(type);
  
  // Initialize cache maps if not exists
  if (!typeCache) {
    typeCache = new Map();
    cache.data.set(type, typeCache);
  }
  
  if (!timestampCache) {
    timestampCache = new Map();
    cache.timestamps.set(type, timestampCache);
  }
  
  // Store data and timestamp
  typeCache.set(key, data);
  timestampCache.set(key, Date.now());
  
  console.log(`[CacheManager] Cached data for ${type}:${key}`);
  
  // If customTTL is provided, we can override the default TTL for this specific entry
  if (customTTL !== undefined) {
    const ttlObject = cache.ttl as Record<string, number>;
    ttlObject[`${type}:${key}`] = customTTL;
  }
};

/**
 * Clear cache entries by type and optional key
 * @param type Cache type to clear (attendance, builders, etc.)
 * @param key Optional specific key to clear
 */
export const clearCache = (type: string, key?: string): void => {
  const typeCache = cache.data.get(type);
  const timestampCache = cache.timestamps.get(type);
  
  if (!typeCache || !timestampCache) return;
  
  if (key) {
    // Clear specific key
    typeCache.delete(key);
    timestampCache.delete(key);
    console.log(`[CacheManager] Cleared ${type}:${key} from cache`);
  } else {
    // Clear all entries of this type
    typeCache.clear();
    timestampCache.clear();
    console.log(`[CacheManager] Cleared all ${type} cache entries`);
  }
};

/**
 * Clear all cache data
 */
export const clearAllCache = (): void => {
  cache.data.forEach((typeCache) => typeCache.clear());
  cache.timestamps.forEach((timestampCache) => timestampCache.clear());
  console.log('[CacheManager] Cleared all cache data');
};

/**
 * Get cache statistics
 * @returns Object with cache statistics
 */
export const getCacheStats = (): Record<string, { entries: number, avgAge: number }> => {
  const stats: Record<string, { entries: number, avgAge: number }> = {};
  const now = Date.now();
  
  cache.data.forEach((typeCache, type) => {
    const timestamps = cache.timestamps.get(type) || new Map();
    const ages: number[] = [];
    
    timestamps.forEach((timestamp) => {
      ages.push(now - timestamp);
    });
    
    const avgAge = ages.length > 0 ? 
      ages.reduce((sum, age) => sum + age, 0) / ages.length :
      0;
    
    stats[type] = {
      entries: typeCache.size,
      avgAge
    };
  });
  
  return stats;
};
