
import { useState, useEffect, useCallback } from 'react';
import { Builder } from '@/components/builder/types';
import { getAllBuilders, clearAttendanceCache } from '@/utils/faceRecognition/attendance';
import { getCurrentDateString } from '@/utils/date/dateUtils';
import { useCohortSelection } from './useCohortSelection';

export const useDashboardData = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedCohort } = useCohortSelection();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentDate = getCurrentDateString();
      const cohortFilter = selectedCohort === 'All Cohorts' ? undefined : selectedCohort;
      let fetchedBuilders = await getAllBuilders(currentDate, cohortFilter);
      
      // Retry once if result is unexpectedly empty (stale cache or cohort-mismatch cache)
      if (!fetchedBuilders || fetchedBuilders.length === 0) {
        console.warn('[useDashboardData] Empty builders; clearing cache and retrying once', { currentDate, cohortFilter });
        clearAttendanceCache(currentDate);
        fetchedBuilders = await getAllBuilders(currentDate, cohortFilter);
      }
      
      setBuilders(fetchedBuilders);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCohort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    builders,
    isLoading,
    error,
    selectedCohort,
    refresh: loadData
  };
};
