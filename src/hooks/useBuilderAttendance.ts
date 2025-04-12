// hooks/useBuilderAttendanceRates.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, AttendanceStats, AttendanceRecord } from '@/components/builder/types';

// Define the start date for fetching records (YYYY-MM-DD format)
const ATTENDANCE_START_DATE = '2025-03-15';

// Set a higher limit to ensure we get all records (or a very large chunk)
const MAX_RECORDS_LIMIT = 10000;

/**
 * Hook to calculate attendance rates for a list of builders.
 */
export const useBuilderAttendanceRates = (builders: Builder[]) => {
  const [builderAttendanceStats, setBuilderAttendanceStats] = useState<{ [key: string]: AttendanceStats | null }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAttendanceRates = async () => {
      // Null check: Only proceed if builders is not null or undefined.
      if (!builders) {
          console.warn("[useBuilderAttendanceRates] No builders provided (builders is null or undefined), resetting stats.");
          setBuilderAttendanceStats({});
          setIsLoading(false);
          return;
      }

      const builderIds = builders.map(b => b.id);  // Get list of builder IDs
      console.log(`[useBuilderAttendanceRates] Fetching ALL attendance records for ${builderIds.length} builders since ${ATTENDANCE_START_DATE} (Limit: ${MAX_RECORDS_LIMIT})`);

      setIsLoading(true);
      const stats: { [key: string]: AttendanceStats | null } = {}; // Clear object every time effect runs

      try {
        // Fetch ALL relevant attendance records for current builders since ATTENDANCE_START_DATE.

        const { data: allRelevantAttendanceRecords, error } = await supabase
          .from('attendance')
          .select('student_id, status, date')
          .in('student_id', builderIds)  // Use IN operator
          .gte('date', ATTENDANCE_START_DATE) // Filter date
          .limit(MAX_RECORDS_LIMIT) // Explicit limit.
          .order('date');

        if (error) {
          console.error('[useBuilderAttendanceRates] Error fetching attendance records:', error);
          setBuilderAttendanceStats({});
          setIsLoading(false);
          return;
        }

        console.log(`[useBuilderAttendanceRates] Fetched ${allRelevantAttendanceRecords?.length || 0} attendance records from Supabase.`);

        if ((allRelevantAttendanceRecords?.length || 0) === MAX_RECORDS_LIMIT) {
          console.warn(`[useBuilderAttendanceRates] WARNING: Reached the max record limit of ${MAX_RECORDS_LIMIT}. Some data may be missing! Consider paginating.`);
        }

        // Process each builder's attendance
        for (const builder of builders) {
          //Filter data by student ID since `in` returns results from ALL ID listed
          const builderRecords = allRelevantAttendanceRecords?.filter(record => record.student_id === builder.id) || [];

          // Log specific builder and record count to inspect individual calculations
          if (builder.name.toLowerCase().includes("saeed") || builder.name.toLowerCase().includes("zargarchi")) {
               console.log(`[useBuilderAttendanceRates] Processing Saeed (Seyedmostafa Zargarchi), found ${builderRecords.length} attendance records.`);
               console.log(`[calculateAttendanceStatistics] Input records for Saeed (9dbe...):`, JSON.stringify(builderRecords, null, 2));
           }

          const calculatedStats = calculateAttendanceStatistics(builderRecords); // Use the centralized util

          stats[builder.id] = calculatedStats;  // Use unique builder id for each item


          if (builder.name.toLowerCase().includes("saeed") || builder.name.toLowerCase().includes("zargarchi")) { // Log Specific Builders to monitor
               console.log(`[useBuilderAttendanceRates] Stats for builder Seyedmostafa Zargarchi`, stats[builder.id]);
          }
        }

        console.log('[useBuilderAttendanceRates] FINAL stats object BEFORE setting state:', JSON.stringify(stats, null, 2));

        // Update the state
        setBuilderAttendanceStats(stats);


      } catch (error) {
          console.error('[useBuilderAttendanceRates] Error processing attendance rates:', error);
          setBuilderAttendanceStats({}); // Reset stats on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceRates(); // Kick off the data fetching and calculation process
  }, [builders]);

  return { builderAttendanceStats, isLoading }; // Correct return values!
};