
import { parseAsEastern, isLateArrivalEastern } from '@/utils/date/dateUtils';
import { DailyAttendance } from '@/hooks/types/attendanceChartTypes';
import { logDateDebug } from './chartDateUtils';
import { isClassDay } from '@/utils/attendance/isClassDay';

export const processAttendanceRecords = async (
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
  for (const [dateStr, records] of recordsByDate.entries()) {
    // Use the async centralized class day logic
    const isValidClassDay = await isClassDay(dateStr);
    if (!isValidClassDay) {
      logDateDebug(dateStr, `Skipping non-class day records`);
      continue;
    }
    
    if (!dateMap.has(dateStr)) {
      // This could happen if the date is outside our range but still got returned
      // Create the entry if it's in our dateRange and is a class day
      const checkDate = parseAsEastern(dateStr);
      const startDateObj = parseAsEastern(dateRange.start);
      const endDateObj = parseAsEastern(dateRange.end);
      
      if (checkDate >= startDateObj && checkDate <= endDateObj && isValidClassDay) {
        dateMap.set(dateStr, {
          Present: 0,
          Late: 0,
          Absent: 0,
          Excused: 0
        });
        logDateDebug(dateStr, `Added missing class day to chart`);
      } else {
        logDateDebug(dateStr, `Skipping out-of-range or non-class day`);
        continue;
      }
    }
    
    const dateStats = dateMap.get(dateStr)!;
    let absencesForDate = 0;
    
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
        absencesForDate++;
      } else if (record.status === 'pending') {
        // Count pending as absent in the chart
        dateStats.Absent++;
        absencesForDate++;
      }
    });
    
    // Log absence processing for debugging
    if (absencesForDate > 0) {
      console.log(`[chartDataProcessor] Processed ${absencesForDate} absences for ${dateStr}. Total absent count: ${dateStats.Absent}`);
    }
    
    // For debugging specific dates
    if (dateStr === '2025-04-01' || dateStr === '2025-04-02' || dateStr === '2025-04-03') {
      console.log(`Attendance counts for ${dateStr}:`, { ...dateStats });
    }
  }
};

export const formatChartData = async (
  dateMap: Map<string, { Present: number; Late: number; Absent: number; Excused: number }>
): Promise<DailyAttendance[]> => {
  // Convert the map to an array of chart data objects
  const formattedData: DailyAttendance[] = [];
  
  for (const [dateStr, counts] of dateMap.entries()) {
    // Parse the date to create a proper display format using Eastern Time
    try {
      const date = parseAsEastern(dateStr);
      const dayNum = date.getDate().toString().padStart(2, '0'); // Use Eastern date
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]; // Use Eastern day
      
      formattedData.push({
        name: `${dayOfWeek} ${dayNum}`,
        date: dateStr,
        Present: counts.Present,
        Late: counts.Late,
        Absent: counts.Absent,
        Excused: counts.Excused
      });
    } catch (e) {
      // Fallback for any invalid dates
      console.error('Error parsing date:', e, dateStr);
      formattedData.push({
        name: dateStr,
        date: dateStr,
        Present: counts.Present,
        Late: counts.Late,
        Absent: counts.Absent,
        Excused: counts.Excused
      });
    }
  }
  
  // Double-check to ensure no non-class days are in the final result
  const cleanedData: DailyAttendance[] = [];
  for (const item of formattedData) {
    const isValidClassDay = await isClassDay(item.date);
    if (!isValidClassDay) {
      logDateDebug(item.date, `Removing non-class day from final chart`);
    } else {
      cleanedData.push(item);
    }
  }
  
  // Sort by date (ascending)
  cleanedData.sort((a, b) => a.date.localeCompare(b.date));
  
  console.log(`[formatChartData] Final chart data contains ${cleanedData.length} days`);
  const daysWithAbsences = cleanedData.filter(d => d.Absent > 0);
  if (daysWithAbsences.length > 0) {
    console.log(`[formatChartData] Days with absences in final data:`, daysWithAbsences.map(d => ({ date: d.date, absent: d.Absent })));
  }
  
  return cleanedData;
};
