
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/builder/types';
import { toast } from 'sonner';

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
    // Prevent concurrent requests
    if (requestInProgress.current) {
      return;
    }

    const fetchAnalytics = async () => {
      // Skip if already loading or no builders
      if (requestInProgress.current || builderIds.length === 0) {
        if (builderIds.length === 0) {
          setData({
            daily: [],
            summary: { totalPresent: 0, totalLate: 0, totalAbsent: 0, totalExcused: 0, totalRecords: 0 }
          });
          setIsLoading(false);
        }
        return;
      }

      requestInProgress.current = true;
      setIsLoading(true);
      setError(null);
      
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

        // Initialize all dates in range (excluding weekends)
        const startDateObj = new Date(dateRange.start);
        const endDateObj = new Date(dateRange.end);
        
        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const dayOfWeek = d.getDay();
          
          // Skip Fridays (5) and Sundays (0) - no classes
          if (dayOfWeek !== 5 && dayOfWeek !== 0) {
            dailyMap.set(dateStr, { present: 0, late: 0, absent: 0, excused: 0, total: 0 });
          }
        }

        // Process attendance records
        attendanceData?.forEach(record => {
          const dateStats = dailyMap.get(record.date);
          if (!dateStats) return; // Skip if date not in our valid class days
          
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

        console.log('[Analytics] Processed data:', analytics);
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

    // Small delay to prevent rapid consecutive calls
    const timeoutId = setTimeout(fetchAnalytics, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [builderIds, days, dateRange.start, dateRange.end]);

  return { data, isLoading, error };
};
