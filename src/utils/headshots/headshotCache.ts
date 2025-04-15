
/**
 * Utility functions for handling headshot caching
 */

export interface HeadshotData {
  name: string;
  url: string;
  base64Data?: string;
}

// Cache keys and TTL values
const CACHE_KEY = 'headshots_carousel_data_v2';
const CACHE_TTL = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

/**
 * Retrieves cached headshot data from local storage
 */
export const getCachedHeadshots = (): { data: HeadshotData[], timestamp: number } | null => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (!cachedData) return null;
    
    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Error reading headshots cache:', error);
    return null;
  }
};

/**
 * Saves headshot data to local storage cache
 */
export const setCachedHeadshots = (data: HeadshotData[]): void => {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('Error setting headshots cache:', error);
  }
};

/**
 * Checks if cached headshot data is valid
 */
export const isHeadshotCacheValid = (): boolean => {
  const cache = getCachedHeadshots();
  return !!(
    cache &&
    cache.data.length > 0 &&
    cache.data[0].base64Data &&
    Date.now() - cache.timestamp < CACHE_TTL
  );
};

/**
 * Fetches an image from a URL and converts it to a base64 string
 */
export const fetchImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return '';
  }
};

/**
 * Clears the headshot cache
 */
export const clearHeadshotCache = (): void => {
  localStorage.removeItem(CACHE_KEY);
};
