
import React, { useEffect, useState } from 'react';
import { AttendanceRecord } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { calculateAttendanceRate } from '@/utils/attendance/calculationUtils';

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
    const calculateStats = async () => {
      if (attendanceHistory.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Get current date
        const currentDate = new Date();
        
        // Start date is March 15, 2025
        const startDate = new Date('2025-03-15');
        
        // Calculate total days between start date and current date
        const totalDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Count the Fridays between the start date and current date
        let fridayCount = 0;
        const tempDate = new Date(startDate);
        while (tempDate <= currentDate) {
          if (tempDate.getDay() === 5) { // 5 = Friday
            fridayCount++;
          }
          tempDate.setDate(tempDate.getDate() + 1);
        }
        
        // Calculate denominator: Total days minus Fridays
        const totalClassDaysCount = totalDays - fridayCount;
        
        // Count days when student was present or late
        const presentOrLateDays = attendanceHistory.filter(record => {
          return (record.status === 'present' || record.status === 'late');
        }).length;
        
        // Calculate attendance rate
        // Cap the rate at 100% maximum
        const rate = Math.min(100, Math.round((presentOrLateDays / totalClassDaysCount) * 100) || 0);
        
        console.log(`AttendanceStats: Present days: ${presentOrLateDays}, Total class days: ${totalClassDaysCount}`);
        console.log(`AttendanceStats: Final rate: ${rate}%`);
        
        setAttendanceRate(rate);
        setPresentCount(presentOrLateDays);
        setTotalClassDays(totalClassDaysCount);
      } catch (error) {
        console.error('Error calculating attendance rate:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    calculateStats();
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
