
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, AttendanceStats } from '@/components/builder/types';
import { calculateAttendanceStatistics } from '@/utils/attendance/calculationUtils';

// Define the start date for fetching records (align with calculation start date)
const ATTENDANCE_START_DATE = '2025-03-15';
// Set a higher limit to ensure we get all records
const MAX_RECORDS_LIMIT = 10000;

/**
 * Hook to calculate attendance rates for a list of builders
 */
export const useBuilderAttendanceRates = (builders: Builder[]) => {
  const [builderAttendanceRates, setBuilderAttendanceRates] = useState<{[key: string]: number | null}>({});
  const [builderAttendanceStats, setBuilderAttendanceStats] = useState<{[key: string]: AttendanceStats | null}>({});
  const [isLoading, setIsLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  
  // Add a cache control to prevent excessive fetches
  const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

  useEffect(() => {
    // Skip empty builder lists
    if (builders.length === 0) {
      setBuilderAttendanceRates({});
      setBuilderAttendanceStats({});
      return;
    }
    
    // Skip if we're already fetching
    if (isFetchingRef.current) {
      console.log('[useBuilderAttendanceRates] Skipping fetch - already in progress');
      return;
    }
    
    // Check if we recently fetched (cache TTL)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < CACHE_TTL) {
      console.log('[useBuilderAttendanceRates] Using cached attendance data');
      return;
    }
    
    const fetchAttendanceRates = async () => {
      // Extract builder IDs for the query filter
      const builderIds = builders.map(b => b.id);
      
      setIsLoading(true);
      isFetchingRef.current = true;
      
      try {
        console.log(`[useBuilderAttendanceRates] Fetching ALL attendance records since ${ATTENDANCE_START_DATE} for ${builders.length} builders in a SINGLE query`);
        
        // SINGLE QUERY for all builders' attendance records
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
        console.log(`[useBuilderAttendanceRates] Successfully fetched ${recordCount} total attendance records for ${builders.length} builders`);
        
        // Warn if we hit the limit
        if (recordCount === MAX_RECORDS_LIMIT) {
          console.warn(`[useBuilderAttendanceRates] WARNING: Fetched the maximum limit (${MAX_RECORDS_LIMIT}) of records. Some data might be missing.`);
        }
        
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
        
        // Process each builder's attendance - much more efficient now
        for (const builder of builders) {
          const builderRecords = recordsByStudent?.[builder.id] || [];
          
          // Calculate rate using the utility function
          const calculatedStats = calculateAttendanceStatistics(builderRecords);
          
          // Store both the rate and the full stats object
          rates[builder.id] = calculatedStats.rate;
          stats[builder.id] = calculatedStats;
          
          // Log attendance for debugging (just for a few builders)
          if (builders.indexOf(builder) < 3) {
            console.log(`[useBuilderAttendanceRates] Builder ${builder.name} (${builder.id}): Attendance rate: ${rates[builder.id]}%, Present: ${stats[builder.id]?.presentCount}/${stats[builder.id]?.totalClassDays}`);
          }
        }
        
        // Update state
        setBuilderAttendanceRates(rates);
        setBuilderAttendanceStats(stats);
        
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
