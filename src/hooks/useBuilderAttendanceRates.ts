
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/builder/types';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');
const APRIL_4_2025 = '2025-04-04';
const APRIL_11_2025 = '2025-04-11';

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
      
      // Process all builders at once rather than one by one
      // Create a combined query to fetch all attendance records for all builders
      const builderIds = builders.map(builder => builder.id);
      
      try {
        const { data: allAttendanceRecords, error } = await supabase
          .from('attendance')
          .select('student_id, status, date')
          .in('student_id', builderIds);
        
        if (error) {
          console.error('[useBuilderAttendanceRates] Error fetching attendance records:', error);
          setBuilderAttendanceRates({});
          setIsLoading(false);
          return;
        }
        
        // Group records by student_id
        const attendanceByBuilder: Record<string, any[]> = {};
        
        allAttendanceRecords?.forEach(record => {
          if (!attendanceByBuilder[record.student_id]) {
            attendanceByBuilder[record.student_id] = [];
          }
          attendanceByBuilder[record.student_id].push(record);
        });

        // Get the complete set of class dates for accurate denominator
        const allDates = new Set<string>();
        allAttendanceRecords?.forEach(record => {
          const date = record.date;
          const recordDate = new Date(date);
          
          // Only add valid class dates (not Fridays, not special dates, not before minimum date)
          const isFriday = recordDate.getDay() === 5;
          const isApril4th = date === APRIL_4_2025;
          const isApril11th = date === APRIL_11_2025;
          const isBeforeMinDate = recordDate < MINIMUM_DATE;
          
          if (!isFriday && !isApril4th && !isApril11th && !isBeforeMinDate) {
            allDates.add(date);
          }
        });
        
        // Log the complete set of class dates
        console.log(`[useBuilderAttendanceRates] Found ${allDates.size} total class dates`);
        
        // Process each builder's records
        for (const builder of builders) {
          const records = attendanceByBuilder[builder.id] || [];
          
          if (records.length === 0) {
            rates[builder.id] = null;
            continue;
          }

          // Filter records using the same criteria as in useBuilderAttendance
          const filteredRecords = records.filter(record => {
            const date = new Date(record.date);
            const isFriday = date.getDay() === 5;
            const isApril4th = record.date === APRIL_4_2025;
            const isApril11th = record.date === APRIL_11_2025;
            const isBeforeMinDate = date < MINIMUM_DATE;
            
            return !isFriday && !isApril4th && !isApril11th && !isBeforeMinDate;
          });

          if (filteredRecords.length === 0) {
            rates[builder.id] = null;
            continue;
          }

          const presentCount = filteredRecords.filter(
            record => record.status === 'present' || record.status === 'late'
          ).length;

          // Calculate the attendance rate based on the number of classes they SHOULD have attended
          // This ensures we're calculating based on total classes, not just their records
          const totalClasses = allDates.size;
          
          // Calculate the final rate
          if (totalClasses === 0) {
            rates[builder.id] = null;
          } else if (presentCount === filteredRecords.length && filteredRecords.length === totalClasses) {
            // Perfect attendance - both 100% attendance for all classes they should have attended
            rates[builder.id] = 100;
          } else {
            // Calculate based on attended vs. total classes they should have attended
            rates[builder.id] = Math.round((presentCount / totalClasses) * 100);
          }
          
          // Log attendance calculation for a sample of builders
          if (builders.indexOf(builder) < 3) {
            console.log(`[useBuilderAttendanceRates] Builder ${builder.name} (${builder.id}): ${presentCount}/${totalClasses} = ${rates[builder.id]}%`);
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
