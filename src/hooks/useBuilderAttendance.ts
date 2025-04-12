
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
        const { data, error } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', builderId)
          .neq('date', '2025-04-11'); // Skip April 11 records
          
        if (error) {
          console.error('Failed to fetch attendance records:', error);
          return;
        }
        
        if (!data || data.length === 0) {
          setAttendanceRate(0);
          return;
        }
        
        const presentCount = data.filter(record => 
          record.status === 'present' || record.status === 'late'
        ).length;
        
        const totalRecords = data.length;
        const rate = Math.round((presentCount / totalRecords) * 100);
        
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
