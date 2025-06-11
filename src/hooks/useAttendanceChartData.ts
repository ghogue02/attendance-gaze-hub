
import { useState, useEffect, useMemo } from 'react';
import { Builder } from '@/components/builder/types';
import { toast } from 'sonner';
import { DailyAttendance, AttendanceChartHookResult } from './types/attendanceChartTypes';
import { calculateDateRange, generateDateMap } from '@/utils/attendance/chartDateUtils';
import { processAttendanceRecords, formatChartData } from '@/utils/attendance/chartDataProcessor';
import { fetchAttendanceChartData } from '@/services/attendance/chartDataService';

// Change from "export" to "export type" for re-exporting the type
export type { DailyAttendance } from './types/attendanceChartTypes';

export const useAttendanceChartData = (builders: Builder[], days: number): AttendanceChartHookResult => {
  const [chartData, setChartData] = useState<DailyAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculate date range once, using the actual current date
  const dateRange = useMemo(() => calculateDateRange(days), [days]);
  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      
      try {
        console.log(`[useAttendanceChartData] Fetching attendance chart data for date range:`, dateRange);
        console.log(`[useAttendanceChartData] Number of builders: ${builders.length}`);
        console.log(`[useAttendanceChartData] Builder IDs:`, builders.map(b => b.id));
        
        // Fetch attendance data - no cohort filter needed as builders are already filtered
        const attendanceData = await fetchAttendanceChartData(builders, dateRange);
        
        console.log(`[useAttendanceChartData] Fetched ${attendanceData?.length || 0} attendance records`);
        
        // Initialize date map with all valid class days (await the async function)
        const dateMap = await generateDateMap(dateRange.start, dateRange.end);
        
        console.log("Dates included in chart:", Array.from(dateMap.keys()));
        
        // Process attendance records if we have data
        if (attendanceData && attendanceData.length > 0) {
          await processAttendanceRecords(attendanceData, dateMap, dateRange);
        } else {
          console.log('No attendance data found for the specified date range and builders');
        }
        
        // Format the data for the chart (await the async function)
        const formattedData = await formatChartData(dateMap);
        
        console.log('[useAttendanceChartData] Final chart data:', formattedData);
        setChartData(formattedData);
      } catch (error) {
        console.error('Error preparing chart data:', error);
        toast.error('Error loading attendance chart');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, [days, builders, dateRange]); // Removed cohort from dependencies since builders are pre-filtered
  
  return { chartData, isLoading };
};
