
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/builder/types';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');
const APRIL_4_2025 = '2025-04-04';

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
      
      for (const builder of builders) {
        try {
          const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', builder.id);
      
          if (error) {
            console.error('Error fetching attendance:', error);
            rates[builder.id] = null;
            continue;
          }

          if (!data || data.length === 0) {
            rates[builder.id] = null;
            continue;
          }

          // Apply EXACTLY the same filtering logic as in useBuilderAttendance
          const filteredRecords = data.filter(record => {
            const date = new Date(record.date);
            const isFriday = date.getDay() === 5;
            const isApril4th = record.date === APRIL_4_2025;
            const isBeforeMinDate = date < MINIMUM_DATE;
            
            // Debug for Gabriel Gomes-Pasker if needed
            if (builder.id === 'bf5b91ca-d727-46a2-a21c-76d82c8b39be') {
              console.log(`[BuildersTab] ${record.date}, isFriday: ${isFriday}, isApril4th: ${isApril4th}, isBeforeMinDate: ${isBeforeMinDate}, keep: ${!isFriday && !isApril4th && !isBeforeMinDate}`);
            }
            
            return !isFriday && !isApril4th && !isBeforeMinDate;
          });

          if (filteredRecords.length === 0) {
            rates[builder.id] = null;
            continue;
          }

          const presentCount = filteredRecords.filter(
            record => record.status === 'present' || record.status === 'late'
          ).length;

          // Handle 100% case explicitly the same way
          if (presentCount === filteredRecords.length) {
            rates[builder.id] = 100;
          } else {
            rates[builder.id] = Math.round((presentCount / filteredRecords.length) * 100);
          }
            
          console.log(`Builder ${builder.name}: ${presentCount}/${filteredRecords.length} = ${rates[builder.id]}%`);
        } catch (error) {
          console.error('Error calculating attendance rate:', error);
          rates[builder.id] = null;
        }
      }
      
      setBuilderAttendanceRates(rates);
      setIsLoading(false);
    };

    fetchAttendanceRates();
  }, [builders]);

  return { builderAttendanceRates, isLoading };
};
