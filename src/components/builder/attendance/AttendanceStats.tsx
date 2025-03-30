
import React from 'react';
import { AttendanceRecord } from '../types';

interface AttendanceStatsProps {
  attendanceHistory: AttendanceRecord[];
}

const AttendanceStats = ({ attendanceHistory }: AttendanceStatsProps) => {
  if (attendanceHistory.length === 0) {
    return null;
  }
  
  // Calculate attendance rate
  const presentCount = attendanceHistory.filter(
    record => record.status === 'present' || record.status === 'late'
  ).length;
  
  const attendanceRate = Math.round((presentCount / attendanceHistory.length) * 100);

  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-md">
      <p className="font-medium text-center">
        Overall Attendance Rate: 
        <span className={`ml-2 ${attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {attendanceRate}%
        </span>
      </p>
      <p className="text-xs text-center text-muted-foreground mt-1">
        Based on {attendanceHistory.length} class sessions
      </p>
    </div>
  );
};

export default AttendanceStats;
