
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, AttendanceStats } from '@/components/builder/types';
import { calculateAttendanceStatistics } from '@/utils/attendance/calculationUtils';

/**
 * Hook to calculate attendance rates for a list of builders
 */
export const useBuilderAttendanceRates = (builders: Builder[]) => {
  const [builderAttendanceRates, setBuilderAttendanceRates] = useState<{[key: string]: number | null}>({});
  const [builderAttendanceStats, setBuilderAttendanceStats] = useState<{[key: string]: AttendanceStats | null}>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAttendanceRates = async () => {
      if (builders.length === 0) {
        setBuilderAttendanceRates({});
        setBuilderAttendanceStats({});
        return;
      }
      
      setIsLoading(true);
      const rates: {[key: string]: number | null} = {};
      const stats: {[key: string]: AttendanceStats | null} = {};
      
      // Log start of batch processing
      console.log(`[useBuilderAttendanceRates] Fetching attendance rates for ${builders.length} builders`);
      
      try {
        // Step 1: Get all attendance records from the database
        const { data: allAttendanceRecords, error } = await supabase
          .from('attendance')
          .select('student_id, status, date')
          .order('date');
        
        if (error) {
          console.error('[useBuilderAttendanceRates] Error fetching attendance records:', error);
          setBuilderAttendanceRates({});
          setBuilderAttendanceStats({});
          setIsLoading(false);
          return;
        }
        
        // Process each builder's attendance
        for (const builder of builders) {
          // Get this builder's attendance records
          const builderRecords = allAttendanceRecords?.filter(record => 
            record.student_id === builder.id
          ) || [];
          
          // Special debug for Saeed/Zargarchi
          const isSaeed = builder.name.toLowerCase().includes("seyedmostafa") || 
                         builder.name.toLowerCase().includes("zargarchi") || 
                         builder.id === "c80ac741-bee0-441d-aa3b-02aafa3dc018";
          
          if (isSaeed) {
            console.log(`[useBuilderAttendanceRates] Found Saeed with ID: ${builder.id}`);
            console.log(`[useBuilderAttendanceRates] Records for ${builder.name}:`, builderRecords);
          }
          
          // Calculate rate using the updated utility function
          const calculatedStats = calculateAttendanceStatistics(builderRecords);
          
          if (isSaeed) {
            console.log(`[useBuilderAttendanceRates] Calculated stats for ${builder.name}:`, calculatedStats);
          }
          
          // Store both the rate and the full stats object
          rates[builder.id] = calculatedStats.rate;
          stats[builder.id] = calculatedStats;
          
          // Log attendance calculation for a sample of builders
          if (builders.indexOf(builder) < 3 || isSaeed) {
            console.log(`[useBuilderAttendanceRates] Builder ${builder.name} (${builder.id}): Attendance rate: ${rates[builder.id]}%, Present: ${calculatedStats.presentCount}/${calculatedStats.totalClassDays}`);
          }
        }
      } catch (error) {
        console.error('[useBuilderAttendanceRates] Error processing attendance rates:', error);
      }
      
      console.log(`[useBuilderAttendanceRates] Completed calculating rates for ${builders.length} builders`);
      setBuilderAttendanceRates(rates);
      setBuilderAttendanceStats(stats);
      setIsLoading(false);
    };

    fetchAttendanceRates();
  }, [builders]);

  return { builderAttendanceRates, builderAttendanceStats, isLoading };
};
