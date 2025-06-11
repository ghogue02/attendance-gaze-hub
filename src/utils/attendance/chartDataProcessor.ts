
import { parseAsEastern, isLateArrivalEastern } from '@/utils/date/dateUtils';
import { DailyAttendance } from '@/hooks/types/attendanceChartTypes';
import { logDateDebug, isHoliday } from './chartDateUtils';

export const processAttendanceRecords = (
  attendanceData: any[],
  dateMap: Map<string, { Present: number; Late: number; Absent: number; Excused: number }>,
  dateRange: { start: string; end: string }
) => {
  if (!attendanceData || attendanceData.length === 0) {
    return;
  }

  // Group attendance records by date for more accurate processing
  const recordsByDate = new Map<string, any[]>();
  attendanceData.forEach(record => {
    const dateStr = record.date;
    if (!recordsByDate.has(dateStr)) {
      recordsByDate.set(dateStr, []);
    }
    recordsByDate.get(dateStr)!.push(record);
  });
  
  // Process attendance records by date
  recordsByDate.forEach((records, dateStr) => {
    const recordDate = parseAsEastern(dateStr);
    const dayOfWeek = recordDate.getDay(); // Use Eastern day
    
    // Skip Friday, Thursday records and holiday dates
    if (dayOfWeek === 5 || dayOfWeek === 4 || isHoliday(dateStr)) {
      logDateDebug(dateStr, `Skipping ${dayOfWeek === 5 ? 'Friday' : dayOfWeek === 4 ? 'Thursday' : 'Holiday'} records`);
      return;
    }
    
    if (!dateMap.has(dateStr)) {
      // This could happen if the date is outside our range but still got returned
      // Create the entry if it's in our dateRange but wasn't initialized
      const checkDate = parseAsEastern(dateStr);
      const startDateObj = parseAsEastern(dateRange.start);
      const endDateObj = parseAsEastern(dateRange.end);
      
      if (checkDate >= startDateObj && checkDate <= endDateObj && 
          checkDate.getDay() !== 5 && checkDate.getDay() !== 4 && 
          !isHoliday(dateStr)) {
        dateMap.set(dateStr, {
          Present: 0,
          Late: 0,
          Absent: 0,
          Excused: 0
        });
        logDateDebug(dateStr, `Added missing date to chart`);
      } else {
        logDateDebug(dateStr, `Skipping out-of-range date`);
        return;
      }
    }
    
    const dateStats = dateMap.get(dateStr)!;
    
    // Process all records for this date
    records.forEach(record => {
      // Map the status properly
      if (record.status === 'present') {
        let isMarkedLate = false;
        
        if (record.time_recorded) {
          try {
            // Parse time_recorded as a Date object
            const timeRecordedDate = new Date(record.time_recorded);
            
            if (!isNaN(timeRecordedDate.getTime())) {
              // Use the Eastern Time-based late check
              isMarkedLate = isLateArrivalEastern(timeRecordedDate);
            }
          } catch (e) {
            console.error(`Error parsing time_recorded for record on ${dateStr}: ${record.time_recorded}`, e);
          }
        }
        
        if (isMarkedLate) {
          dateStats.Late++;
        } else {
          dateStats.Present++;
        }
      } else if (record.status === 'late') {
        dateStats.Late++;
      } else if (record.status === 'excused' || (record.status === 'absent' && record.excuse_reason)) {
        dateStats.Excused++;
      } else if (record.status === 'absent') {
        dateStats.Absent++;
      } else if (record.status === 'pending') {
        // Count pending as absent in the chart
        dateStats.Absent++;
      }
    });
    
    // For debugging specific dates
    if (dateStr === '2025-04-01' || dateStr === '2025-04-02' || dateStr === '2025-04-03') {
      console.log(`Attendance counts for ${dateStr}:`, { ...dateStats });
    }
  });
};

export const formatChartData = (
  dateMap: Map<string, { Present: number; Late: number; Absent: number; Excused: number }>
): DailyAttendance[] => {
  // Convert the map to an array of chart data objects
  const formattedData: DailyAttendance[] = Array.from(dateMap.entries()).map(([dateStr, counts]) => {
    // Parse the date to create a proper display format using Eastern Time
    try {
      const date = parseAsEastern(dateStr);
      const dayNum = date.getDate().toString().padStart(2, '0'); // Use Eastern date
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]; // Use Eastern day
      
      return {
        name: `${dayOfWeek} ${dayNum}`,
        date: dateStr,
        Present: counts.Present,
        Late: counts.Late,
        Absent: counts.Absent,
        Excused: counts.Excused
      };
    } catch (e) {
      // Fallback for any invalid dates
      console.error('Error parsing date:', e, dateStr);
      return {
        name: dateStr,
        date: dateStr,
        Present: counts.Present,
        Late: counts.Late,
        Absent: counts.Absent,
        Excused: counts.Excused
      };
    }
  });
  
  // Double-check to ensure no Friday or Thursday data is in the final result
  const cleanedData = formattedData.filter(item => {
    const itemDate = parseAsEastern(item.date);
    if (itemDate.getDay() === 5) {
      logDateDebug(item.date, `Removing Friday data from final chart`);
      return false;
    }
    if (itemDate.getDay() === 4) {
      logDateDebug(item.date, `Removing Thursday data from final chart`);
      return false;
    }
    if (isHoliday(item.date)) {
      logDateDebug(item.date, `Removing Holiday data from final chart`);
      return false;
    }
    return true;
  });
  
  // Sort by date (ascending)
  cleanedData.sort((a, b) => a.date.localeCompare(b.date));
  
  return cleanedData;
};
