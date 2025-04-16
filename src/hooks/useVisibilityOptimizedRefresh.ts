
import { useEffect, useRef, useCallback, useState } from 'react';
import { appVisibility } from '@/utils/visibility/appVisibility';
import { isOvernightHours } from '@/utils/date/dateUtils';

interface UseVisibilityOptimizedRefreshOptions {
  refreshFunction: () => void | Promise<void>;
  normalInterval?: number;
  overnightInterval?: number;
  backgroundInterval?: number;
  skipWhenHidden?: boolean;
  executeImmediatelyOnVisible?: boolean;
  minimumTimeBetweenRefreshes?: number;
  enabled?: boolean;
}

/**
 * Hook that provides visibility-optimized refresh functionality
 * Automatically adjusts refresh intervals based on application state:
 * - Normal hours + tab visible: Normal interval (default: 5 minutes)
 * - Overnight hours + tab visible: Overnight interval (default: 1 hour)
 * - Tab not visible: Background interval or no refresh (default: 30 minutes)
 */
export const useVisibilityOptimizedRefresh = ({
  refreshFunction,
  normalInterval = 300000, // 5 minutes
  overnightInterval = 3600000, // 1 hour
  backgroundInterval = 1800000, // 30 minutes
  skipWhenHidden = true,
  executeImmediatelyOnVisible = true,
  minimumTimeBetweenRefreshes = 60000, // 1 minute
  enabled = true
}: UseVisibilityOptimizedRefreshOptions) => {
  const lastRefreshTime = useRef<number>(Date.now());
  const refreshIntervalId = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(appVisibility.getVisibility());
  
  // Clear any existing interval
  const clearCurrentInterval = useCallback(() => {
    if (refreshIntervalId.current !== null) {
      clearInterval(refreshIntervalId.current);
      refreshIntervalId.current = null;
    }
  }, []);
  
  // Set up a new interval with the appropriate timing
  const setupRefreshInterval = useCallback(() => {
    clearCurrentInterval();
    
    // If not enabled, don't set up any interval
    if (!enabled) return;
    
    // Determine the appropriate interval
    let interval = normalInterval;
    
    if (isOvernightHours()) {
      interval = overnightInterval;
    } else if (!isVisible && skipWhenHidden) {
      return; // Don't set up interval when hidden if skipWhenHidden is true
    } else if (!isVisible) {
      interval = backgroundInterval;
    }
    
    // Set up the new interval
    refreshIntervalId.current = window.setInterval(() => {
      const now = Date.now();
      
      // Skip if we've refreshed too recently
      if (now - lastRefreshTime.current < minimumTimeBetweenRefreshes) {
        return;
      }
      
      // Skip if app is hidden during overnight hours (reduced load)
      if (!isVisible && isOvernightHours()) {
        console.log('[useVisibilityOptimizedRefresh] Skipping refresh - app hidden during overnight hours');
        return;
      }
      
      // Execute the refresh function
      executeRefresh();
      
    }, interval) as unknown as number;
    
  }, [isVisible, enabled, normalInterval, overnightInterval, backgroundInterval, skipWhenHidden]);
  
  // Execute the refresh function and update last refresh time
  const executeRefresh = useCallback(async () => {
    try {
      await refreshFunction();
    } catch (error) {
      console.error('[useVisibilityOptimizedRefresh] Error executing refresh function:', error);
    } finally {
      lastRefreshTime.current = Date.now();
    }
  }, [refreshFunction]);
  
  // Force a refresh (for manual refresh buttons)
  const forceRefresh = useCallback(() => {
    executeRefresh();
    // Reset the interval after a manual refresh
    setupRefreshInterval();
  }, [executeRefresh, setupRefreshInterval]);
  
  // Set up visibility change handler
  useEffect(() => {
    const unsubscribe = appVisibility.subscribe((visible) => {
      setIsVisible(visible);
      
      // If becoming visible and it's been a while since last refresh, refresh immediately
      if (visible && executeImmediatelyOnVisible && enabled) {
        const now = Date.now();
        if (now - lastRefreshTime.current > minimumTimeBetweenRefreshes) {
          console.log('[useVisibilityOptimizedRefresh] App became visible, triggering refresh');
          executeRefresh();
        }
      }
      
      // Update interval when visibility changes
      setupRefreshInterval();
    });
    
    return () => {
      unsubscribe();
    };
  }, [executeImmediatelyOnVisible, minimumTimeBetweenRefreshes, setupRefreshInterval, executeRefresh, enabled]);
  
  // Set up initial interval
  useEffect(() => {
    setupRefreshInterval();
    
    // Clean up on unmount
    return () => {
      clearCurrentInterval();
    };
  }, [setupRefreshInterval, clearCurrentInterval]);
  
  // Set up interval adjustment based on time of day
  useEffect(() => {
    // Check every 10 minutes if we need to adjust the interval based on overnight status
    const timeCheckInterval = setInterval(() => {
      setupRefreshInterval();
    }, 600000);
    
    return () => {
      clearInterval(timeCheckInterval);
    };
  }, [setupRefreshInterval]);
  
  return { forceRefresh, isVisible };
};
