
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

export const useBuilderAttendance = (builderId: string) => {
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendanceRate = useCallback(async () => {
    if (!builderId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Fetching attendance for builder ${builderId}`);
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', builderId);
      
      if (error) {
        console.error('Error fetching attendance:', error);
        return;
      }

      console.log(`Got ${data.length} raw attendance records for builder ${builderId}`);
      
      // Filter out records that are:
      // 1. For Fridays (day 5)
      // 2. For April 4th, 2025
      // 3. Before minimum date (March 15, 2025)
      const filteredRecords = data.filter(record => {
        const date = new Date(record.date);
        const isFriday = date.getDay() === 5;
        const isApril4th = date.getFullYear() === 2025 && 
                          date.getMonth() === 3 && // April is month 3 (0-indexed)
                          date.getDate() === 4;
        const isBeforeMinDate = date < MINIMUM_DATE;
        return !isFriday && !isApril4th && !isBeforeMinDate;
      });
      
      console.log(`After filtering, ${filteredRecords.length} valid attendance records for builder ${builderId}`);
      
      if (filteredRecords.length === 0) {
        setAttendanceRate(null);
        setIsLoading(false);
        return;
      }
      
      // Count present or late records
      const presentCount = filteredRecords.filter(
        record => record.status === 'present' || record.status === 'late'
      ).length;
      
      console.log(`Builder ${builderId}: Present/late count: ${presentCount}, Total filtered: ${filteredRecords.length}`);
      
      // Calculate percentage - if all records are present/late, ensure we display exactly 100%
      let rate: number;
      if (presentCount === filteredRecords.length) {
        rate = 100;
        console.log(`Setting PERFECT attendance rate for builder ${builderId}: ${rate}%`);
      } else {
        // Calculate percentage and round to whole number
        rate = Math.round((presentCount / filteredRecords.length) * 100);
        console.log(`Calculated attendance rate for builder ${builderId}: ${rate}%`);
      }
      
      setAttendanceRate(rate);
    } catch (error) {
      console.error('Error calculating attendance rate:', error);
    } finally {
      setIsLoading(false);
    }
  }, [builderId]);

  useEffect(() => {
    fetchAttendanceRate();
    
    // Subscribe to changes in the attendance table for this builder
    const channel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance',
        filter: `student_id=eq.${builderId}`
      }, () => {
        console.log('Attendance changed, refreshing rate');
        fetchAttendanceRate();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [builderId, fetchAttendanceRate]);

  return { attendanceRate, isLoading };
};
