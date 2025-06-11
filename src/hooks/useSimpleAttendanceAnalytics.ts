
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/builder/types';
import { toast } from 'sonner';
import { isClassDaySync } from '@/utils/attendance/isClassDay';

export interface AttendanceAnalytics {
  daily: Array<{
    date: string;
    present: number;
    late: number;
    absent: number;
    excused: number;
    total: number;
  }>;
  summary: {
    totalPresent: number;
    totalLate: number;
    totalAbsent: number;
    totalExcused: number;
    totalRecords: number;
  };
}

export const useSimpleAttendanceAnalytics = (builders: Builder[], days: number) => {
  const [data, setData] = useState<AttendanceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Prevent multiple concurrent requests
  const requestInProgress = useRef(false);
  
  // Memoize builder IDs to prevent unnecessary re-renders
  const builderIds = useMemo(() => {
    return builders.map(b => b.id);
  }, [builders]);
  
  // Memoize date range calculation
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }, [days]);

  useEffect(() => {
    console.log(`[Analytics] Time frame changed to ${days} days, resetting request state`);
    
    // Reset request state when time frame changes
    requestInProgress.current = false;
    setIsLoading(true);
    setError(null);
    
    const fetchAnalytics = async () => {
      // Prevent concurrent requests
      if (requestInProgress.current) {
        console.log('[Analytics] Request already in progress, skipping');
        return;
      }

      // Skip if no builders
      if (builderIds.length === 0) {
        console.log('[Analytics] No builders, setting empty data');
        setData({
          daily: [],
          summary: { totalPresent: 0, totalLate: 0, totalAbsent: 0, totalExcused: 0, totalRecords: 0 }
        });
        setIsLoading(false);
        return;
      }

      requestInProgress.current = true;
      
      try {
        console.log(`[Analytics] Fetching data for ${builderIds.length} builders over ${days} days`);
        console.log(`[Analytics] Date range: ${dateRange.start} to ${dateRange.end}`);

        // Fetch attendance data
        const { data: attendanceData, error: fetchError } = await supabase
          .from('attendance')
          .select('date, status, student_id')
          .in('student_id', builderIds)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date', { ascending: true });

        if (fetchError) {
          throw new Error(`Failed to fetch attendance data: ${fetchError.message}`);
        }

        console.log(`[Analytics] Found ${attendanceData?.length || 0} attendance records`);

        // Process the data
        const dailyMap = new Map<string, { present: number; late: number; absent: number; excused: number; total: number }>();
        let totalPresent = 0, totalLate = 0, totalAbsent = 0, totalExcused = 0;

        // Initialize all dates in range using the centralized class day logic
        const startDateObj = new Date(dateRange.start);
        const endDateObj = new Date(dateRange.end);
        
        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          // Use the centralized class day logic instead of hardcoded day checks
          if (isClassDaySync(dateStr)) {
            dailyMap.set(dateStr, { present: 0, late: 0, absent: 0, excused: 0, total: 0 });
            console.log(`[Analytics] Added class day: ${dateStr}`);
          } else {
            console.log(`[Analytics] Skipped non-class day: ${dateStr}`);
          }
        }

        // Process attendance records
        attendanceData?.forEach(record => {
          const dateStats = dailyMap.get(record.date);
          if (!dateStats) {
            console.log(`[Analytics] Skipping record for non-class day: ${record.date}`);
            return; // Skip if date not in our valid class days
          }
          
          dateStats.total++;
          
          switch (record.status) {
            case 'present':
              dateStats.present++;
              totalPresent++;
              break;
            case 'late':
              dateStats.late++;
              totalLate++;
              break;
            case 'excused':
              dateStats.excused++;
              totalExcused++;
              break;
            case 'absent':
            case 'pending':
            default:
              dateStats.absent++;
              totalAbsent++;
              break;
          }
        });

        // Convert to array format for charts
        const daily = Array.from(dailyMap.entries())
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const analytics: AttendanceAnalytics = {
          daily,
          summary: {
            totalPresent,
            totalLate,
            totalAbsent,
            totalExcused,
            totalRecords: totalPresent + totalLate + totalAbsent + totalExcused
          }
        };

        console.log(`[Analytics] Processed data for ${days} days:`, analytics);
        setData(analytics);
        
      } catch (err) {
        console.error('[Analytics] Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        toast.error(`Failed to load analytics: ${errorMessage}`);
      } finally {
        setIsLoading(false);
        requestInProgress.current = false;
      }
    };

    // Small delay to prevent rapid consecutive calls and ensure state is properly reset
    const timeoutId = setTimeout(fetchAnalytics, 150);
    
    return () => {
      clearTimeout(timeoutId);
      // Don't reset requestInProgress here as it might interfere with ongoing requests
    };
  }, [builderIds, days]); // Removed dateRange dependencies as they're derived from days

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      requestInProgress.current = false;
    };
  }, []);

  return { data, isLoading, error };
};
