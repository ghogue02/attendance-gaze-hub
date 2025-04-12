
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
        
        // Filter out any records for Fridays or April 4th/11th, 2025, or before MINIMUM_DATE
        const validAttendanceRecords = allAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.date);
          const isFriday = recordDate.getDay() === 5;
          const isApril4th = record.date === APRIL_4_2025;
          const isApril11th = record.date === APRIL_11_2025;
          const isBeforeMinDate = recordDate < MINIMUM_DATE;
          
          return !isFriday && !isApril4th && !isApril11th && !isBeforeMinDate;
        }) || [];
        
        // Group records by student_id
        const attendanceByBuilder: Record<string, any[]> = {};
        
        validAttendanceRecords.forEach(record => {
          if (!attendanceByBuilder[record.student_id]) {
            attendanceByBuilder[record.student_id] = [];
          }
          attendanceByBuilder[record.student_id].push(record);
        });

        // Get the complete set of class dates for accurate denominator
        const allDates = new Set<string>();
        validAttendanceRecords.forEach(record => {
          allDates.add(record.date);
        });
        
        const totalClassDates = Array.from(allDates);
        
        // Log the complete set of class dates
        console.log(`[useBuilderAttendanceRates] Found ${totalClassDates.length} total class dates`);
        
        // Process each builder's records
        for (const builder of builders) {
          const records = attendanceByBuilder[builder.id] || [];
          
          if (records.length === 0 || totalClassDates.length === 0) {
            rates[builder.id] = null;
            continue;
          }

          // Count present or late records for this builder
          const presentCount = records.filter(
            record => record.status === 'present' || record.status === 'late'
          ).length;

          // Calculate attendance percentage - present count divided by total class days
          const attendanceRate = Math.round((presentCount / totalClassDates.length) * 100);
          rates[builder.id] = attendanceRate;
          
          // Log attendance calculation for a sample of builders
          if (builders.indexOf(builder) < 3) {
            console.log(`[useBuilderAttendanceRates] Builder ${builder.name} (${builder.id}): ${presentCount}/${totalClassDates.length} = ${rates[builder.id]}%`);
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
