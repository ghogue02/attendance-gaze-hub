/**
 * Enhanced global student image cache utility with better loading patterns and error handling
 */

// Cache storage with TTL tracking and error state
type CacheEntry = {
  url: string;
  timestamp: number;
  errorCount?: number;
  lastErrorTime?: number;
};

// In-memory cache implementation
const imageCache = new Map<string, CacheEntry>();

// Configuration
const CACHE_CONFIG = {
  TTL: 45 * 60 * 1000, // 45 minute cache TTL
  ERROR_COOLDOWN: 5 * 60 * 1000, // 5 minute cooldown after errors
  MAX_ERROR_COUNT: 3, // Maximum consecutive errors before longer cooldown
  EXTENDED_ERROR_COOLDOWN: 30 * 60 * 1000, // 30 minute cooldown after max errors
  BATCH_SIZE: 10, // Maximum number of images to fetch in one batch
};

/**
 * Get a student image from cache
 * @param userId The student ID
 * @returns The cached image URL or null if not in cache, expired, or in error cooldown
 */
export const getCachedStudentImage = (userId: string): string | null => {
  if (!userId) return null;

  const cached = imageCache.get(userId);
  if (!cached) return null;

  const now = Date.now();
  
  // Check if entry is still valid
  if (now - cached.timestamp < CACHE_CONFIG.TTL) {
    return cached.url;
  }
  
  // Entry expired, remove it from cache
  imageCache.delete(userId);
  return null;
};

/**
 * Store a student image in cache
 * @param userId The student ID
 * @param imageUrl The image URL to cache
 */
export const cacheStudentImage = (userId: string, imageUrl: string): void => {
  if (!userId || !imageUrl) return;
  
  imageCache.set(userId, {
    url: imageUrl,
    timestamp: Date.now()
  });
};

/**
 * Mark a student image as having an error
 * @param userId The student ID
 */
export const markStudentImageError = (userId: string): void => {
  if (!userId) return;
  
  const cached = imageCache.get(userId);
  const now = Date.now();
  
  if (cached) {
    // Increment error count
    const errorCount = (cached.errorCount || 0) + 1;
    imageCache.set(userId, {
      ...cached,
      errorCount,
      lastErrorTime: now
    });
  } else {
    // Create new cache entry with error
    imageCache.set(userId, {
      url: '',
      timestamp: now - CACHE_CONFIG.TTL - 1, // Ensure it's expired
      errorCount: 1,
      lastErrorTime: now
    });
  }
};

/**
 * Check if a student image is in error cooldown
 * @param userId The student ID
 * @returns True if the image is in error cooldown
 */
export const isStudentImageInErrorCooldown = (userId: string): boolean => {
  if (!userId) return false;
  
  const cached = imageCache.get(userId);
  if (!cached || !cached.lastErrorTime || !cached.errorCount) return false;
  
  const now = Date.now();
  const cooldownTime = cached.errorCount >= CACHE_CONFIG.MAX_ERROR_COUNT
    ? CACHE_CONFIG.EXTENDED_ERROR_COOLDOWN
    : CACHE_CONFIG.ERROR_COOLDOWN;
    
  return (now - cached.lastErrorTime) < cooldownTime;
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
 * @returns Object with detailed cache statistics
 */
export const getStudentImageCacheStats = (): { 
  size: number; 
  avgAge: number;
  errorCount: number;
  validEntries: number;
} => {
  const now = Date.now();
  let totalAge = 0;
  let errorCount = 0;
  let validCount = 0;
  
  imageCache.forEach(item => {
    totalAge += (now - item.timestamp);
    if (item.errorCount && item.errorCount > 0) {
      errorCount++;
    }
    if (now - item.timestamp < CACHE_CONFIG.TTL) {
      validCount++;
    }
  });
  
  const size = imageCache.size;
  const avgAge = size > 0 ? totalAge / size / 1000 : 0; // in seconds
  
  return { 
    size, 
    avgAge, 
    errorCount, 
    validEntries: validCount 
  };
};

/**
 * Batch process an array of user IDs for caching optimization
 * @param userIds Array of user IDs to process
 * @returns Array of user IDs that need images (not cached or expired)
 */
export const getUncachedUserIds = (userIds: string[]): string[] => {
  if (!userIds || !userIds.length) return [];
  
  // Filter to only include IDs that aren't cached or are expired
  return userIds.filter(id => {
    if (!id) return false;
    
    // Skip IDs in error cooldown
    if (isStudentImageInErrorCooldown(id)) return false;
    
    // Return true if not cached or expired
    return !getCachedStudentImage(id);
  });
};

/**
 * Get the optimal batch size for fetching images
 */
export const getOptimalBatchSize = (): number => {
  return CACHE_CONFIG.BATCH_SIZE;
};

/**
 * Reset error state for a student image
 * @param userId The student ID
 */
export const resetStudentImageErrorState = (userId: string): void => {
  if (!userId) return;
  
  const cached = imageCache.get(userId);
  if (cached) {
    // Reset error state but keep the URL and timestamp
    imageCache.set(userId, {
      url: cached.url,
      timestamp: cached.timestamp
    });
  }
};

/**
 * Preload images for a list of users
 * This is useful for improving perceived performance
 * @param userDataList Array of objects containing userId and imageUrl
 */
export const preloadStudentImages = (
  userDataList: Array<{userId: string, imageUrl: string}>
): void => {
  if (!userDataList || !userDataList.length) return;
  
  // Add all provided images to cache
  userDataList.forEach(({userId, imageUrl}) => {
    if (userId && imageUrl && !getCachedStudentImage(userId)) {
      cacheStudentImage(userId, imageUrl);
    }
  });
};
