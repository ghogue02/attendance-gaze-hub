
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
    const fetchAndCalculateRate = async () => {
      if (attendanceHistory.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Get all attendance dates from the database to determine total class days
        const { data: allAttendanceData, error } = await supabase
          .from('attendance')
          .select('date, status')
          .order('date');
          
        if (error) {
          console.error('Error fetching all attendance dates:', error);
          setIsLoading(false);
          return;
        }
        
        // Use the shared calculation utility
        const { rate, presentDays, totalDays } = calculateAttendanceRate(
          attendanceHistory.map(r => ({ 
            date: r.date, 
            status: r.status 
          })),
          allAttendanceData || [],
          true // Return detailed stats
        );
        
        console.log(`AttendanceStats: Present days: ${presentDays}, Total class days: ${totalDays}`);
        console.log(`AttendanceStats: Final rate: ${rate}%`);
        
        setAttendanceRate(rate);
        setPresentCount(presentDays);
        setTotalClassDays(totalDays);
      } catch (error) {
        console.error('Error calculating attendance rate:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAndCalculateRate();
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
