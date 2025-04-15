
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
const METADATA_CACHE_KEY = 'headshots_carousel_metadata';
const CACHE_TTL = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

/**
 * Retrieves cached headshot data from local storage
 */
export const getCachedHeadshots = (): { data: HeadshotData[], timestamp: number } | null => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedMetadata = localStorage.getItem(METADATA_CACHE_KEY);
    
    if (!cachedData || !cachedMetadata) return null;
    
    const metadata = JSON.parse(cachedMetadata);
    const headshots = JSON.parse(cachedData);
    
    return {
      data: headshots,
      timestamp: metadata.timestamp
    };
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
    // Store metadata separately
    const metadata = {
      timestamp: Date.now(),
      count: data.length
    };
    
    localStorage.setItem(METADATA_CACHE_KEY, JSON.stringify(metadata));
    
    // Store the headshots data without base64 to reduce storage usage
    const headshotsForStorage = data.map(item => ({
      name: item.name,
      url: item.url
    }));
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(headshotsForStorage));
    
    console.log(`Cached ${data.length} headshot references (without base64 data)`);
  } catch (error) {
    console.error('Error setting headshots cache:', error);
  }
};

/**
 * Checks if cached headshot data is valid
 */
export const isHeadshotCacheValid = (): boolean => {
  try {
    const cachedMetadata = localStorage.getItem(METADATA_CACHE_KEY);
    if (!cachedMetadata) return false;
    
    const metadata = JSON.parse(cachedMetadata);
    return Date.now() - metadata.timestamp < CACHE_TTL;
  } catch (error) {
    console.error('Error checking headshot cache validity:', error);
    return false;
  }
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
  localStorage.removeItem(METADATA_CACHE_KEY);
};
