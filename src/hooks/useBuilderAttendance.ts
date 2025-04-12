
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/attendance/formatUtils';

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
    
    const calculateAttendanceRate = async () => {
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
        
        if (!data || data.length === 0) {
          console.log('No attendance records found for student');
          setAttendanceRate(0);
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
        
        // Create a Set of all unique dates
        const allDatesSet = new Set<string>();
        allAttendanceData?.forEach(record => {
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
        
        const allValidClassDates = Array.from(allDatesSet);
        
        console.log(`Total valid class dates: ${allValidClassDates.length}`);
        
        if (allValidClassDates.length === 0) {
          console.log('No valid class dates found');
          setAttendanceRate(0);
          return;
        }
        
        // Now filter the student's records to count present/late days
        const studentRecords = data.filter(record => {
          const recordDate = new Date(record.date);
          const isFriday = recordDate.getDay() === 5;
          const isApril4th = record.date === APRIL_4_2025;
          const isApril11th = record.date === APRIL_11_2025;
          const isBeforeMinDate = recordDate < MINIMUM_DATE;
          
          return !isFriday && !isApril4th && !isApril11th && !isBeforeMinDate;
        });
        
        // Count days when student was present or late
        const presentCount = studentRecords.filter(record => 
          record.status === 'present' || record.status === 'late'
        ).length;
        
        // Calculate attendance rate using ALL valid class dates as denominator
        const rate = Math.round((presentCount / allValidClassDates.length) * 100);
        console.log(`Student present days: ${presentCount}, Total class days: ${allValidClassDates.length}`);
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
