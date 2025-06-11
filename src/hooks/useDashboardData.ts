
import { useState, useEffect, useCallback } from 'react';
import { Builder } from '@/components/builder/types';
import { getAllBuilders } from '@/utils/faceRecognition/attendance';
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
      const fetchedBuilders = await getAllBuilders(currentDate, cohortFilter);
      
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
