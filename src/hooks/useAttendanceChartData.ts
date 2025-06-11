
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
  
  // Calculate date range once, using the HARDCODED "current" date
  const dateRange = useMemo(() => calculateDateRange(days), [days]);
  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch attendance data with cohort filter
        const attendanceData = await fetchAttendanceChartData(builders, dateRange, cohort);
        
        // Initialize date map with all valid class days
        const dateMap = generateDateMap(dateRange.start, dateRange.end);
        
        console.log("Dates included in chart:", Array.from(dateMap.keys()));
        
        // Process attendance records if we have data
        if (attendanceData && attendanceData.length > 0) {
          processAttendanceRecords(attendanceData, dateMap, dateRange);
        }
        
        // Format the data for the chart
        const formattedData = formatChartData(dateMap);
        
        // Log specific dates data to debug
        const apr1Data = formattedData.find(d => d.date === '2025-04-01');
        const apr2Data = formattedData.find(d => d.date === '2025-04-02');
        const apr3Data = formattedData.find(d => d.date === '2025-04-03');
        console.log('April 1 data:', apr1Data);
        console.log('April 2 data:', apr2Data);
        console.log('April 3 data:', apr3Data);
        
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
  }, [days, builders, dateRange, cohort]); // Added cohort to dependencies
  
  return { chartData, isLoading };
};
