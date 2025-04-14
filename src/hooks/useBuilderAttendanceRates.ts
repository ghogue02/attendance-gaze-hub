
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, AttendanceStats } from '@/components/builder/types';
import { calculateAttendanceStatistics } from '@/utils/attendance/calculationUtils';

// Define the start date for fetching records (align with calculation start date)
const ATTENDANCE_START_DATE = '2025-03-15';
// Set a higher limit to ensure we get all records
const MAX_RECORDS_LIMIT = 10000;

// Global debug flag - set to false to reduce console noise
const DEBUG_LOGGING = false;

/**
 * Hook to calculate attendance rates for a list of builders
 * Optimized to reduce database queries
 */
export const useBuilderAttendanceRates = (builders: Builder[]) => {
  const [builderAttendanceRates, setBuilderAttendanceRates] = useState<{[key: string]: number | null}>({});
  const [builderAttendanceStats, setBuilderAttendanceStats] = useState<{[key: string]: AttendanceStats | null}>({});
  const [isLoading, setIsLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const cacheRef = useRef<{
    builderIds: string[];
    rates: {[key: string]: number | null};
    stats: {[key: string]: AttendanceStats | null};
    timestamp: number;
  }>({ builderIds: [], rates: {}, stats: {}, timestamp: 0 });
  
  // Add a cache control to prevent excessive fetches
  const CACHE_TTL = 1000 * 60 * 15; // 15 minutes cache TTL

  useEffect(() => {
    // Skip empty builder lists
    if (builders.length === 0) {
      setBuilderAttendanceRates({});
      setBuilderAttendanceStats({});
      return;
    }
    
    // Skip if we're already fetching
    if (isFetchingRef.current) {
      DEBUG_LOGGING && console.log('[useBuilderAttendanceRates] Skipping fetch - already in progress');
      return;
    }
    
    // Extract builder IDs for comparison
    const builderIds = builders.map(b => b.id).sort().join(',');
    
    // Check if we have cached data for these exact builders
    if (
      builderIds === cacheRef.current.builderIds.sort().join(',') &&
      Date.now() - cacheRef.current.timestamp < CACHE_TTL
    ) {
      DEBUG_LOGGING && console.log('[useBuilderAttendanceRates] Using cached attendance rates for this exact builder set');
      setBuilderAttendanceRates(cacheRef.current.rates);
      setBuilderAttendanceStats(cacheRef.current.stats);
      return;
    }
    
    // Check if we recently fetched (cache TTL)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < CACHE_TTL) {
      DEBUG_LOGGING && console.log('[useBuilderAttendanceRates] Using cached attendance data');
      return;
    }
    
    const fetchAttendanceRates = async () => {
      // Extract builder IDs for the query filter
      const builderIds = builders.map(b => b.id);
      
      // If no builders, return early
      if (builderIds.length === 0) return;
      
      setIsLoading(true);
      isFetchingRef.current = true;
      
      try {
        DEBUG_LOGGING && console.log(`[useBuilderAttendanceRates] Fetching ALL attendance records for ${builders.length} builders in a SINGLE batch query`);
        
        // Use a single consolidated query to get ALL attendance records for all builders
        // This avoids making individual requests for each builder
        const { data: allAttendanceRecords, error } = await supabase
          .from('attendance')
          .select('student_id, status, date')
          .in('student_id', builderIds)
          .gte('date', ATTENDANCE_START_DATE)
          .limit(MAX_RECORDS_LIMIT);
        
        if (error) {
          console.error('[useBuilderAttendanceRates] Error fetching attendance records:', error);
          setBuilderAttendanceRates({});
          setBuilderAttendanceStats({});
          return;
        }

        const recordCount = allAttendanceRecords?.length || 0;
        DEBUG_LOGGING && console.log(`[useBuilderAttendanceRates] Successfully fetched ${recordCount} total attendance records for ${builders.length} builders`);
        
        // Group records by student_id for efficient processing
        const recordsByStudent = allAttendanceRecords?.reduce((acc, record) => {
          if (!acc[record.student_id]) {
            acc[record.student_id] = [];
          }
          acc[record.student_id].push(record);
          return acc;
        }, {} as Record<string, typeof allAttendanceRecords>);
        
        const rates: {[key: string]: number | null} = {};
        const stats: {[key: string]: AttendanceStats | null} = {};
        
        // Process each builder's attendance - much more efficient in memory
        for (const builder of builders) {
          const builderRecords = recordsByStudent?.[builder.id] || [];
          
          // Calculate rate using the utility function
          const calculatedStats = calculateAttendanceStatistics(builderRecords);
          
          // Store both the rate and the full stats object
          rates[builder.id] = calculatedStats.rate;
          stats[builder.id] = calculatedStats;
        }
        
        // Update state
        setBuilderAttendanceRates(rates);
        setBuilderAttendanceStats(stats);
        
        // Update cache with new data
        cacheRef.current = {
          builderIds: builders.map(b => b.id),
          rates,
          stats,
          timestamp: Date.now()
        };
        
        // Update cache timestamp
        lastFetchTimeRef.current = Date.now();
        
      } catch (error) {
        console.error('[useBuilderAttendanceRates] Error processing attendance rates:', error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchAttendanceRates();
  }, [builders]);

  return { builderAttendanceRates, builderAttendanceStats, isLoading };
};
