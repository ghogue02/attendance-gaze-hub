
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { getCurrentDateString, getDisplayDateString, logDateDebugInfo, isOvernightHours } from '@/utils/date/dateUtils';
import { useAttendanceSubscriptions } from './useAttendanceSubscriptions';
import { useBuilderFilters } from './useBuilderFilters';
import { useAttendanceOperations } from './useAttendanceOperations';
import { getAllBuilders, clearAttendanceCache } from '@/utils/faceRecognition/attendance';
import { throttledRequest } from '@/utils/request/throttle';
import { preloadStudentImages } from '@/utils/cache/studentImageCache';
import { appVisibility } from '@/utils/visibility/appVisibility';

export const useDashboardData = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const isInitialLoad = useRef(true);
  const lastRefreshTime = useRef<number>(Date.now());
  const [isAppVisible, setIsAppVisible] = useState(true);
  
  // Get the current date strings
  const currentDate = useMemo(() => getCurrentDateString(), []);
  const targetDateString = currentDate;
  const displayDateString = useMemo(() => getDisplayDateString(), []);

  // Debug log the current date only once
  useEffect(() => {
    if (isInitialLoad.current) {
      logDateDebugInfo('useDashboardData', targetDateString);
      isInitialLoad.current = false;
    }
  }, [targetDateString]);

  // Subscribe to app visibility changes
  useEffect(() => {
    return appVisibility.subscribe((visible) => {
      setIsAppVisible(visible);
      
      // If becoming visible and it's been a while since last refresh, trigger a refresh
      if (visible && Date.now() - lastRefreshTime.current > 60000) {
        console.log('[useDashboardData] App became visible, refreshing data');
        loadData(false);
      }
    });
  }, []);

  // Function to load/refresh data for the target date
  const loadData = useCallback(async (showLoadingSpinner = true) => {
    if (!isMounted.current) return;
    
    // In overnight hours with app not visible, skip refreshes unless forced
    if (!showLoadingSpinner && isOvernightHours() && !isAppVisible) {
      console.log('[useDashboardData] Skipping background refresh during overnight hours');
      return;
    }
    
    if (showLoadingSpinner) setIsLoading(true);
    
    try {
      // Use throttled request to avoid multiple identical requests
      const data = await throttledRequest(
        `builders_${targetDateString}`,
        () => getAllBuilders(targetDateString),
        isOvernightHours() ? 3600000 : 60000 // 1 hour cache during overnight, otherwise 1 minute
      );
      
      if (isMounted.current) {
        setBuilders(data);
        
        // Only preload images when app is visible to save bandwidth
        if (isAppVisible) {
          // Preload user image data in batches to avoid individual requests
          const userImageData = data.map(builder => ({
            userId: builder.id,
            imageUrl: builder.image || '' // Use existing image if available
          }));
          
          // Preload student images from the batch
          preloadStudentImages(userImageData);
        }
      }
    } catch (error) {
      console.error('[useDashboardData] Error during loadData:', error);
      if (isMounted.current) setBuilders([]);
    } finally {
      if (isMounted.current) setIsLoading(false);
      lastRefreshTime.current = Date.now();
    }
  }, [targetDateString, isAppVisible]);

  // Set up Supabase subscriptions - with callback that invalidates cache
  useAttendanceSubscriptions({
    targetDateString,
    onDataChange: () => {
      // Clear cache for target date
      clearAttendanceCache(targetDateString);
      // Reload in background without spinner
      loadData(false);
    }
  });

  // Effect for initial load
  useEffect(() => {
    isMounted.current = true;
    loadData(); // Initial load for the target date
    
    // Set up auto-refresh interval but with increasing intervals for overnight
    const setupRefreshInterval = () => {
      return setInterval(() => {
        // Skip refreshes when the app is not visible, especially during overnight hours
        if (!isAppVisible && isOvernightHours()) {
          console.log('[useDashboardData] Skipping auto-refresh - app not visible during overnight hours');
          return;
        }
        
        // Use a longer refresh interval during overnight hours (1 hour)
        if (isOvernightHours()) {
          console.log('[useDashboardData] Using extended refresh interval (overnight hours)');
        }
        
        // Clear cache for current date on auto-refresh
        clearAttendanceCache(targetDateString);
        loadData(false); // Don't show loading spinner for auto refresh
      }, isOvernightHours() ? 3600000 : 300000); // 1 hour during overnight, 5 minutes otherwise
    };
    
    let refreshInterval = setupRefreshInterval();
    
    // Update the interval based on time of day changes
    const timeCheckInterval = setInterval(() => {
      clearInterval(refreshInterval);
      refreshInterval = setupRefreshInterval();
    }, 600000); // Check every 10 minutes if we need to adjust the interval

    return () => {
      isMounted.current = false;
      clearInterval(refreshInterval);
      clearInterval(timeCheckInterval);
    };
  }, [loadData, targetDateString]);

  // Use the filtering hook
  const {
    filteredBuilders,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    handleClearFilters
  } = useBuilderFilters({ builders });

  // Use attendance operations hook
  const { handleMarkAttendance } = useAttendanceOperations({
    builders,
    targetDateString,
    onAttendanceMarked: () => {
      // Clear cache on attendance change
      clearAttendanceCache(targetDateString);
      loadData(false);
    }
  });

  // Function for manual refresh button
  const refreshData = useCallback(() => {
    // Clear cache on manual refresh
    clearAttendanceCache(targetDateString);
    loadData(true);
  }, [loadData, targetDateString]);

  // Return state and handlers
  return {
    builders,
    filteredBuilders,
    isLoading,
    searchQuery,
    statusFilter,
    selectedDate: displayDateString, // Use the formatted display date
    setSearchQuery,
    setStatusFilter,
    handleMarkAttendance,
    handleClearFilters,
    refreshData
  };
};
