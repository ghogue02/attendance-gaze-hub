
import { useState, useEffect, useMemo } from 'react';
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { parseAsUTC, isLateArrivalUTC } from '@/utils/date/dateUtils';

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

// Helper to log date debugging info
const logDateDebug = (dateStr: string, message: string): void => {
  const date = parseAsUTC(dateStr);
  console.log(`${message}: ${dateStr} - UTC Day: ${date.getUTCDay()} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getUTCDay()]})`);
};

export const useAttendanceChartData = (builders: Builder[], days: number) => {
  const [chartData, setChartData] = useState<DailyAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculate date range once
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    
    // Ensure start date is not before the minimum date
    const adjustedStartDate = isAfter(startDate, MINIMUM_DATE) ? startDate : MINIMUM_DATE;
    
    return {
      start: adjustedStartDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      end: endDate.toISOString().split('T')[0]
    };
  }, [days]);
  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      
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
        
        if (!attendanceData || attendanceData.length === 0) {
          setChartData([]);
          setIsLoading(false);
          return;
        }
        
        // Create a map to aggregate attendance by date
        const dateMap = new Map<string, { Present: number; Late: number; Absent: number; Excused: number }>();
        
        // Initialize the dateMap with all dates in the range (excluding Fridays)
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        const datesInRange: string[] = [];
        
        // Generate all dates in the range
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const checkDate = parseAsUTC(dateStr);
          const dayOfWeek = checkDate.getUTCDay(); // Use UTC day
          
          // Skip Fridays (UTC day 5)
          if (dayOfWeek !== 5) {
            dateMap.set(dateStr, {
              Present: 0,
              Late: 0,
              Absent: 0,
              Excused: 0
            });
            datesInRange.push(dateStr);
            logDateDebug(dateStr, `Added to chart`);
          } else {
            logDateDebug(dateStr, `Excluding Friday from chart`);
          }
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log("Dates included in chart:", datesInRange);
        console.log("Day of week for each date in chart:");
        datesInRange.forEach(dateStr => {
          const date = parseAsUTC(dateStr);
          console.log(`${dateStr}: UTC Day ${date.getUTCDay()} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getUTCDay()]})`);
        });
        
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
          
          // Skip Friday records
          if (dayOfWeek === 5) {
            logDateDebug(dateStr, `Skipping Friday records`);
            return;
          }
          
          if (!dateMap.has(dateStr)) {
            // This could happen if the date is outside our range but still got returned
            // Create the entry if it's in our dateRange but wasn't initialized
            const checkDate = parseAsUTC(dateStr);
            const startDateObj = parseAsUTC(dateRange.start);
            const endDateObj = parseAsUTC(dateRange.end);
            
            if (checkDate >= startDateObj && checkDate <= endDateObj && checkDate.getUTCDay() !== 5) {
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
            // Map the status properly with late detection using UTC time
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
                    
                    // Debug logging for weekend days
                    if (dayOfWeekUTC === 0 || dayOfWeekUTC === 6) {
                      console.log(`DEBUG ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeekUTC]} ${dateStr}: ` +
                        `time=${record.time_recorded}, UTC Hour=${hourUTC}, UTC Min=${minutesUTC}, isLate=${isMarkedLate}`);
                    }
                  } else {
                    console.warn(`Invalid time_recorded format for record on ${dateStr}: ${record.time_recorded}`);
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
            }
          });
          
          // For debugging specific dates
          if (dateStr === '2025-03-29' || dateStr === '2025-03-30') {
            console.log(`Attendance counts for ${dateStr}:`, { ...dateStats });
          }
        });
        
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
        
        // Double-check to ensure no Friday data is in the final result
        const cleanedData = formattedData.filter(item => {
          const itemDate = parseAsUTC(item.date);
          if (itemDate.getUTCDay() === 5) {
            logDateDebug(item.date, `Removing Friday data from final chart`);
            return false;
          }
          return true;
        });
        
        // Sort by date (ascending)
        cleanedData.sort((a, b) => a.date.localeCompare(b.date));
        
        // Log specific dates data to debug
        const mar29Data = cleanedData.find(d => d.date === '2025-03-29');
        const mar30Data = cleanedData.find(d => d.date === '2025-03-30');
        console.log('March 29 data:', mar29Data);
        console.log('March 30 data:', mar30Data);
        
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
  }, [days, builders, dateRange]); // Added builders and dateRange to dependencies
  
  return { chartData, isLoading };
};
