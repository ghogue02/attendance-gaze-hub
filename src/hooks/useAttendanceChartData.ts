
import { useState, useEffect, useMemo } from 'react';
import { Builder } from '@/components/builder/types';
import { toast } from 'sonner';
import { DailyAttendance, AttendanceChartHookResult } from './types/attendanceChartTypes';
import { calculateDateRange, generateDateMap } from '@/utils/attendance/chartDateUtils';
import { processAttendanceRecords, formatChartData } from '@/utils/attendance/chartDataProcessor';
import { fetchAttendanceChartData } from '@/services/attendance/chartDataService';

// Change from "export" to "export type" for re-exporting the type
export type { DailyAttendance } from './types/attendanceChartTypes';

export const useAttendanceChartData = (builders: Builder[], days: number, cohort?: string): AttendanceChartHookResult => {
  const [chartData, setChartData] = useState<DailyAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculate date range once, using the actual current date
  const dateRange = useMemo(() => calculateDateRange(days), [days]);
  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      
      try {
        console.log(`Fetching attendance chart data for date range:`, dateRange);
        console.log(`Number of builders: ${builders.length}, Cohort filter: ${cohort || 'All'}`);
        
        // Fetch attendance data with cohort filter
        const attendanceData = await fetchAttendanceChartData(builders, dateRange, cohort);
        
        console.log(`Fetched ${attendanceData?.length || 0} attendance records`);
        
        // Initialize date map with all valid class days
        const dateMap = generateDateMap(dateRange.start, dateRange.end);
        
        console.log("Dates included in chart:", Array.from(dateMap.keys()));
        
        // Process attendance records if we have data
        if (attendanceData && attendanceData.length > 0) {
          processAttendanceRecords(attendanceData, dateMap, dateRange);
        } else {
          console.log('No attendance data found for the specified date range');
        }
        
        // Format the data for the chart
        const formattedData = formatChartData(dateMap);
        
        console.log('Final chart data:', formattedData);
        setChartData(formattedData);
      } catch (error) {
        console.error('Error preparing chart data:', error);
        toast.error('Error loading attendance chart');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, [days, builders, dateRange, cohort]); // Added cohort to dependencies
  
  return { chartData, isLoading };
};
