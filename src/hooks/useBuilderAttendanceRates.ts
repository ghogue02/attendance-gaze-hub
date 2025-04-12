
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
      const builderIds = builders.map(builder => builder.id);
      
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
        
        // Step 2: Determine all valid class dates
        const allDatesSet = new Set<string>();
        allAttendanceRecords?.forEach(record => {
          const recordDate = new Date(record.date);
          const isFriday = recordDate.getDay() === 5;
          const isApril4th = record.date === APRIL_4_2025;
          const isApril11th = record.date === APRIL_11_2025;
          const isBeforeMinDate = recordDate < MINIMUM_DATE;
          
          // Only add valid class dates to our set
          if (!isFriday && !isApril4th && !isApril11th && !isBeforeMinDate) {
            allDatesSet.add(record.date);
          }
        });
        
        const validClassDates = Array.from(allDatesSet);
        
        if (validClassDates.length === 0) {
          console.log('[useBuilderAttendanceRates] No valid class dates found');
          setBuilderAttendanceRates({});
          setIsLoading(false);
          return;
        }
        
        console.log(`[useBuilderAttendanceRates] Found ${validClassDates.length} total class dates`);
        
        // Step 3: Filter attendance records for each builder
        for (const builder of builders) {
          // Get this builder's attendance records
          const builderRecords = allAttendanceRecords?.filter(record => 
            record.student_id === builder.id
          ) || [];
          
          // Filter out any records for Fridays, April 4th/11th, 2025, or before MINIMUM_DATE
          const validBuilderRecords = builderRecords.filter(record => {
            const recordDate = new Date(record.date);
            const isFriday = recordDate.getDay() === 5;
            const isApril4th = record.date === APRIL_4_2025;
            const isApril11th = record.date === APRIL_11_2025;
            const isBeforeMinDate = recordDate < MINIMUM_DATE;
            
            return !isFriday && !isApril4th && !isApril11th && !isBeforeMinDate;
          });
          
          // Count days when builder was present or late
          const presentCount = validBuilderRecords.filter(
            record => record.status === 'present' || record.status === 'late'
          ).length;
          
          // Calculate attendance rate using ALL valid class dates as denominator
          // Cap the attendance rate at 100%
          const attendanceRate = Math.min(100, Math.round((presentCount / validClassDates.length) * 100));
          rates[builder.id] = attendanceRate;
          
          // Log attendance calculation for a sample of builders
          if (builders.indexOf(builder) < 3) {
            console.log(`[useBuilderAttendanceRates] Builder ${builder.name} (${builder.id}): ${presentCount}/${validClassDates.length} = ${rates[builder.id]}%`);
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
