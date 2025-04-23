
import { Builder } from '@/components/builder/types';

// Create a global singleton cache to prevent duplicate storage
declare global {
  interface Window {
    __attendanceCache?: {
      byDate: Map<string, Builder[]>;
      timestamp: number;
      ttl: number;
    };
  }
}

// Initialize global cache if not exists
if (typeof window !== 'undefined' && !window.__attendanceCache) {
  window.__attendanceCache = {
    byDate: new Map<string, Builder[]>(),
    timestamp: 0,
    ttl: 60000 * 3 // 3 minutes cache TTL (reduced from 5)
  };
}

// Shared in-flight requests tracker to prevent duplicate API calls
const inFlightRequests = new Map<string, Promise<Builder[]>>();

export const getInFlightRequest = (date: string) => inFlightRequests.get(date);
export const setInFlightRequest = (date: string, promise: Promise<Builder[]>) => {
  inFlightRequests.set(date, promise);
  return promise;
};
export const removeInFlightRequest = (date: string) => inFlightRequests.delete(date);

export const getCachedData = (date: string) => {
  const cache = window.__attendanceCache;
  return cache?.byDate.get(date);
};

export const setCachedData = (date: string, data: Builder[]) => {
  const cache = window.__attendanceCache;
  if (cache) {
    cache.byDate.set(date, [...data]); // Store a copy
    cache.timestamp = Date.now();
  }
};

export const isCacheValid = () => {
  const cache = window.__attendanceCache;
  const now = Date.now();
  return cache && (now - cache.timestamp < cache.ttl);
};

export const clearCache = (date?: string) => {
  if (!window.__attendanceCache) return;
  
  if (date) {
    window.__attendanceCache.byDate.delete(date);
    console.log(`Cleared cache for date: ${date}`);
  } else {
    window.__attendanceCache.byDate.clear();
    window.__attendanceCache.timestamp = 0;
    console.log('Cleared entire attendance cache');
  }
};
