
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { getCurrentDateString, getDisplayDateString, logDateDebugInfo } from '@/utils/date/dateUtils';
import { useAttendanceSubscriptions } from './useAttendanceSubscriptions';
import { useBuilderFilters } from './useBuilderFilters';
import { useAttendanceOperations } from './useAttendanceOperations';
import { getAllBuilders, clearAttendanceCache } from '@/utils/faceRecognition/attendance';
import { throttledRequest } from '@/utils/request/throttle';

export const useDashboardData = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  
  // Get the current date strings
  const currentDate = useMemo(() => getCurrentDateString(), []);
  const targetDateString = currentDate;
  const displayDateString = useMemo(() => getDisplayDateString(), []);

  // Debug log the current date
  logDateDebugInfo('useDashboardData', targetDateString);

  // Function to load/refresh data for the target date
  const loadData = useCallback(async (showLoadingSpinner = true) => {
    if (!isMounted.current) return;
    
    console.log(`[useDashboardData] Executing loadData for date ${targetDateString} (showLoading: ${showLoadingSpinner})...`);
    
    if (showLoadingSpinner) setIsLoading(true);
    
    try {
      // Use throttled request to avoid multiple identical requests
      const data = await throttledRequest(
        `builders_${targetDateString}`,
        () => getAllBuilders(targetDateString),
        60000 // 1 minute cache
      );
      
      if (isMounted.current) {
        setBuilders(data);
        console.log(`[useDashboardData] setBuilders called with ${data.length} builders for ${targetDateString}.`);
        console.log(`[useDashboardData] Present count: ${data.filter(b => b.status === 'present').length}`);
        console.log(`[useDashboardData] Absent count: ${data.filter(b => b.status === 'absent').length}`);
        console.log(`[useDashboardData] Pending count: ${data.filter(b => b.status === 'pending').length}`);
      }
    } catch (error) {
      console.error('[useDashboardData] Error during loadData:', error);
      if (isMounted.current) setBuilders([]);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [targetDateString]);

  // Set up Supabase subscriptions - with callback that invalidates cache
  useAttendanceSubscriptions({
    targetDateString,
    onDataChange: () => {
      console.log('[useDashboardData] Data change detected, invalidating cache');
      // Clear cache for target date
      clearAttendanceCache(targetDateString);
      // Reload in background without spinner
      loadData(false);
    }
  });

  // Effect for initial load
  useEffect(() => {
    isMounted.current = true;
    console.log('[useDashboardData] Component mounted. Initial load starting.');
    loadData(); // Initial load for the target date
    
    // Set up auto-refresh interval (every 5 minutes)
    const refreshInterval = setInterval(() => {
      console.log('[useDashboardData] Auto-refresh triggered.');
      // Clear cache for current date on auto-refresh
      clearAttendanceCache(targetDateString);
      loadData(false); // Don't show loading spinner for auto refresh
    }, 300000); // 5 minutes

    return () => {
      isMounted.current = false;
      clearInterval(refreshInterval);
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
    console.log('[useDashboardData] Manual refresh triggered.');
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
