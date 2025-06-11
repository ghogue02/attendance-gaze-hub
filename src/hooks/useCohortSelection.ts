
import { useState, useEffect } from 'react';
import { CohortName } from '@/types/cohort';

const COHORT_STORAGE_KEY = 'selected-cohort';

export const useCohortSelection = () => {
  const [selectedCohort, setSelectedCohort] = useState<CohortName>('All Cohorts');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(COHORT_STORAGE_KEY);
    if (saved && ['March 2025 Pilot', 'June 2025', 'All Cohorts'].includes(saved)) {
      setSelectedCohort(saved as CohortName);
    }
  }, []);

  // Save to localStorage when changed
  const updateSelectedCohort = (cohort: CohortName) => {
    setSelectedCohort(cohort);
    localStorage.setItem(COHORT_STORAGE_KEY, cohort);
  };

  return {
    selectedCohort,
    setSelectedCohort: updateSelectedCohort
  };
};
