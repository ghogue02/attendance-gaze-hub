
import { useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { getAllBuilders } from '@/utils/faceRecognition/attendance';
import { getCurrentDateString } from '@/utils/date/dateUtils';

interface PresentBuildersByCohort {
  pilotCohort: Builder[];
  juneCohort: Builder[];
  isLoading: boolean;
  error: string | null;
}

export const usePresentBuildersByCohort = (): PresentBuildersByCohort => {
  const [pilotCohort, setPilotCohort] = useState<Builder[]>([]);
  const [juneCohort, setJuneCohort] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresentBuilders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const currentDate = getCurrentDateString();
        
        // Fetch builders for both cohorts in parallel
        const [pilotBuilders, juneBuilders] = await Promise.all([
          getAllBuilders(currentDate, 'March 2025 Pilot'),
          getAllBuilders(currentDate, 'June 2025')
        ]);
        
        // Filter for present builders only
        const presentPilot = pilotBuilders.filter(builder => 
          builder.status === 'present' || builder.status === 'late'
        );
        const presentJune = juneBuilders.filter(builder => 
          builder.status === 'present' || builder.status === 'late'
        );
        
        setPilotCohort(presentPilot);
        setJuneCohort(presentJune);
      } catch (err) {
        console.error('Error fetching present builders by cohort:', err);
        setError('Failed to load present builders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresentBuilders();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPresentBuilders, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    pilotCohort,
    juneCohort,
    isLoading,
    error
  };
};
