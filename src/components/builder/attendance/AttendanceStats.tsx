
import React, { useEffect, useState } from 'react';
import { AttendanceRecord } from '../types';
import { supabase } from '@/integrations/supabase/client';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

interface AttendanceStatsProps {
  attendanceHistory: AttendanceRecord[];
}

const AttendanceStats = ({ attendanceHistory }: AttendanceStatsProps) => {
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [totalClassDays, setTotalClassDays] = useState<number>(0);
  const [presentCount, setPresentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Function to calculate attendance rate
    const calculateAttendanceRate = async () => {
      if (attendanceHistory.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Get all attendance dates from the database to determine total class days
        const { data: allAttendanceData, error } = await supabase
          .from('attendance')
          .select('date')
          .order('date');
          
        if (error) {
          console.error('Error fetching all attendance dates:', error);
          setIsLoading(false);
          return;
        }
        
        // Filter dates to get valid class days
        const allDatesSet = new Set<string>();
        allAttendanceData?.forEach(record => {
          const date = new Date(record.date);
          const isFriday = date.getDay() === 5;
          const isApril4th = date.getFullYear() === 2025 && 
                            date.getMonth() === 3 && // April is month 3 (0-indexed)
                            date.getDate() === 4;
          const isApril11th = date.getFullYear() === 2025 && 
                            date.getMonth() === 3 && 
                            date.getDate() === 11;
          const isBeforeMinDate = date < MINIMUM_DATE;
          
          if (!isFriday && !isApril4th && !isApril11th && !isBeforeMinDate) {
            allDatesSet.add(record.date);
          }
        });
        
        const validClassDates = Array.from(allDatesSet);
        
        if (validClassDates.length === 0) {
          setIsLoading(false);
          return;
        }
        
        console.log(`AttendanceStats: Total valid class days: ${validClassDates.length}`);
        setTotalClassDays(validClassDates.length);
        
        // Filter builder's attendance records
        const filteredHistory = attendanceHistory.filter(record => {
          const date = new Date(record.date);
          const isFriday = date.getDay() === 5;
          const isApril4th = date.getFullYear() === 2025 && 
                          date.getMonth() === 3 && 
                          date.getDate() === 4;
          const isApril11th = date.getFullYear() === 2025 && 
                           date.getMonth() === 3 && 
                           date.getDate() === 11;
          return !isFriday && !isApril4th && !isApril11th && date >= MINIMUM_DATE;
        });
        
        // Calculate attendance rate based on filtered history - count present and late as attended
        const present = filteredHistory.filter(
          record => record.status === 'present' || record.status === 'late'
        ).length;
        
        setPresentCount(present);
        
        // Calculate the attendance percentage and cap it at 100%
        const rate = Math.min(100, Math.round((present / validClassDates.length) * 100));

        console.log(`AttendanceStats: Present days: ${present}, Total class days: ${validClassDates.length}`);
        console.log(`AttendanceStats: Final rate: ${rate}%`);
        
        setAttendanceRate(rate);
      } catch (error) {
        console.error('Error calculating attendance rate:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    calculateAttendanceRate();
  }, [attendanceHistory]);

  if (isLoading) {
    return <div className="mb-4 p-3 bg-muted/30 rounded-md">
      <p className="text-center">Calculating attendance rate...</p>
    </div>;
  }

  if (totalClassDays === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-md">
      <p className="font-medium text-center">
        Overall Attendance Rate: 
        <span className={`ml-2 ${attendanceRate === 100 ? 'text-green-600 font-bold' : attendanceRate >= 94 ? 'text-green-600' : attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {attendanceRate}%
        </span>
      </p>
      <p className="text-xs text-center text-muted-foreground mt-1">
        Based on {presentCount}/{totalClassDays} class sessions attended
      </p>
    </div>
  );
};

export default AttendanceStats;
