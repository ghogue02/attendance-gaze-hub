
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

export const useBuilderAttendance = (builderId: string) => {
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAttendanceRate = async () => {
      if (!builderId) return;
      
      setIsLoading(true);
      try {
        // First, get all attendance records for this builder
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', builderId);

        if (error) {
          console.error('Error fetching builder attendance history:', error);
          return;
        }

        if (!data || data.length === 0) {
          setAttendanceRate(null);
          return;
        }

        // Debug logging
        console.log(`[useBuilderAttendance] Found ${data.length} attendance records for builder ${builderId}`);
        
        // Filter out Fridays, April 4th specifically, and dates before MINIMUM_DATE
        const filteredRecords = data.filter(record => {
          const date = new Date(record.date);
          const isFriday = date.getDay() === 5;
          const isApril4th = date.getFullYear() === 2025 && 
                            date.getMonth() === 3 && // April is month 3 (0-indexed)
                            date.getDate() === 4;
          return !isFriday && !isApril4th && date >= MINIMUM_DATE;
        });

        console.log(`[useBuilderAttendance] After filtering, ${filteredRecords.length} valid attendance records remain`);
        
        if (filteredRecords.length === 0) {
          setAttendanceRate(null);
          return;
        }

        // Count the number of days the builder was present or late
        const presentCount = filteredRecords.filter(
          record => record.status === 'present' || record.status === 'late'
        ).length;

        console.log(`[useBuilderAttendance] Present count: ${presentCount}, Total valid days: ${filteredRecords.length}`);
        
        // Calculate the rate - always round to nearest integer
        const rate = (presentCount / filteredRecords.length) * 100;
        
        // If all records are present/late, ensure we display exactly 100% rather than rounding errors
        const finalRate = presentCount === filteredRecords.length ? 100 : Math.round(rate);
        console.log(`[useBuilderAttendance] Calculated rate: ${finalRate}%`);
        
        setAttendanceRate(finalRate);
      } catch (error) {
        console.error('Error in fetchAttendanceRate:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (builderId) {
      fetchAttendanceRate();
    }
  }, [builderId]);

  return { attendanceRate, isLoading };
};
