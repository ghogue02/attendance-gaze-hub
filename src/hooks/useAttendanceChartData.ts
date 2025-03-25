
import { useState, useEffect, useMemo } from 'react';
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays } from 'date-fns';
import { toast } from 'sonner';

export interface DailyAttendance {
  name: string;
  date: string;
  Present: number;
  Absent: number;
  Excused: number;
}

export const useAttendanceChartData = (builders: Builder[], days: number) => {
  const [chartData, setChartData] = useState<DailyAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculate date range once
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    return {
      start: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
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
        const dateMap = new Map<string, { Present: number; Absent: number; Excused: number }>();
        
        // Initialize the dateMap with all dates in the range (to ensure we have entries even for days with no attendance)
        const currentDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          dateMap.set(dateStr, {
            Present: 0,
            Absent: 0,
            Excused: 0
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Process all attendance records
        attendanceData.forEach(record => {
          const dateStr = record.date;
          
          if (!dateMap.has(dateStr)) {
            // This should not happen with our date filtering, but just in case
            dateMap.set(dateStr, {
              Present: 0,
              Absent: 0,
              Excused: 0
            });
          }
          
          const dateStats = dateMap.get(dateStr)!;
          
          // Map the status properly
          if (record.status === 'present') {
            dateStats.Present++;
          } else if (record.status === 'excused' || (record.status === 'absent' && record.excuse_reason)) {
            dateStats.Excused++;
          } else if (record.status === 'absent') {
            dateStats.Absent++;
          }
        });
        
        // Convert the map to an array of chart data objects
        const formattedData: DailyAttendance[] = Array.from(dateMap.entries()).map(([dateStr, counts]) => {
          // Parse the date to create a proper display format
          try {
            const date = parseISO(dateStr);
            const dayNum = date.getDate().toString().padStart(2, '0');
            const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            
            return {
              name: `${dayNum} ${dayOfWeek}`,
              date: dateStr,
              Present: counts.Present,
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
              Absent: counts.Absent,
              Excused: counts.Excused
            };
          }
        });
        
        // Sort by date (ascending)
        formattedData.sort((a, b) => a.date.localeCompare(b.date));
        
        console.log('Prepared chart data:', formattedData);
        setChartData(formattedData);
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
