
import React, { useEffect, useState } from 'react';
import { AttendanceRecord } from '../types';
import { calculateAttendanceStatistics } from '@/utils/attendance/calculationUtils';

interface AttendanceStatsProps {
  attendanceHistory: AttendanceRecord[];
}

const AttendanceStats = ({ attendanceHistory }: AttendanceStatsProps) => {
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [totalClassDays, setTotalClassDays] = useState<number>(0);
  const [presentCount, setPresentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Function to calculate attendance statistics
    const updateStats = () => {
      if (attendanceHistory.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Use the consolidated calculation function
        const stats = calculateAttendanceStatistics(attendanceHistory);
        
        console.log(`AttendanceStats: Present days: ${stats.presentCount}, Total class days: ${stats.totalClassDays}`);
        console.log(`AttendanceStats: Final rate: ${stats.rate}%`);
        
        // Update all state values from the calculation result
        setAttendanceRate(stats.rate);
        setPresentCount(stats.presentCount);
        setTotalClassDays(stats.totalClassDays);
      } catch (error) {
        console.error('Error calculating attendance rate:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    updateStats();
  }, [attendanceHistory]);

  if (isLoading) {
    return <div className="mb-4 p-3 bg-muted/30 rounded-md">
      <p className="text-center">Calculating attendance rate...</p>
    </div>;
  }

  if (totalClassDays === 0) {
    return <div className="mb-4 p-3 bg-muted/30 rounded-md">
      <p className="text-center text-sm text-muted-foreground">
        No class days have occurred yet since the start date (March 15, 2025).
      </p>
    </div>;
  }

  // Calculate the correct ratio to display
  const attendedCount = Math.min(presentCount, totalClassDays);
  
  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-md">
      <p className="font-medium text-center">
        Overall Attendance Rate: 
        <span className={`ml-2 ${
          attendanceRate >= 95 ? 'text-green-600 font-bold' : 
          attendanceRate >= 85 ? 'text-green-600' : 
          attendanceRate >= 75 ? 'text-orange-600' : 
          attendanceRate >= 60 ? 'text-yellow-600' : 
          'text-red-600'
        }`}>
          {attendanceRate}%
        </span>
      </p>
      <p className="text-xs text-center text-muted-foreground mt-1">
        Based on {attendedCount}/{totalClassDays} class sessions attended
      </p>
    </div>
  );
};

export default AttendanceStats;
