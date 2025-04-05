
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
    return !isFriday && !isApril4th && date >= MINIMUM_DATE;
  });
  
  if (filteredHistory.length === 0) {
    return null;
  }
  
  // Calculate attendance rate based on filtered history
  const presentCount = filteredHistory.filter(
    record => record.status === 'present' || record.status === 'late'
  ).length;
  
  // If all records are present/late, ensure we display exactly 100% rather than rounding errors
  const attendanceRate = presentCount === filteredHistory.length ? 
    100 : 
    Math.round((presentCount / filteredHistory.length) * 100);

  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-md">
      <p className="font-medium text-center">
        Overall Attendance Rate: 
        <span className={`ml-2 ${attendanceRate >= 94 ? 'text-green-600' : attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
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
