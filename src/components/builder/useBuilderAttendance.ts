
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBuilderAttendance = (builderId: string) => {
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAttendanceRate = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', builderId);

        if (error) {
          console.error('Error fetching builder attendance history:', error);
          return;
        }

        if (data.length === 0) {
          setAttendanceRate(null);
          return;
        }

        // Filter out Fridays from attendance records
        const nonFridayRecords = data.filter(record => {
          const date = new Date(record.date);
          return date.getDay() !== 5; // 5 is Friday (0 is Sunday)
        });

        if (nonFridayRecords.length === 0) {
          setAttendanceRate(null);
          return;
        }

        // Count the number of days the builder was present or late
        const presentCount = nonFridayRecords.filter(
          record => record.status === 'present' || record.status === 'late'
        ).length;

        // Calculate the rate
        const rate = (presentCount / nonFridayRecords.length) * 100;
        setAttendanceRate(Math.round(rate));
      } catch (error) {
        console.error('Error in fetchAttendanceRate:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceRate();
  }, [builderId]);

  return { attendanceRate, isLoading };
};
