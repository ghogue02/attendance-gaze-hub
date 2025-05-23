
import { useState, useEffect, useMemo } from 'react';
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { subDays, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { parseAsUTC, isLateArrivalUTC, getCurrentDateString } from '@/utils/date/dateUtils';

export interface DailyAttendance {
  name: string;
  date: string;
  Present: number;
  Late: number;
  Absent: number;
  Excused: number;
}

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

// Define holidays - dates when we don't have class
const HOLIDAY_DATES = new Set([
  '2025-04-20' // Easter Sunday
]);

// Helper to log date debugging info
const logDateDebug = (dateStr: string, message: string): void => {
  const date = parseAsUTC(dateStr);
  console.log(`${message}: ${dateStr} - UTC Day: ${date.getUTCDay()} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getUTCDay()]})`);
};

// Helper to check if a date is a holiday
const isHoliday = (dateString: string): boolean => {
  return HOLIDAY_DATES.has(dateString);
};

export const useAttendanceChartData = (builders: Builder[], days: number) => {
  const [chartData, setChartData] = useState<DailyAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculate date range once, using the HARDCODED "current" date
  const dateRange = useMemo(() => {
    // Use the hardcoded date string as the end date for consistency
    const hardcodedEndDateStr = getCurrentDateString(); // "2025-03-30"
    const endDate = parseAsUTC(hardcodedEndDateStr); // Parse as UTC Date object
    
    // Calculate start date based on the hardcoded end date
    const startDate = subDays(endDate, days - 1);
    
    // Ensure start date is not before the minimum date
    const adjustedStartDate = isAfter(startDate, MINIMUM_DATE) ? startDate : MINIMUM_DATE;
    
    // Format back to YYYY-MM-DD strings for the query
    const formatToYYYYMMDD = (date: Date): string => date.toISOString().split('T')[0];
    
    const range = {
      start: formatToYYYYMMDD(adjustedStartDate),
      end: formatToYYYYMMDD(endDate) // Use the hardcoded end date here too
    };
    console.log(`Calculated date range for ${days} days:`, range);
    return range;
  }, [days]);
  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      console.log(`Using date range: ${dateRange.start} to ${dateRange.end}`);
      
      try {
        // If no builders are provided, show nothing
        if (!builders || builders.length === 0) {
          setChartData([]);
          setIsLoading(false);
          return;
        }

        // Extract builder IDs for filtering
        const builderIds = builders.map(b => b.id);
        
        console.log(`Fetching attendance for ${builderIds.length} builders between ${dateRange.start} and ${dateRange.end}`);
        
        // Query with filters applied at the database level
        const { data: attendanceData, error } = await supabase
          .from('attendance')
          .select('*')
          .in('student_id', builderIds)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date', { ascending: true });
          
        if (error) {
          console.error('Error fetching historical attendance:', error);
          toast.error('Failed to load attendance history');
          setIsLoading(false);
          return;
        }
        
        console.log('Raw attendance data fetched for chart:', attendanceData?.length || 0, 'records');
        
        // Even if we don't have attendance data, we still want to create the date range
        // to show zeros for days with no records
        
        // Create a map to aggregate attendance by date
        const dateMap = new Map<string, { Present: number; Late: number; Absent: number; Excused: number }>();
        
        // Initialize the dateMap with all dates in the range (excluding Fridays, Thursdays and holidays)
        // Generate all dates in the range - completely recreated to ensure consistency
        const startDateObj = parseAsUTC(dateRange.start);
        const endDateObj = parseAsUTC(dateRange.end);
        
        // Loop through each date in the range and add to the map
        const currentDate = new Date(startDateObj);
        while (currentDate <= endDateObj) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const checkDate = parseAsUTC(dateStr);
          const dayOfWeek = checkDate.getUTCDay(); // Use UTC day
          
          // Skip Fridays (UTC day 5), Thursdays (UTC day 4) and Holidays
          if (dayOfWeek !== 5 && dayOfWeek !== 4 && !isHoliday(dateStr)) {
            dateMap.set(dateStr, {
              Present: 0,
              Late: 0,
              Absent: 0,
              Excused: 0
            });
            logDateDebug(dateStr, `Added to chart`);
          } else {
            const skipReason = dayOfWeek === 5 ? 'Friday' : dayOfWeek === 4 ? 'Thursday' : 'Holiday';
            logDateDebug(dateStr, `Excluding ${skipReason} from chart`);
          }
          
          // Move to next day - add exactly 24 hours to ensure UTC consistency
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        
        console.log("Dates included in chart:", Array.from(dateMap.keys()));
        
        // If we have attendance data, process it
        if (attendanceData && attendanceData.length > 0) {
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
            const recordDate = parseAsUTC(dateStr);
            const dayOfWeek = recordDate.getUTCDay(); // Use UTC day
            
            // Skip Friday, Thursday records and holiday dates
            if (dayOfWeek === 5 || dayOfWeek === 4 || isHoliday(dateStr)) {
              logDateDebug(dateStr, `Skipping ${dayOfWeek === 5 ? 'Friday' : dayOfWeek === 4 ? 'Thursday' : 'Holiday'} records`);
              return;
            }
            
            if (!dateMap.has(dateStr)) {
              // This could happen if the date is outside our range but still got returned
              // Create the entry if it's in our dateRange but wasn't initialized
              const checkDate = parseAsUTC(dateStr);
              const startDateObj = parseAsUTC(dateRange.start);
              const endDateObj = parseAsUTC(dateRange.end);
              
              if (checkDate >= startDateObj && checkDate <= endDateObj && 
                  checkDate.getUTCDay() !== 5 && checkDate.getUTCDay() !== 4 && 
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
                      // Extract UTC hours and minutes
                      const hourUTC = timeRecordedDate.getUTCHours();
                      const minutesUTC = timeRecordedDate.getUTCMinutes();
                      const dayOfWeekUTC = recordDate.getUTCDay();
                      
                      // Use the UTC-based late check
                      isMarkedLate = isLateArrivalUTC(dayOfWeekUTC, hourUTC, minutesUTC);
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
        }
        
        // Convert the map to an array of chart data objects
        const formattedData: DailyAttendance[] = Array.from(dateMap.entries()).map(([dateStr, counts]) => {
          // Parse the date to create a proper display format
          try {
            const date = parseAsUTC(dateStr);
            const dayNum = date.getUTCDate().toString().padStart(2, '0'); // Use UTC date
            const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()]; // Use UTC day
            
            return {
              name: `${dayNum} ${dayOfWeek}`,
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
          const itemDate = parseAsUTC(item.date);
          if (itemDate.getUTCDay() === 5) {
            logDateDebug(item.date, `Removing Friday data from final chart`);
            return false;
          }
          if (itemDate.getUTCDay() === 4) {
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
        
        // Log specific dates data to debug
        const apr1Data = cleanedData.find(d => d.date === '2025-04-01');
        const apr2Data = cleanedData.find(d => d.date === '2025-04-02');
        const apr3Data = cleanedData.find(d => d.date === '2025-04-03');
        console.log('April 1 data:', apr1Data);
        console.log('April 2 data:', apr2Data);
        console.log('April 3 data:', apr3Data);
        
        console.log('Prepared chart data:', cleanedData);
        setChartData(cleanedData);
      } catch (error) {
        console.error('Error preparing chart data:', error);
        toast.error('Error loading attendance chart');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, [days, builders, dateRange]); // Added dateRange to dependencies
  
  return { chartData, isLoading };
};
