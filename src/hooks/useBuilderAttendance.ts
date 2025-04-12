
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/attendance/formatUtils';
import { calculateAttendanceRate } from '@/utils/attendance/calculationUtils';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');
const APRIL_4_2025 = '2025-04-04';
const APRIL_11_2025 = '2025-04-11';

export const useBuilderAttendance = (builderId: string, isOpen: boolean) => {
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Calculate the attendance rate when the dialog is opened
  useEffect(() => {
    if (!isOpen || !builderId) return;
    
    const fetchAttendanceData = async () => {
      setIsLoading(true);
      try {
        console.log(`Calculating attendance rate for builder ${builderId}`);
        
        // First, get all attendance records for this student
        const { data, error } = await supabase
          .from('attendance')
          .select('status, date')
          .eq('student_id', builderId);
          
        if (error) {
          console.error('Failed to fetch attendance records:', error);
          return;
        }
        
        // Get all possible class dates from all students' records
        const { data: allAttendanceData, error: allAttendanceError } = await supabase
          .from('attendance')
          .select('date')
          .order('date');
          
        if (allAttendanceError) {
          console.error('Failed to fetch all attendance dates:', allAttendanceError);
          return;
        }
        
        const rate = calculateAttendanceRate(data || [], allAttendanceData || []);
        setAttendanceRate(rate);
      } catch (error) {
        console.error('Error calculating attendance rate:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [builderId, isOpen]);
  
  return { 
    attendanceRate,
    isLoading,
    formatDate
  };
};
