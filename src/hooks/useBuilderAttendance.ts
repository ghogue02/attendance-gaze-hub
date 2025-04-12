
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '@/utils/attendance/formatUtils';

export const useBuilderAttendance = (builderId: string, isOpen: boolean) => {
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Calculate the attendance rate when the dialog is opened
  useEffect(() => {
    if (!isOpen || !builderId) return;
    
    const calculateAttendanceRate = async () => {
      setIsLoading(true);
      try {
        console.log(`Calculating attendance rate for builder ${builderId}`);
        
        const { data, error } = await supabase
          .from('attendance')
          .select('status, date')
          .eq('student_id', builderId);
          
        if (error) {
          console.error('Failed to fetch attendance records:', error);
          return;
        }
        
        if (!data || data.length === 0) {
          console.log('No attendance records found for student');
          setAttendanceRate(0);
          return;
        }
        
        // Filter out April 11 and April 4 (Fridays) records 
        const filteredData = data.filter(record => 
          record.date !== '2025-04-11' && record.date !== '2025-04-04'
        );
        
        if (filteredData.length === 0) {
          console.log('No valid attendance records after filtering');
          setAttendanceRate(0);
          return;
        }
        
        // Debug the filtered attendance data
        console.log(`Total records: ${data.length}, filtered records: ${filteredData.length}`);
        console.log(`Records after filtering:`, filteredData);
        
        const presentCount = filteredData.filter(record => 
          record.status === 'present' || record.status === 'late'
        ).length;
        
        console.log(`Present/late count: ${presentCount}, total: ${filteredData.length}`);
        
        // Calculate attendance rate as a percentage
        const rate = Math.round((presentCount / filteredData.length) * 100);
        console.log(`Calculated attendance rate: ${rate}%`);
        
        setAttendanceRate(rate);
      } catch (error) {
        console.error('Error calculating attendance rate:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    calculateAttendanceRate();
  }, [builderId, isOpen]);
  
  return { 
    attendanceRate,
    isLoading,
    formatDate
  };
};
