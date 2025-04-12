
import React from 'react';
import { AttendanceRecord } from '../types';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

interface AttendanceStatsProps {
  attendanceHistory: AttendanceRecord[];
}

const AttendanceStats = ({ attendanceHistory }: AttendanceStatsProps) => {
  if (attendanceHistory.length === 0) {
    return null;
  }
  
  // Filter out any records for Fridays or April 4th, 2025, or before MINIMUM_DATE
  const filteredHistory = attendanceHistory.filter(record => {
    const date = new Date(record.date);
    const isFriday = date.getDay() === 5;
    const isApril4th = date.getFullYear() === 2025 && 
                      date.getMonth() === 3 && // April is month 3 (0-indexed)
                      date.getDate() === 4;
    const isApril11th = date.getFullYear() === 2025 && 
                       date.getMonth() === 3 && 
                       date.getDate() === 11;
    return !isFriday && !isApril4th && !isApril11th && date >= MINIMUM_DATE;
  });
  
  if (filteredHistory.length === 0) {
    return null;
  }
  
  // Calculate attendance rate based on filtered history - count present and late as attended
  const presentCount = filteredHistory.filter(
    record => record.status === 'present' || record.status === 'late'
  ).length;
  
  console.log(`AttendanceStats: Present/late count: ${presentCount}, Total filtered: ${filteredHistory.length}`);
  
  // Calculate the attendance percentage
  const attendanceRate = filteredHistory.length > 0 
    ? Math.round((presentCount / filteredHistory.length) * 100) 
    : 0;

  console.log(`AttendanceStats: Final rate: ${attendanceRate}%`);

  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-md">
      <p className="font-medium text-center">
        Overall Attendance Rate: 
        <span className={`ml-2 ${attendanceRate === 100 ? 'text-green-600 font-bold' : attendanceRate >= 94 ? 'text-green-600' : attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {attendanceRate}%
        </span>
      </p>
      <p className="text-xs text-center text-muted-foreground mt-1">
        Based on {filteredHistory.length} class sessions
      </p>
    </div>
  );
};

export default AttendanceStats;
