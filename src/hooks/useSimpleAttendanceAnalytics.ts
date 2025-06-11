
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`[Analytics] Fetching data for ${builders.length} builders over ${days} days`);
        
        if (builders.length === 0) {
          console.log('[Analytics] No builders provided, setting empty data');
          setData({
            daily: [],
            summary: { totalPresent: 0, totalLate: 0, totalAbsent: 0, totalExcused: 0, totalRecords: 0 }
          });
          return;
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days + 1);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log(`[Analytics] Date range: ${startDateStr} to ${endDateStr}`);
        
        // Get builder IDs
        const builderIds = builders.map(b => b.id);
        console.log(`[Analytics] Builder IDs:`, builderIds);

        // Fetch attendance data
        const { data: attendanceData, error: fetchError } = await supabase
          .from('attendance')
          .select('date, status, student_id')
          .in('student_id', builderIds)
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .order('date', { ascending: true });

        if (fetchError) {
          console.error('[Analytics] Database error:', fetchError);
          throw new Error(`Failed to fetch attendance data: ${fetchError.message}`);
        }

        console.log(`[Analytics] Found ${attendanceData?.length || 0} attendance records`);

        // Process the data
        const dailyMap = new Map<string, { present: number; late: number; absent: number; excused: number; total: number }>();
        let totalPresent = 0, totalLate = 0, totalAbsent = 0, totalExcused = 0;

        // Initialize all dates in range
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
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
      }
    };

    fetchAnalytics();
  }, [builders, days]);

  return { data, isLoading, error };
};
