
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/builder/types';
import { calculateAttendanceRate } from '@/utils/attendance/calculationUtils';

/**
 * Hook to calculate attendance rates for a list of builders
 */
export const useBuilderAttendanceRates = (builders: Builder[]) => {
  const [builderAttendanceRates, setBuilderAttendanceRates] = useState<{[key: string]: number | null}>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAttendanceRates = async () => {
      if (builders.length === 0) {
        setBuilderAttendanceRates({});
        return;
      }
      
      setIsLoading(true);
      const rates: {[key: string]: number | null} = {};
      
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
          setIsLoading(false);
          return;
        }
        
        // Process each builder's attendance
        for (const builder of builders) {
          // Get this builder's attendance records
          const builderRecords = allAttendanceRecords?.filter(record => 
            record.student_id === builder.id
          ) || [];
          
          // Calculate rate using the shared utility function
          const attendanceRate = calculateAttendanceRate(builderRecords);
          rates[builder.id] = attendanceRate;
          
          // Log attendance calculation for a sample of builders
          if (builders.indexOf(builder) < 3) {
            console.log(`[useBuilderAttendanceRates] Builder ${builder.name} (${builder.id}): Attendance rate: ${rates[builder.id]}%`);
          }
        }
      } catch (error) {
        console.error('[useBuilderAttendanceRates] Error processing attendance rates:', error);
      }
      
      console.log(`[useBuilderAttendanceRates] Completed calculating rates for ${builders.length} builders`);
      setBuilderAttendanceRates(rates);
      setIsLoading(false);
    };

    fetchAttendanceRates();
  }, [builders]);

  return { builderAttendanceRates, isLoading };
};
