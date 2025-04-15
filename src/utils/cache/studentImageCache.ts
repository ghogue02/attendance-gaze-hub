
/**
 * Global student image cache utility
 */

// Cache storage with TTL tracking
const imageCache = new Map<string, {url: string, timestamp: number}>();
const CACHE_TTL = 45 * 60 * 1000; // 45 minute cache TTL

/**
 * Get a student image from cache
 * @param userId The student ID
 * @returns The cached image URL or null if not in cache or expired
 */
export const getCachedStudentImage = (userId: string): string | null => {
  const cached = imageCache.get(userId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.url;
  }
  return null;
};

/**
 * Store a student image in cache
 * @param userId The student ID
 * @param imageUrl The image URL to cache
 */
export const cacheStudentImage = (userId: string, imageUrl: string): void => {
  imageCache.set(userId, {
    url: imageUrl,
    timestamp: Date.now()
  });
};

/**
 * Clear the student image cache
 * @param userId Optional student ID to clear specific cache entry
 */
export const clearStudentImageCache = (userId?: string): void => {
  if (userId) {
    imageCache.delete(userId);
  } else {
    imageCache.clear();
  }
};

/**
 * Get cache statistics
 * @returns Object with cache statistics
 */
export const getStudentImageCacheStats = (): { size: number, avgAge: number } => {
  const now = Date.now();
  let totalAge = 0;
  
  imageCache.forEach(item => {
    totalAge += (now - item.timestamp);
  });
  
  const size = imageCache.size;
  const avgAge = size > 0 ? totalAge / size / 1000 : 0; // in seconds
  
  return { size, avgAge };
};
